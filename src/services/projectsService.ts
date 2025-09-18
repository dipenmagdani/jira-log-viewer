/**
 * Projects API Service
 *
 * This service handles all project-related API calls using axios and React Query.
 */

import {
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "../lib/axios";
import { queryKeys } from "../lib/queryClient";
import { JiraProject, ApiResponse } from "../types";
import { API_ENDPOINTS } from "../constants";

// ============================================================================
// Types
// ============================================================================

interface ProjectsListParams {
  search?: string;
  projectTypeKey?: string;
  orderBy?: "key" | "name" | "projectTypeKey";
  expand?: string[];
}

interface ProjectsListResponse {
  projects: JiraProject[];
  total: number;
  maxResults: number;
  startAt: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch all projects
 */
const fetchProjects = async (
  params: ProjectsListParams = {}
): Promise<JiraProject[]> => {
  const response = await apiClient.get<ApiResponse<JiraProject[]>>(
    API_ENDPOINTS.INTERNAL.PROJECTS,
    { params }
  );

  return response.data.data;
};

/**
 * Fetch a single project by key
 */
const fetchProjectByKey = async (key: string): Promise<JiraProject> => {
  const response = await apiClient.get<ApiResponse<JiraProject>>(
    `${API_ENDPOINTS.INTERNAL.PROJECTS}/${key}`
  );

  return response.data.data;
};

/**
 * Search projects
 */
const searchProjects = async (query: string): Promise<JiraProject[]> => {
  const response = await apiClient.get<ApiResponse<JiraProject[]>>(
    `${API_ENDPOINTS.INTERNAL.PROJECTS}/search`,
    { params: { q: query } }
  );

  return response.data.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for fetching all projects
 */
export const useProjects = (
  params: ProjectsListParams = {},
  options?: UseQueryOptions<JiraProject[], Error>
) => {
  return useQuery({
    queryKey: queryKeys.projects.list(params),
    queryFn: () => fetchProjects(params),
    staleTime: 5 * 60 * 1000, // 5 minutes - projects don't change often
    ...options,
  });
};

/**
 * Hook for fetching a single project
 */
export const useProject = (
  key: string,
  options?: UseQueryOptions<JiraProject, Error>
) => {
  return useQuery({
    queryKey: queryKeys.projects.detail(key),
    queryFn: () => fetchProjectByKey(key),
    enabled: !!key,
    staleTime: 10 * 60 * 1000, // 10 minutes
    ...options,
  });
};

/**
 * Hook for searching projects
 */
export const useSearchProjects = (
  query: string,
  options?: UseQueryOptions<JiraProject[], Error>
) => {
  return useQuery({
    queryKey: queryKeys.projects.list({ search: query }),
    queryFn: () => searchProjects(query),
    enabled: !!query && query.length >= 2, // Only search with 2+ characters
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get project name by key from cache
 */
export const useProjectName = (projectKey: string): string => {
  const queryClient = useQueryClient();

  // Try to find project in cached data
  const cachedProjects = queryClient.getQueryData(queryKeys.projects.all()) as
    | JiraProject[]
    | undefined;
  const project = cachedProjects?.find((p) => p.key === projectKey);

  return project?.name || projectKey;
};

/**
 * Get project by key from cache
 */
export const useProjectFromCache = (
  projectKey: string
): JiraProject | undefined => {
  const queryClient = useQueryClient();

  // First try specific project cache
  const cachedProject = queryClient.getQueryData(
    queryKeys.projects.detail(projectKey)
  ) as JiraProject | undefined;
  if (cachedProject) return cachedProject;

  // Then try projects list cache
  const cachedProjects = queryClient.getQueryData(queryKeys.projects.all()) as
    | JiraProject[]
    | undefined;
  return cachedProjects?.find((p) => p.key === projectKey);
};

/**
 * Prefetch project data
 */
export const usePrefetchProject = () => {
  const queryClient = useQueryClient();

  return (projectKey: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.projects.detail(projectKey),
      queryFn: () => fetchProjectByKey(projectKey),
      staleTime: 10 * 60 * 1000,
    });
  };
};
