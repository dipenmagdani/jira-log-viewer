/**
 * Worklog API Service
 *
 * This service handles all worklog-related API calls using axios and React Query.
 */

import {
  useMutation,
  useQuery,
  useInfiniteQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
  UseInfiniteQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "../lib/axios";
import { queryKeys } from "../lib/queryClient";
import {
  JiraWorklog,
  WorklogFilter,
  PaginationInfo,
  SortConfig,
  WorklogAnalytics,
  ApiResponse,
} from "../types";
import { API_ENDPOINTS } from "../constants";

// ============================================================================
// Types
// ============================================================================

interface WorklogListParams {
  page?: number;
  pageSize?: number;
  startDate?: string;
  endDate?: string;
  projectKeys?: string[];
  issueKeys?: string[];
  authorIds?: string[];
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

interface WorklogListResponse {
  worklogs: JiraWorklog[];
  pagination: PaginationInfo;
  total: number;
}

interface CreateWorklogData {
  issueKey: string;
  timeSpent: string;
  comment?: string;
  started?: string;
  visibility?: {
    type: string;
    value: string;
  };
}

interface UpdateWorklogData {
  timeSpent?: string;
  comment?: string;
  started?: string;
  visibility?: {
    type: string;
    value: string;
  };
}

interface WorklogAnalyticsParams {
  startDate?: string;
  endDate?: string;
  projectKeys?: string[];
  issueKeys?: string[];
  authorIds?: string[];
  groupBy?: "day" | "week" | "month" | "project" | "issue" | "author";
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch worklogs with pagination and filtering
 */
const fetchWorklogs = async (
  params: WorklogListParams = {}
): Promise<WorklogListResponse> => {
  const response = await apiClient.get<ApiResponse<WorklogListResponse>>(
    API_ENDPOINTS.INTERNAL.WORKLOGS,
    { params }
  );

  return response.data.data;
};

/**
 * Fetch a single worklog by ID
 */
const fetchWorklogById = async (id: string): Promise<JiraWorklog> => {
  const response = await apiClient.get<ApiResponse<JiraWorklog>>(
    `${API_ENDPOINTS.INTERNAL.WORKLOG.DETAILS}/${id}`
  );

  return response.data.data;
};

/**
 * Fetch worklogs for a specific issue
 */
const fetchWorklogsByIssue = async (
  issueKey: string
): Promise<JiraWorklog[]> => {
  const response = await apiClient.get<ApiResponse<JiraWorklog[]>>(
    `${API_ENDPOINTS.INTERNAL.WORKLOGS}/${issueKey}`
  );

  return response.data.data;
};

/**
 * Create a new worklog
 */
const createWorklog = async (data: CreateWorklogData): Promise<JiraWorklog> => {
  const response = await apiClient.post<ApiResponse<JiraWorklog>>(
    API_ENDPOINTS.INTERNAL.WORKLOG.ADD,
    data
  );

  return response.data.data;
};

/**
 * Update an existing worklog
 */
const updateWorklog = async ({
  id,
  data,
}: {
  id: string;
  data: UpdateWorklogData;
}): Promise<JiraWorklog> => {
  const response = await apiClient.put<ApiResponse<JiraWorklog>>(
    `${API_ENDPOINTS.INTERNAL.WORKLOG.UPDATE}/${id}`,
    data
  );

  return response.data.data;
};

/**
 * Delete a worklog
 */
const deleteWorklog = async (id: string): Promise<void> => {
  await apiClient.delete<ApiResponse<void>>(
    `${API_ENDPOINTS.INTERNAL.WORKLOG.DELETE}/${id}`
  );
};

/**
 * Fetch worklog analytics
 */
const fetchWorklogAnalytics = async (
  params: WorklogAnalyticsParams = {}
): Promise<WorklogAnalytics> => {
  const response = await apiClient.get<ApiResponse<WorklogAnalytics>>(
    API_ENDPOINTS.INTERNAL.ANALYTICS,
    { params }
  );

  return response.data.data;
};

/**
 * Export worklogs
 */
const exportWorklogs = async (
  params: WorklogListParams & { format: "csv" | "excel" | "pdf" }
): Promise<Blob> => {
  const response = await apiClient.get("/api/worklogs/export", {
    params,
    responseType: "blob",
  });

  return response.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for fetching worklogs with pagination
 */
export const useWorklogs = (
  params: WorklogListParams = {},
  options?: UseQueryOptions<WorklogListResponse, Error>
) => {
  return useQuery({
    queryKey: queryKeys.worklogs.list(params),
    queryFn: () => fetchWorklogs(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
    ...options,
  });
};

/**
 * Hook for infinite scroll worklogs
 */
export const useInfiniteWorklogs = (
  baseParams: Omit<WorklogListParams, "page"> = {},
  options?: Omit<
    UseInfiniteQueryOptions<WorklogListResponse, Error>,
    "queryKey" | "queryFn" | "getNextPageParam"
  >
) => {
  return useInfiniteQuery({
    queryKey: queryKeys.worklogs.list(baseParams),
    queryFn: ({ pageParam = 1 }) =>
      fetchWorklogs({ ...baseParams, page: pageParam as number }),
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.hasNext ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for fetching a single worklog
 */
export const useWorklog = (
  id: string,
  options?: UseQueryOptions<JiraWorklog, Error>
) => {
  return useQuery({
    queryKey: queryKeys.worklogs.detail(id),
    queryFn: () => fetchWorklogById(id),
    enabled: !!id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook for fetching worklogs by issue
 */
export const useWorklogsByIssue = (
  issueKey: string,
  options?: UseQueryOptions<JiraWorklog[], Error>
) => {
  return useQuery({
    queryKey: queryKeys.worklogs.byIssue(issueKey),
    queryFn: () => fetchWorklogsByIssue(issueKey),
    enabled: !!issueKey,
    staleTime: 2 * 60 * 1000,
    ...options,
  });
};

/**
 * Hook for creating a worklog
 */
export const useCreateWorklog = (
  options?: UseMutationOptions<JiraWorklog, Error, CreateWorklogData>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createWorklog,
    onSuccess: (newWorklog) => {
      // Invalidate worklog lists
      queryClient.invalidateQueries({ queryKey: queryKeys.worklogs.all() });

      // Update issue worklogs cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.worklogs.byIssue(newWorklog.issueKey),
      });

      // Invalidate analytics
      queryClient.invalidateQueries({
        queryKey: queryKeys.worklogs.analytics(),
      });
    },
    onError: (error) => {
      console.error("Create worklog failed:", error);
    },
    ...options,
  });
};

/**
 * Hook for updating a worklog
 */
export const useUpdateWorklog = (
  options?: UseMutationOptions<
    JiraWorklog,
    Error,
    { id: string; data: UpdateWorklogData }
  >
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateWorklog,
    onSuccess: (updatedWorklog) => {
      // Update specific worklog cache
      queryClient.setQueryData(
        queryKeys.worklogs.detail(updatedWorklog.id),
        updatedWorklog
      );

      // Invalidate worklog lists
      queryClient.invalidateQueries({ queryKey: queryKeys.worklogs.all() });

      // Update issue worklogs cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.worklogs.byIssue(updatedWorklog.issueKey),
      });

      // Invalidate analytics
      queryClient.invalidateQueries({
        queryKey: queryKeys.worklogs.analytics(),
      });
    },
    onError: (error) => {
      console.error("Update worklog failed:", error);
    },
    ...options,
  });
};

/**
 * Hook for deleting a worklog
 */
export const useDeleteWorklog = (
  options?: UseMutationOptions<void, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteWorklog,
    onSuccess: (_, worklogId) => {
      // Remove worklog from cache
      queryClient.removeQueries({
        queryKey: queryKeys.worklogs.detail(worklogId),
      });

      // Invalidate worklog lists
      queryClient.invalidateQueries({ queryKey: queryKeys.worklogs.all() });

      // Invalidate analytics
      queryClient.invalidateQueries({
        queryKey: queryKeys.worklogs.analytics(),
      });
    },
    onError: (error) => {
      console.error("Delete worklog failed:", error);
    },
    ...options,
  });
};

/**
 * Hook for fetching worklog analytics
 */
export const useWorklogAnalytics = (
  params: WorklogAnalyticsParams = {},
  options?: UseQueryOptions<WorklogAnalytics, Error>
) => {
  return useQuery({
    queryKey: queryKeys.worklogs.analytics(params),
    queryFn: () => fetchWorklogAnalytics(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
    ...options,
  });
};

/**
 * Hook for exporting worklogs
 */
export const useExportWorklogs = (
  options?: UseMutationOptions<
    Blob,
    Error,
    WorklogListParams & { format: "csv" | "excel" | "pdf" }
  >
) => {
  return useMutation({
    mutationFn: exportWorklogs,
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      const timestamp = new Date().toISOString().split("T")[0];
      link.download = `worklogs-${timestamp}.${variables.format}`;

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.URL.revokeObjectURL(url);
    },
    onError: (error) => {
      console.error("Export worklogs failed:", error);
    },
    ...options,
  });
};

// ============================================================================
// Optimistic Update Helpers
// ============================================================================

/**
 * Add worklog optimistically to cache
 */
export const addWorklogOptimistic = (
  queryClient: any,
  params: WorklogListParams,
  newWorklog: JiraWorklog
) => {
  queryClient.setQueryData(
    queryKeys.worklogs.list(params),
    (old: WorklogListResponse | undefined) => {
      if (!old) return old;

      return {
        ...old,
        worklogs: [newWorklog, ...old.worklogs],
        total: old.total + 1,
        pagination: {
          ...old.pagination,
          total: old.pagination.total + 1,
        },
      };
    }
  );
};

/**
 * Update worklog optimistically in cache
 */
export const updateWorklogOptimistic = (
  queryClient: any,
  params: WorklogListParams,
  worklogId: string,
  updates: Partial<JiraWorklog>
) => {
  queryClient.setQueryData(
    queryKeys.worklogs.list(params),
    (old: WorklogListResponse | undefined) => {
      if (!old) return old;

      return {
        ...old,
        worklogs: old.worklogs.map((worklog) =>
          worklog.id === worklogId ? { ...worklog, ...updates } : worklog
        ),
      };
    }
  );
};

/**
 * Remove worklog optimistically from cache
 */
export const removeWorklogOptimistic = (
  queryClient: any,
  params: WorklogListParams,
  worklogId: string
) => {
  queryClient.setQueryData(
    queryKeys.worklogs.list(params),
    (old: WorklogListResponse | undefined) => {
      if (!old) return old;

      return {
        ...old,
        worklogs: old.worklogs.filter((worklog) => worklog.id !== worklogId),
        total: old.total - 1,
        pagination: {
          ...old.pagination,
          total: old.pagination.total - 1,
        },
      };
    }
  );
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Convert WorklogFilter to API params
 */
export const filterToParams = (filter: WorklogFilter): WorklogListParams => {
  return {
    startDate: filter.dateRange.start?.toISOString().split("T")[0],
    endDate: filter.dateRange.end?.toISOString().split("T")[0],
    projectKeys: filter.projects.length > 0 ? filter.projects : undefined,
    issueKeys: filter.issues.length > 0 ? filter.issues : undefined,
    authorIds: filter.authors.length > 0 ? filter.authors : undefined,
  };
};

/**
 * Convert SortConfig to API params
 */
export const sortToParams = (
  sort: SortConfig
): Pick<WorklogListParams, "sortBy" | "sortOrder"> => {
  return {
    sortBy: sort.field,
    sortOrder: sort.direction,
  };
};

/**
 * Calculate total time from worklogs
 */
export const calculateTotalTime = (worklogs: JiraWorklog[]): number => {
  return worklogs.reduce(
    (total, worklog) => total + worklog.timeSpentSeconds,
    0
  );
};

/**
 * Format time in seconds to human readable format
 */
export const formatTimeSpent = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else if (minutes > 0) {
    return `${minutes}m`;
  } else {
    return "0m";
  }
};

/**
 * Parse time string to seconds
 */
export const parseTimeToSeconds = (timeString: string): number => {
  const hoursMatch = timeString.match(/(\d+)h/);
  const minutesMatch = timeString.match(/(\d+)m/);
  const decimalMatch = timeString.match(/^(\d+(?:\.\d+)?)h?$/);

  let totalSeconds = 0;

  if (decimalMatch) {
    // Handle decimal hours (e.g., "2.5h" or "2.5")
    const hours = parseFloat(decimalMatch[1]);
    totalSeconds = hours * 3600;
  } else {
    // Handle hours and minutes (e.g., "2h 30m")
    if (hoursMatch) {
      totalSeconds += parseInt(hoursMatch[1]) * 3600;
    }
    if (minutesMatch) {
      totalSeconds += parseInt(minutesMatch[1]) * 60;
    }
  }

  return totalSeconds;
};
