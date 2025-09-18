/**
 * Authentication API Service
 *
 * This service handles all authentication-related API calls using axios and React Query.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  UseMutationOptions,
  UseQueryOptions,
} from "@tanstack/react-query";
import { apiClient } from "../lib/axios";
import { queryKeys } from "../lib/queryClient";
import { AuthData, User, AtlassianResource, ApiResponse } from "../types";
import { AUTH_CONFIG, API_ENDPOINTS } from "../constants";

// ============================================================================
// Types
// ============================================================================

interface LoginCredentials {
  email: string;
  apiToken: string;
  serverUrl: string;
}

interface OAuthTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  cloudId: string;
}

interface LoginResponse {
  authData: AuthData;
  user: User;
  resources?: AtlassianResource[];
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Login with Basic Auth credentials
 */
const loginWithBasicAuth = async (
  credentials: LoginCredentials
): Promise<LoginResponse> => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    API_ENDPOINTS.INTERNAL.AUTH.LOGIN,
    {
      ...credentials,
      isOAuth: false,
    }
  );

  return response.data.data;
};

/**
 * Login with OAuth tokens
 */
const loginWithOAuth = async (
  tokenData: OAuthTokenData
): Promise<LoginResponse> => {
  const response = await apiClient.post<ApiResponse<LoginResponse>>(
    API_ENDPOINTS.INTERNAL.AUTH.LOGIN,
    {
      ...tokenData,
      isOAuth: true,
    }
  );

  return response.data.data;
};

/**
 * Logout user
 */
const logout = async (): Promise<void> => {
  await apiClient.post<ApiResponse<void>>(API_ENDPOINTS.INTERNAL.AUTH.LOGOUT);
};

/**
 * Get current user session
 */
const getSession = async (): Promise<{ user: User; authData: AuthData }> => {
  const response = await apiClient.get<
    ApiResponse<{ user: User; authData: AuthData }>
  >(API_ENDPOINTS.INTERNAL.AUTH.SESSION);

  return response.data.data;
};

/**
 * Get current user profile
 */
const getUserProfile = async (): Promise<User> => {
  const response = await apiClient.get<ApiResponse<User>>(
    API_ENDPOINTS.INTERNAL.USER
  );

  return response.data.data;
};

/**
 * Get accessible Atlassian resources (for OAuth)
 */
const getAccessibleResources = async (): Promise<AtlassianResource[]> => {
  const response = await apiClient.get<ApiResponse<AtlassianResource[]>>(
    "/api/auth/resources"
  );

  return response.data.data;
};

/**
 * Refresh OAuth tokens
 */
const refreshTokens = async (refreshToken: string): Promise<OAuthTokenData> => {
  const response = await apiClient.post<ApiResponse<OAuthTokenData>>(
    "/api/auth/refresh",
    { refreshToken }
  );

  return response.data.data;
};

/**
 * Test API connection
 */
const testConnection = async (): Promise<{
  success: boolean;
  message: string;
}> => {
  const response = await apiClient.get<
    ApiResponse<{ success: boolean; message: string }>
  >("/api/test-connection");

  return response.data.data;
};

// ============================================================================
// React Query Hooks
// ============================================================================

/**
 * Hook for Basic Auth login
 */
export const useBasicAuthLogin = (
  options?: UseMutationOptions<LoginResponse, Error, LoginCredentials>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginWithBasicAuth,
    onSuccess: (data) => {
      // Update cache with user data
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
      queryClient.setQueryData(queryKeys.auth.session(), {
        user: data.user,
        authData: data.authData,
      });

      // Store auth data in localStorage
      localStorage.setItem(
        AUTH_CONFIG.STORAGE_KEYS.AUTH_DATA,
        JSON.stringify(data.authData)
      );
    },
    onError: (error) => {
      console.error("Basic auth login failed:", error);
    },
    ...options,
  });
};

/**
 * Hook for OAuth login
 */
export const useOAuthLogin = (
  options?: UseMutationOptions<LoginResponse, Error, OAuthTokenData>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: loginWithOAuth,
    onSuccess: (data) => {
      // Update cache with user data
      queryClient.setQueryData(queryKeys.auth.user(), data.user);
      queryClient.setQueryData(queryKeys.auth.session(), {
        user: data.user,
        authData: data.authData,
      });

      if (data.resources) {
        queryClient.setQueryData(queryKeys.auth.resources(), data.resources);
      }

      // Store auth data in localStorage
      localStorage.setItem(
        AUTH_CONFIG.STORAGE_KEYS.AUTH_DATA,
        JSON.stringify(data.authData)
      );
    },
    onError: (error) => {
      console.error("OAuth login failed:", error);
    },
    ...options,
  });
};

/**
 * Hook for logout
 */
export const useLogout = (options?: UseMutationOptions<void, Error, void>) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();

      // Clear localStorage
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_DATA);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER_PREFERENCES);
    },
    onError: (error) => {
      console.error("Logout failed:", error);

      // Clear data even if logout API call fails
      queryClient.clear();
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_DATA);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER_PREFERENCES);
    },
    ...options,
  });
};

/**
 * Hook for getting current session
 */
export const useSession = (
  options?: UseQueryOptions<{ user: User; authData: AuthData }, Error>
) => {
  return useQuery({
    queryKey: queryKeys.auth.session(),
    queryFn: getSession,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
};

/**
 * Hook for getting user profile
 */
export const useUserProfile = (options?: UseQueryOptions<User, Error>) => {
  return useQuery({
    queryKey: queryKeys.auth.user(),
    queryFn: getUserProfile,
    staleTime: 10 * 60 * 1000, // 10 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
};

/**
 * Hook for getting accessible resources
 */
export const useAccessibleResources = (
  enabled: boolean = true,
  options?: UseQueryOptions<AtlassianResource[], Error>
) => {
  return useQuery({
    queryKey: queryKeys.auth.resources(),
    queryFn: getAccessibleResources,
    enabled: enabled,
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: (failureCount, error: any) => {
      if (error?.response?.status === 401) {
        return false;
      }
      return failureCount < 2;
    },
    ...options,
  });
};

/**
 * Hook for refreshing OAuth tokens
 */
export const useRefreshTokens = (
  options?: UseMutationOptions<OAuthTokenData, Error, string>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: refreshTokens,
    onSuccess: (data) => {
      // Update auth data in cache and localStorage
      const currentSession = queryClient.getQueryData(
        queryKeys.auth.session()
      ) as any;
      if (currentSession) {
        const updatedAuthData = {
          ...currentSession.authData,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          expiresAt: data.expiresAt,
        };

        const updatedSession = {
          ...currentSession,
          authData: updatedAuthData,
        };

        queryClient.setQueryData(queryKeys.auth.session(), updatedSession);
        localStorage.setItem(
          AUTH_CONFIG.STORAGE_KEYS.AUTH_DATA,
          JSON.stringify(updatedAuthData)
        );
      }
    },
    onError: (error) => {
      console.error("Token refresh failed:", error);

      // If refresh fails, clear auth data and redirect to login
      queryClient.clear();
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_DATA);

      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },
    ...options,
  });
};

/**
 * Hook for testing API connection
 */
export const useTestConnection = (
  options?: UseMutationOptions<
    { success: boolean; message: string },
    Error,
    void
  >
) => {
  return useMutation({
    mutationFn: testConnection,
    ...options,
  });
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if user is authenticated based on cached data
 */
export const useIsAuthenticated = (): boolean => {
  const queryClient = useQueryClient();
  const session = queryClient.getQueryData(queryKeys.auth.session()) as any;

  if (!session?.authData) {
    // Check localStorage as fallback
    try {
      const storedAuth = localStorage.getItem(
        AUTH_CONFIG.STORAGE_KEYS.AUTH_DATA
      );
      if (storedAuth) {
        const authData = JSON.parse(storedAuth);
        return !!(
          authData &&
          (authData.accessToken || (authData.email && authData.apiToken))
        );
      }
    } catch (error) {
      console.error("Error checking stored auth:", error);
    }
    return false;
  }

  // Check if OAuth token is expired
  if (session.authData.isOAuth && session.authData.expiresAt) {
    return (
      Date.now() < session.authData.expiresAt - AUTH_CONFIG.TOKEN_EXPIRY_BUFFER
    );
  }

  // For Basic auth, just check if credentials exist
  return !!(session.authData.email && session.authData.apiToken);
};

/**
 * Get current auth data from cache or localStorage
 */
export const useAuthData = (): AuthData | null => {
  const queryClient = useQueryClient();
  const session = queryClient.getQueryData(queryKeys.auth.session()) as any;

  if (session?.authData) {
    return session.authData;
  }

  // Fallback to localStorage
  try {
    const storedAuth = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_DATA);
    return storedAuth ? JSON.parse(storedAuth) : null;
  } catch (error) {
    console.error("Error getting auth data:", error);
    return null;
  }
};
