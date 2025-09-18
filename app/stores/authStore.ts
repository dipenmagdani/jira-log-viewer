/**
 * Authentication Store
 * 
 * Zustand store for managing authentication state, including OAuth and Basic auth.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { AuthData, User, AtlassianResource } from '../types';
import { AUTH_CONFIG } from '../constants';

// ============================================================================
// Types
// ============================================================================

interface AuthState {
  // State
  isAuthenticated: boolean;
  isLoading: boolean;
  authData: AuthData | null;
  user: User | null;
  resources: AtlassianResource[];
  error: string | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setAuthData: (authData: AuthData | null) => void;
  setUser: (user: User | null) => void;
  setResources: (resources: AtlassianResource[]) => void;
  login: (authData: AuthData) => void;
  logout: () => void;
  updateTokens: (accessToken: string, refreshToken?: string, expiresAt?: number) => void;
  clearError: () => void;
  
  // Getters
  getAuthHeaders: () => Record<string, string>;
  isTokenExpired: () => boolean;
  hasValidAuth: () => boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  isAuthenticated: false,
  isLoading: false,
  authData: null,
  user: null,
  resources: [],
  error: null,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useAuthStore = create<AuthState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // ====================================================================
        // Actions
        // ====================================================================
        
        setLoading: (loading: boolean) => {
          set({ isLoading: loading }, false, 'auth/setLoading');
        },
        
        setError: (error: string | null) => {
          set({ error }, false, 'auth/setError');
        },
        
        setAuthData: (authData: AuthData | null) => {
          set({ 
            authData,
            isAuthenticated: !!authData,
          }, false, 'auth/setAuthData');
        },
        
        setUser: (user: User | null) => {
          set({ user }, false, 'auth/setUser');
        },
        
        setResources: (resources: AtlassianResource[]) => {
          set({ resources }, false, 'auth/setResources');
        },
        
        login: (authData: AuthData) => {
          set({ 
            authData,
            isAuthenticated: true,
            error: null,
            isLoading: false,
          }, false, 'auth/login');
        },
        
        logout: () => {
          // Clear localStorage
          if (typeof window !== 'undefined') {
            localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.AUTH_DATA);
            localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
            localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
            localStorage.removeItem(AUTH_CONFIG.STORAGE_KEYS.USER_PREFERENCES);
          }
          
          set({ 
            ...initialState 
          }, false, 'auth/logout');
        },
        
        updateTokens: (accessToken: string, refreshToken?: string, expiresAt?: number) => {
          const { authData } = get();
          if (!authData) return;
          
          const updatedAuthData: AuthData = {
            ...authData,
            accessToken,
            refreshToken: refreshToken || authData.refreshToken,
            expiresAt: expiresAt || authData.expiresAt,
          };
          
          set({ 
            authData: updatedAuthData 
          }, false, 'auth/updateTokens');
        },
        
        clearError: () => {
          set({ error: null }, false, 'auth/clearError');
        },
        
        // ====================================================================
        // Getters
        // ====================================================================
        
        getAuthHeaders: (): Record<string, string> => {
          const { authData } = get();
          const headers: Record<string, string> = {};
          
          if (!authData) return headers;
          
          if (authData.isOAuth && authData.accessToken) {
            headers.Authorization = `Bearer ${authData.accessToken}`;
          } else if (authData.email && authData.apiToken) {
            const credentials = btoa(`${authData.email}:${authData.apiToken}`);
            headers.Authorization = `Basic ${credentials}`;
          }
          
          if (authData.cloudId) {
            headers['X-Cloud-Id'] = authData.cloudId;
          }
          
          return headers;
        },
        
        isTokenExpired: (): boolean => {
          const { authData } = get();
          if (!authData?.expiresAt) return false;
          
          // Add buffer to prevent requests with soon-to-expire tokens
          return Date.now() >= (authData.expiresAt - AUTH_CONFIG.TOKEN_EXPIRY_BUFFER);
        },
        
        hasValidAuth: (): boolean => {
          const { authData, isTokenExpired } = get();
          
          if (!authData) return false;
          
          // For OAuth, check if we have a valid token
          if (authData.isOAuth) {
            return !!(authData.accessToken && !isTokenExpired());
          }
          
          // For Basic auth, check if we have credentials
          return !!(authData.email && authData.apiToken && authData.serverUrl);
        },
      }),
      {
        name: 'auth-storage',
        partialize: (state) => ({
          authData: state.authData,
          user: state.user,
          resources: state.resources,
          isAuthenticated: state.isAuthenticated,
        }),
        onRehydrateStorage: () => (state) => {
          // Validate stored auth data on rehydration
          if (state?.authData) {
            const now = Date.now();
            
            // Check if OAuth token is expired
            if (state.authData.isOAuth && state.authData.expiresAt && now >= state.authData.expiresAt) {
              console.log('Stored OAuth token expired, clearing auth data');
              state.logout();
              return;
            }
            
            // Ensure isAuthenticated matches the presence of valid auth data
            state.isAuthenticated = state.hasValidAuth();
          }
        },
      }
    ),
    {
      name: 'auth-store',
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

// Auth state selectors
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);
export const useAuthData = () => useAuthStore((state) => state.authData);
export const useUser = () => useAuthStore((state) => state.user);
export const useResources = () => useAuthStore((state) => state.resources);

// Auth action selectors
export const useAuthActions = () => useAuthStore((state) => ({
  setLoading: state.setLoading,
  setError: state.setError,
  setAuthData: state.setAuthData,
  setUser: state.setUser,
  setResources: state.setResources,
  login: state.login,
  logout: state.logout,
  updateTokens: state.updateTokens,
  clearError: state.clearError,
}));

// Auth getter selectors
export const useAuthHeaders = () => useAuthStore((state) => state.getAuthHeaders());
export const useIsTokenExpired = () => useAuthStore((state) => state.isTokenExpired());
export const useHasValidAuth = () => useAuthStore((state) => state.hasValidAuth());

// Combined selectors
export const useAuth = () => {
  const isAuthenticated = useIsAuthenticated();
  const isLoading = useAuthLoading();
  const error = useAuthError();
  const authData = useAuthData();
  const user = useUser();
  const actions = useAuthActions();
  
  return {
    isAuthenticated,
    isLoading,
    error,
    authData,
    user,
    ...actions,
  };
};

export default useAuthStore;
