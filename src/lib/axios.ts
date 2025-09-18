/**
 * Axios Configuration and Interceptors
 *
 * This file sets up Axios with interceptors for authentication, error handling,
 * and request/response transformation for the Jira Worklog Viewer application.
 */

import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";
import { config } from "../config";
import { AUTH_CONFIG, ERROR_MESSAGES } from "../constants";
import { AuthData, ApiResponse } from "../types";

// ============================================================================
// Types
// ============================================================================

interface RequestMetadata {
  startTime?: number;
  retryCount?: number;
}

declare module "axios" {
  // augment config for custom fields we reference
  interface InternalAxiosRequestConfig {
    _retry?: boolean;
    skipAuth?: boolean;
    metadata?: RequestMetadata;
    app?: { isDevelopment?: boolean };
    development?: { debug?: { api?: boolean } };
  }
}

interface AuthRequestConfig extends InternalAxiosRequestConfig {}

interface RetryConfig {
  retries: number;
  retryDelay: number;
  retryCondition?: (error: AxiosError) => boolean;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get stored authentication data from localStorage
 */
const getStoredAuth = (): AuthData | null => {
  try {
    if (typeof window === "undefined") return null;

    const stored = localStorage.getItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_DATA);
    if (!stored) return null;

    const authData: AuthData = JSON.parse(stored);

    // Check if token is expired
    if (authData.expiresAt && Date.now() >= authData.expiresAt) {
      localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_DATA);
      return null;
    }

    return authData;
  } catch (error) {
    console.error("Error getting stored auth:", error);
    return null;
  }
};

/**
 * Clear authentication data from localStorage
 */
const clearStoredAuth = (): void => {
  try {
    if (typeof window === "undefined") return;

    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_DATA);
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
  } catch (error) {
    console.error("Error clearing stored auth:", error);
  }
};

/**
 * Check if an error is retryable
 */
const isRetryableError = (error: AxiosError): boolean => {
  const retryableCodes = [408, 429, 500, 502, 503, 504];
  return (
    !error.response ||
    retryableCodes.includes(error.response.status) ||
    error.code === "ECONNABORTED" ||
    error.code === "NETWORK_ERROR"
  );
};

/**
 * Calculate retry delay with exponential backoff
 */
const calculateRetryDelay = (
  attempt: number,
  baseDelay: number = 1000
): number => {
  return Math.min(baseDelay * Math.pow(2, attempt), config.api.retry.maxDelay);
};

/**
 * Sleep function for retry delays
 */
const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

// ============================================================================
// Create Axios Instances
// ============================================================================

/**
 * Default Axios instance for internal API calls
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: config.app.apiBaseUrl,
  timeout: config.api.timeout,
  headers: {
    ...config.api.defaultHeaders,
  },
});

/**
 * Axios instance for Atlassian API calls
 */
export const atlassianApiClient: AxiosInstance = axios.create({
  timeout: config.api.timeout,
  headers: {
    ...config.api.defaultHeaders,
    "User-Agent": config.api.atlassianApi.userAgent,
  },
});

// ============================================================================
// Request Interceptors
// ============================================================================

/**
 * Request interceptor for internal API calls
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Add authentication headers
    if (!config.skipAuth) {
      const authData = getStoredAuth();
      if (authData) {
        if (authData.isOAuth && authData.accessToken) {
          config.headers.Authorization = `Bearer ${authData.accessToken}`;
        } else if (authData.serverUrl && authData.email && authData.apiToken) {
          const credentials = btoa(`${authData.email}:${authData.apiToken}`);
          config.headers.Authorization = `Basic ${credentials}`;
        }

        // Add additional headers for OAuth
        if (authData.isOAuth && authData.cloudId) {
          config.headers["X-Cloud-Id"] = authData.cloudId;
        }

        // Always send site URL for server API routes to consume
        if (authData.serverUrl) {
          (config.headers as any)["X-Site-Url"] = authData.serverUrl.replace(
            /\/?$/,
            ""
          );
        }
      }
    }

    // Add request timestamp for debugging
    if (config.app?.isDevelopment) {
      config.metadata = Object.assign({}, config.metadata, {
        startTime: Date.now(),
      });
    }

    // Log request in development
    if (config.app?.isDevelopment && config.development?.debug?.api) {
      console.log("🚀 API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        headers: config.headers,
        data: config.data,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

/**
 * Request interceptor for Atlassian API calls
 */
atlassianApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const authData = getStoredAuth();

    if (authData?.isOAuth && authData.accessToken) {
      config.headers.Authorization = `Bearer ${authData.accessToken}`;
    }

    // Add cloud ID to base URL for Jira API calls
    if (authData?.cloudId && config.url?.startsWith("/rest/api/")) {
      config.baseURL = `https://${authData.cloudId}.atlassian.net`;
    }

    // Log request in development
    if (config.app?.isDevelopment && config.development?.debug?.api) {
      console.log("🌐 Atlassian API Request:", {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        headers: config.headers,
      });
    }

    return config;
  },
  (error: AxiosError) => {
    console.error("❌ Atlassian Request Error:", error);
    return Promise.reject(error);
  }
);

// ============================================================================
// Response Interceptors
// ============================================================================

/**
 * Response interceptor for internal API calls
 */
apiClient.interceptors.response.use(
  (
    response: AxiosResponse<ApiResponse<any>>
  ): AxiosResponse<ApiResponse<any>> => {
    // Log response in development
    if (config.app.isDevelopment && config.development.debug.api) {
      const duration = (response.config as any).metadata?.startTime
        ? Date.now() - (response.config as any).metadata.startTime
        : 0;

      console.log("✅ API Response:", {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        duration: `${duration}ms`,
        data: response.data,
      });
    }

    // Transform response data if needed
    if (response.data && typeof response.data === "object") {
      // Ensure consistent API response format
      if (!("success" in response.data)) {
        response.data = {
          success: true,
          data: response.data,
          message: null,
          error: null,
        } as ApiResponse<any>;
      }
    }

    return response;
  },
  async (error: AxiosError<ApiResponse<any>>) => {
    const originalRequest = error.config as AuthRequestConfig;

    // Log error in development
    if (config.app.isDevelopment && config.development.debug.api) {
      console.error("❌ API Error:", {
        method: (originalRequest as any)?.method?.toUpperCase(),
        url: (originalRequest as any)?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle authentication errors
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      clearStoredAuth();

      // Redirect to login in browser environment
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    // Handle retry logic for retryable errors
    if (
      isRetryableError(error) &&
      originalRequest &&
      !originalRequest._retry &&
      (originalRequest.metadata?.retryCount || 0) < config.api.retry.attempts
    ) {
      originalRequest._retry = true;
      originalRequest.metadata = {
        ...originalRequest.metadata,
        retryCount: (originalRequest.metadata?.retryCount || 0) + 1,
      };

      const delay = calculateRetryDelay(
        originalRequest.metadata.retryCount,
        config.api.retry.delay
      );

      await sleep(delay);
      return apiClient(originalRequest);
    }

    // Transform error to consistent format
    const transformedError = {
      ...error,
      response: {
        ...error.response,
        data: {
          success: false,
          data: null,
          message: error.response?.data?.message || ERROR_MESSAGES.GENERIC,
          error: error.response?.data?.error || error.message,
        } as ApiResponse<null>,
      },
    };

    return Promise.reject(transformedError);
  }
);

/**
 * Response interceptor for Atlassian API calls
 */
atlassianApiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => {
    // Log response in development
    if (config.app.isDevelopment && config.development.debug.api) {
      console.log("✅ Atlassian API Response:", {
        method: response.config.method?.toUpperCase(),
        url: response.config.url,
        status: response.status,
        data: response.data,
      });
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AuthRequestConfig;

    // Log error in development
    if (config.app.isDevelopment && config.development.debug.api) {
      console.error("❌ Atlassian API Error:", {
        method: (originalRequest as any)?.method?.toUpperCase(),
        url: (originalRequest as any)?.url,
        status: error.response?.status,
        message: error.message,
        data: error.response?.data,
      });
    }

    // Handle authentication errors
    if (error.response?.status === 401 && !originalRequest?._retry) {
      originalRequest._retry = true;
      clearStoredAuth();

      // Redirect to login in browser environment
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }

      return Promise.reject(error);
    }

    // Handle retry logic for retryable errors
    if (
      isRetryableError(error) &&
      originalRequest &&
      !originalRequest._retry &&
      (originalRequest.metadata?.retryCount || 0) < config.api.retry.attempts
    ) {
      originalRequest._retry = true;
      originalRequest.metadata = {
        ...originalRequest.metadata,
        retryCount: (originalRequest.metadata?.retryCount || 0) + 1,
      };

      const delay = calculateRetryDelay(
        originalRequest.metadata.retryCount,
        config.api.retry.delay
      );

      await sleep(delay);
      return atlassianApiClient(originalRequest);
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// Utility Functions for API Calls
// ============================================================================

/**
 * Create an authenticated request config
 */
export const createAuthenticatedConfig = (
  config: AxiosRequestConfig = {}
): AxiosRequestConfig => {
  const authData = getStoredAuth();

  if (!authData) {
    throw new Error("No authentication data available");
  }

  const headers: Record<string, string> = {};
  // Copy over only string headers to satisfy typing
  if (config.headers) {
    const existing: any = config.headers;
    Object.keys(existing).forEach((k) => {
      const val = existing[k];
      if (typeof val === "string") headers[k] = val;
    });
  }

  if (authData.isOAuth && authData.accessToken) {
    headers.Authorization = `Bearer ${authData.accessToken}`;
  } else if (authData.email && authData.apiToken) {
    const credentials = btoa(`${authData.email}:${authData.apiToken}`);
    headers.Authorization = `Basic ${credentials}`;
  }

  return {
    ...config,
    headers,
  };
};

/**
 * Create a request config that skips authentication
 */
export const createUnauthenticatedConfig = (
  config: AxiosRequestConfig = {}
): AxiosRequestConfig => {
  // Cast to any to allow skipAuth (custom augmented field for internal use)
  return {
    ...(config as any),
    skipAuth: true,
  } as AxiosRequestConfig;
};

/**
 * Generic API request wrapper with error handling
 */
export const makeApiRequest = async <T = any>(
  request: () => Promise<AxiosResponse<ApiResponse<T>>>
): Promise<T> => {
  try {
    const response = await request();

    if (response.data.success && response.data.data !== undefined) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || ERROR_MESSAGES.GENERIC);
    }
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const message =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        ERROR_MESSAGES.GENERIC;
      throw new Error(message);
    }
    throw error;
  }
};

// ============================================================================
// Export configured instances
// ============================================================================

export { apiClient as api, atlassianApiClient as atlassianApi };
export default apiClient;
