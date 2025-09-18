/**
 * Projects Store
 * 
 * Zustand store for managing Jira projects state.
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { JiraProject } from '../types';

// ============================================================================
// Types
// ============================================================================

interface ProjectsState {
  // Data State
  projects: JiraProject[];
  selectedProject: JiraProject | null;
  
  // UI State
  isLoading: boolean;
  error: string | null;
  
  // Cache State
  lastFetch: number | null;
  cacheValid: boolean;
  
  // Actions
  setProjects: (projects: JiraProject[]) => void;
  setSelectedProject: (project: JiraProject | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  invalidateCache: () => void;
  refreshData: () => void;
  
  // Getters
  getProjectByKey: (key: string) => JiraProject | undefined;
  getProjectById: (id: string) => JiraProject | undefined;
  isCacheValid: () => boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState = {
  projects: [],
  selectedProject: null,
  isLoading: false,
  error: null,
  lastFetch: null,
  cacheValid: false,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useProjectsStore = create<ProjectsState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        
        // ====================================================================
        // Actions
        // ====================================================================
        
        setProjects: (projects: JiraProject[]) => {
          set({ 
            projects,
            lastFetch: Date.now(),
            cacheValid: true,
            error: null,
          }, false, 'projects/setProjects');
        },
        
        setSelectedProject: (project: JiraProject | null) => {
          set({ selectedProject: project }, false, 'projects/setSelectedProject');
        },
        
        setLoading: (loading: boolean) => {
          set({ isLoading: loading }, false, 'projects/setLoading');
        },
        
        setError: (error: string | null) => {
          set({ error }, false, 'projects/setError');
        },
        
        clearError: () => {
          set({ error: null }, false, 'projects/clearError');
        },
        
        invalidateCache: () => {
          set({ 
            cacheValid: false,
            lastFetch: null,
          }, false, 'projects/invalidateCache');
        },
        
        refreshData: () => {
          set({ 
            cacheValid: false,
            lastFetch: null,
            isLoading: true,
          }, false, 'projects/refreshData');
        },
        
        // ====================================================================
        // Getters
        // ====================================================================
        
        getProjectByKey: (key: string) => {
          const { projects } = get();
          return projects.find(p => p.key === key);
        },
        
        getProjectById: (id: string) => {
          const { projects } = get();
          return projects.find(p => p.id === id);
        },
        
        isCacheValid: () => {
          const { cacheValid, lastFetch } = get();
          if (!cacheValid || !lastFetch) return false;
          
          // Cache is valid for 5 minutes
          const cacheExpiry = 5 * 60 * 1000; // 5 minutes
          return Date.now() - lastFetch < cacheExpiry;
        },
      }),
      {
        name: 'projects-storage',
        partialize: (state) => ({
          projects: state.projects,
          selectedProject: state.selectedProject,
          lastFetch: state.lastFetch,
          cacheValid: state.cacheValid,
        }),
        onRehydrateStorage: () => (state) => {
          // Validate cache on rehydration
          if (state && !state.isCacheValid()) {
            state.invalidateCache();
          }
        },
      }
    ),
    {
      name: 'projects-store',
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

// Data selectors
export const useProjects = () => useProjectsStore((state) => state.projects);
export const useSelectedProject = () => useProjectsStore((state) => state.selectedProject);

// UI state selectors
export const useProjectsLoading = () => useProjectsStore((state) => state.isLoading);
export const useProjectsError = () => useProjectsStore((state) => state.error);

// Action selectors
export const useProjectsActions = () => useProjectsStore((state) => ({
  setProjects: state.setProjects,
  setSelectedProject: state.setSelectedProject,
  setLoading: state.setLoading,
  setError: state.setError,
  clearError: state.clearError,
  invalidateCache: state.invalidateCache,
  refreshData: state.refreshData,
}));

// Getter selectors
export const useProjectByKey = (key: string) => 
  useProjectsStore((state) => state.getProjectByKey(key));

export const useProjectById = (id: string) => 
  useProjectsStore((state) => state.getProjectById(id));

// Combined selectors
export const useProjectsState = () => {
  const projects = useProjects();
  const selectedProject = useSelectedProject();
  const isLoading = useProjectsLoading();
  const error = useProjectsError();
  const actions = useProjectsActions();
  
  return {
    projects,
    selectedProject,
    isLoading,
    error,
    ...actions,
  };
};

export default useProjectsStore;
