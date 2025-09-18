/**
 * Store Index
 *
 * Central export point for all Zustand stores and their selectors.
 */

// Store exports
export { default as useAuthStore } from "./authStore";
export { default as useWorklogStore } from "./worklogStore";
export { default as useProjectsStore } from "./projectsStore";

// Auth store exports
export {
  useIsAuthenticated,
  useAuthLoading,
  useAuthError,
  useAuthData,
  useUser,
  useResources,
  useAuthActions,
  useAuthHeaders,
  useIsTokenExpired,
  useHasValidAuth,
  useAuth,
} from "./authStore";

// Worklog store exports
export {
  useWorklogs,
  useAllWorklogs,
  useSelectedWorklog,
  useWorklogSummary,
  useWorklogLoading,
  useWorklogError,
  useWorklogFilters,
  useWorklogPagination,
  useWorklogSort,
  useWorklogActions,
  useWorklogState,
} from "./worklogStore";

// Projects store exports
export {
  useProjects,
  useSelectedProject,
  useProjectsLoading,
  useProjectsError,
  useProjectsActions,
  useProjectByKey,
  useProjectById,
  useProjectsState,
} from "./projectsStore";

// Import for combined hook
import { useAuth } from "./authStore";
import { useWorklogState } from "./worklogStore";
import { useProjectsState } from "./projectsStore";

// Combined state hook for commonly used stores
export const useAppState = () => {
  const auth = useAuth();
  const worklogState = useWorklogState();
  const projectsState = useProjectsState();

  return {
    auth,
    worklogs: worklogState,
    projects: projectsState,
  };
};

// Store types for TypeScript
export type { default as AuthStore } from "./authStore";
export type { default as WorklogStore } from "./worklogStore";
export type { default as ProjectsStore } from "./projectsStore";
