/**
 * Issues API Service
 * 
 * This service handles all issue-related API calls using axios and React Query.
 */

import { 
  useQuery, 
  useQueryClient,
  UseQueryOptions 
} from '@tanstack/react-query';
import { apiClient } from '../lib/axios';
import { queryKeys } from '../lib/queryClient';
import { JiraIssue, JiraIssueType, ApiResponse } from '../types';
import { API_ENDPOINTS } from '../constants';

// ============================================================================
// Types
// ============================================================================

interface IssueSearchParams {
  jql?: string;
  fields?: string[];
  expand?: string[];
  maxResults?: number;
  startAt?: number;
  orderBy?: string;
}

interface IssueSearchResponse {
  issues: JiraIssue[];
  total: number;
  maxResults: number;
  startAt: number;
}

interface IssuesByProjectParams {
  projectKey: string;
  issueType?: string;
  status?: string;
  assignee?: string;
  maxResults?: number;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Search issues using JQL
 */
const searchIssues = async (params: IssueSearchParams = {}): Promise<IssueSearchResponse> => {
  const response = await apiClient.get<ApiResponse<IssueSearchResponse>>(
    API_ENDPOINTS.INTERNAL.SEARCH,
    { params }
  );
  
  return response.data.data;
};

/**
 * Fetch a single issue by key
 */
const fetchIssueByKey = async (key: string): Promise<JiraIssue> => {
  const response = await apiClient.get<ApiResponse<JiraIssue>>(
    `${API_ENDPOINTS.INTERNAL.ISSUES}/${key}`
  );
  
  return response.data.data;
};

/**
 * Fetch issues by project
 */
const fetchIssuesByProject = async (params: IssuesByProjectParams): Promise<JiraIssue[]> => {
  const jql = `project = "${params.projectKey}"` +
    (params.issueType ? ` AND issueType = "${params.issueType}"` : '') +
    (params.status ? ` AND status = "${params.status}"` : '') +
    (params.assignee ? ` AND assignee = "${params.assignee}"` : '');
  
  const response = await searchIssues({
    jql,
    maxResults: params.maxResults || 50,
    fields: ['key', 'summary', 'status', 'issueType', 'priority', 'assignee'],
  });
  
  return response.issues;
};

/**
 * Search issues by text
 */
const searchIssuesByText = async (query: string, projectKeys?: string[]): Promise<JiraIssue[]> => {
  let jql = `text ~ "${query}"`;
  
  if (projectKeys && projectKeys.length > 0) {
    jql += ` AND project IN (${projectKeys.map(key => `"${key}"`).join(', ')})`;
  }
  
  const response = await searchIssues({
    jql,
    maxResults: 20,
    fields: ['key', 'summary', 'status', 'issueType', 'priority'],
  });
  
  return response.issues;
};

/**
 * Fetch recent issues for current user
 */
const fetchRecentIssues = async (): Promise<JiraIssue[]> => {
  const jql = 'worklogAuthor = currentUser() ORDER BY worklogDate DESC';
  
  const response = await searchIssues({
    jql,
    maxResults: 10,
    fields: ['key', 'summary', 'status', 'issueType', 'priority'],
  });
  
  return response.issues;
};

/**
 * Fetch assigned issues for current user
 */
const fetchAssignedIssues = async (): Promise<JiraIssue[]> => {
  const jql = 'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC';
  
  const response = await searchIssues({
    jql,
    maxResults: 20,
    fields: ['key', 'summary', 'status', 'issueType', 'priority', 'updated'],
  });
  
  return response.issues;
};

/**
 * Fetch issue types
 */
const fetchIssueTypes = async (): Promise<JiraIssueType[]> => {
  const response = await apiClient.get<ApiResponse<JiraIssueType[]>>(
    '/api/issue-types'
  );
  
  return response.data.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for searching issues
 */
export const useSearchIssues = (
  params: IssueSearchParams,
  options?: UseQueryOptions<IssueSearchResponse, Error>
) => {
  return useQuery({
    queryKey: queryKeys.issues.list(params),
    queryFn: () => searchIssues(params),
    enabled: !!params.jql || !!params,
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * Hook for fetching a single issue
 */
export const useIssue = (
  key: string,
  options?: UseQueryOptions<JiraIssue, Error>
) => {
  return useQuery({
    queryKey: queryKeys.issues.detail(key),
    queryFn: () => fetchIssueByKey(key),
    enabled: !!key,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook for fetching issues by project
 */
export const useIssuesByProject = (
  params: IssuesByProjectParams,
  options?: UseQueryOptions<JiraIssue[], Error>
) => {
  return useQuery({
    queryKey: queryKeys.issues.list(params),
    queryFn: () => fetchIssuesByProject(params),
    enabled: !!params.projectKey,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
};

/**
 * Hook for searching issues by text
 */
export const useSearchIssuesByText = (
  query: string,
  projectKeys?: string[],
  options?: UseQueryOptions<JiraIssue[], Error>
) => {
  return useQuery({
    queryKey: queryKeys.issues.search(query),
    queryFn: () => searchIssuesByText(query, projectKeys),
    enabled: !!query && query.length >= 2, // Only search with 2+ characters
    staleTime: 1 * 60 * 1000, // 1 minute
    ...options,
  });
};

/**
 * Hook for fetching recent issues
 */
export const useRecentIssues = (
  options?: UseQueryOptions<JiraIssue[], Error>
) => {
  return useQuery({
    queryKey: ['issues', 'recent'],
    queryFn: fetchRecentIssues,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook for fetching assigned issues
 */
export const useAssignedIssues = (
  options?: UseQueryOptions<JiraIssue[], Error>
) => {
  return useQuery({
    queryKey: ['issues', 'assigned'],
    queryFn: fetchAssignedIssues,
    staleTime: 3 * 60 * 1000, // 3 minutes
    ...options,
  });
};

/**
 * Hook for fetching issue types
 */
export const useIssueTypes = (
  options?: UseQueryOptions<JiraIssueType[], Error>
) => {
  return useQuery({
    queryKey: ['issue-types'],
    queryFn: fetchIssueTypes,
    staleTime: 30 * 60 * 1000, // 30 minutes - issue types rarely change
    ...options,
  });
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get issue summary by key from cache
 */
export const useIssueSummary = (issueKey: string): string => {
  const queryClient = useQueryClient();
  
  // Try to find issue in cached data
  const cachedIssue = queryClient.getQueryData(queryKeys.issues.detail(issueKey)) as JiraIssue | undefined;
  
  return cachedIssue?.summary || issueKey;
};

/**
 * Get issue by key from cache
 */
export const useIssueFromCache = (issueKey: string): JiraIssue | undefined => {
  const queryClient = useQueryClient();
  
  return queryClient.getQueryData(queryKeys.issues.detail(issueKey)) as JiraIssue | undefined;
};

/**
 * Prefetch issue data
 */
export const usePrefetchIssue = () => {
  const queryClient = useQueryClient();
  
  return (issueKey: string) => {
    queryClient.prefetchQuery({
      queryKey: queryKeys.issues.detail(issueKey),
      queryFn: () => fetchIssueByKey(issueKey),
      staleTime: 5 * 60 * 1000,
    });
  };
};

/**
 * Build JQL query helper
 */
export const buildJQL = (conditions: Record<string, any>): string => {
  const parts: string[] = [];
  
  if (conditions.project) {
    if (Array.isArray(conditions.project)) {
      parts.push(`project IN (${conditions.project.map((p: string) => `"${p}"`).join(', ')})`);
    } else {
      parts.push(`project = "${conditions.project}"`);
    }
  }
  
  if (conditions.issueType) {
    if (Array.isArray(conditions.issueType)) {
      parts.push(`issueType IN (${conditions.issueType.map((t: string) => `"${t}"`).join(', ')})`);
    } else {
      parts.push(`issueType = "${conditions.issueType}"`);
    }
  }
  
  if (conditions.status) {
    if (Array.isArray(conditions.status)) {
      parts.push(`status IN (${conditions.status.map((s: string) => `"${s}"`).join(', ')})`);
    } else {
      parts.push(`status = "${conditions.status}"`);
    }
  }
  
  if (conditions.assignee) {
    parts.push(`assignee = "${conditions.assignee}"`);
  }
  
  if (conditions.text) {
    parts.push(`text ~ "${conditions.text}"`);
  }
  
  if (conditions.createdAfter) {
    parts.push(`created >= "${conditions.createdAfter}"`);
  }
  
  if (conditions.updatedAfter) {
    parts.push(`updated >= "${conditions.updatedAfter}"`);
  }
  
  let jql = parts.join(' AND ');
  
  if (conditions.orderBy) {
    jql += ` ORDER BY ${conditions.orderBy}`;
  }
  
  return jql;
};

/**
 * Parse issue key to get project key
 */
export const getProjectKeyFromIssue = (issueKey: string): string => {
  return issueKey.split('-')[0];
};
