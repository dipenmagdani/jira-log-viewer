/**
 * React Query Configuration
 *
 * This file sets up React Query (TanStack Query) with proper configuration
 * for the Jira Worklog Viewer application.
 */

import {
  QueryClient,
  QueryCache,
  MutationCache,
  DefaultOptions,
} from "@tanstack/react-query";
import { config } from "../config";
import { ERROR_MESSAGES } from "../constants";

// ============================================================================
// Query Client Configuration
// ============================================================================

const defaultQueryOptions: DefaultOptions = {
  queries: {
    // Stale time - how long data is considered fresh
    staleTime: 5 * 60 * 1000, // 5 minutes

    // Cache time - how long inactive data stays in cache
    gcTime: 10 * 60 * 1000, // 10 minutes (was cacheTime in v4)

    // Retry configuration
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors (client errors)
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }

      // Don't retry authentication errors
      if (error?.response?.status === 401) {
        return false;
      }

      // Retry up to 3 times for other errors
      return failureCount < 3;
    },

    // Retry delay with exponential backoff
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),

    // Refetch behavior
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,

    // Network mode
    networkMode: "online",
  },

  mutations: {
    // Retry mutations less aggressively
    retry: (failureCount, error: any) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }

      // Only retry once for mutations
      return failureCount < 1;
    },

    // Network mode for mutations
    networkMode: "online",
  },
};

// ============================================================================
// Error Handling
// ============================================================================

const queryCache = new QueryCache({
  onError: (error: any, query) => {
    console.error("Query error:", error);

    // Log error details in development
    if (config.app.isDevelopment) {
      console.error("Query key:", query.queryKey);
      console.error("Error details:", error);
    }

    // Handle authentication errors globally
    if (error?.response?.status === 401) {
      // Clear auth data and redirect to login
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-storage");
        window.location.href = "/login";
      }
    }

    // Handle network errors
    if (!navigator.onLine) {
      console.warn("Network is offline");
    }
  },
});

const mutationCache = new MutationCache({
  onError: (error: any, variables, context, mutation) => {
    console.error("Mutation error:", error);

    // Log mutation details in development
    if (config.app.isDevelopment) {
      console.error("Mutation key:", mutation.options.mutationKey);
      console.error("Variables:", variables);
      console.error("Error details:", error);
    }

    // Handle authentication errors
    if (error?.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("auth-storage");
        window.location.href = "/login";
      }
    }
  },

  onSuccess: (data, variables, context, mutation) => {
    if (config.app.isDevelopment) {
      console.log("Mutation success:", mutation.options.mutationKey);
    }
  },
});

// ============================================================================
// Create Query Client
// ============================================================================

export const createQueryClient = (): QueryClient => {
  return new QueryClient({
    defaultOptions: defaultQueryOptions,
    queryCache,
    mutationCache,
  });
};

// ============================================================================
// Query Keys Factory
// ============================================================================

export const queryKeys = {
  // Authentication
  auth: {
    user: () => ["auth", "user"] as const,
    session: () => ["auth", "session"] as const,
    resources: () => ["auth", "resources"] as const,
  },

  // Projects
  projects: {
    all: () => ["projects"] as const,
    list: (filters?: any) => ["projects", "list", filters] as const,
    detail: (id: string) => ["projects", "detail", id] as const,
  },

  // Issues
  issues: {
    all: () => ["issues"] as const,
    list: (filters?: any) => ["issues", "list", filters] as const,
    detail: (key: string) => ["issues", "detail", key] as const,
    search: (query: string) => ["issues", "search", query] as const,
  },

  // Worklogs
  worklogs: {
    all: () => ["worklogs"] as const,
    list: (filters?: any) => ["worklogs", "list", filters] as const,
    detail: (id: string) => ["worklogs", "detail", id] as const,
    byIssue: (issueKey: string) => ["worklogs", "byIssue", issueKey] as const,
    analytics: (filters?: any) => ["worklogs", "analytics", filters] as const,
  },

  // User
  user: {
    profile: () => ["user", "profile"] as const,
    preferences: () => ["user", "preferences"] as const,
  },
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Invalidate queries by pattern
 */
export const invalidateQueries = (
  queryClient: QueryClient,
  pattern: readonly unknown[]
) => {
  return queryClient.invalidateQueries({ queryKey: pattern });
};

/**
 * Prefetch query data
 */
export const prefetchQuery = async <T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  queryFn: () => Promise<T>,
  options?: { staleTime?: number }
) => {
  return queryClient.prefetchQuery({
    queryKey,
    queryFn,
    staleTime: options?.staleTime || 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Set query data in cache
 */
export const setQueryData = <T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  data: T | ((old: T | undefined) => T)
) => {
  return queryClient.setQueryData(queryKey, data);
};

/**
 * Get query data from cache
 */
export const getQueryData = <T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[]
): T | undefined => {
  return queryClient.getQueryData(queryKey);
};

/**
 * Remove query from cache
 */
export const removeQuery = (
  queryClient: QueryClient,
  queryKey: readonly unknown[]
) => {
  return queryClient.removeQueries({ queryKey });
};

/**
 * Reset query client (clear all cache)
 */
export const resetQueryClient = (queryClient: QueryClient) => {
  return queryClient.clear();
};

// ============================================================================
// Error Utilities
// ============================================================================

/**
 * Extract error message from various error types
 */
export const getErrorMessage = (error: unknown): string => {
  if (typeof error === "string") {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  // Axios error
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as any;
    return (
      axiosError.response?.data?.message ||
      axiosError.response?.data?.error ||
      axiosError.message ||
      ERROR_MESSAGES.GENERIC
    );
  }

  return ERROR_MESSAGES.GENERIC;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error && typeof error === "object" && "code" in error) {
    const err = error as any;
    return err.code === "NETWORK_ERROR" || err.code === "ECONNABORTED";
  }

  return false;
};

/**
 * Check if error is an authentication error
 */
export const isAuthError = (error: unknown): boolean => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as any;
    return axiosError.response?.status === 401;
  }

  return false;
};

/**
 * Check if error is a client error (4xx)
 */
export const isClientError = (error: unknown): boolean => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as any;
    const status = axiosError.response?.status;
    return status >= 400 && status < 500;
  }

  return false;
};

/**
 * Check if error is a server error (5xx)
 */
export const isServerError = (error: unknown): boolean => {
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as any;
    const status = axiosError.response?.status;
    return status >= 500 && status < 600;
  }

  return false;
};

// ============================================================================
// Dev Tools Configuration
// ============================================================================

export const reactQueryDevtoolsConfig = {
  initialIsOpen: false,
  position: "bottom-right" as const,
  toggleButtonProps: {
    style: {
      marginLeft: "5px",
      transform: "scale(0.8)",
      transformOrigin: "bottom right",
    },
  },
};

// Export default query client for convenience
export const queryClient = createQueryClient();
export default queryClient;
