/**
 * Worklog Store
 *
 * Zustand store for managing worklog state, including fetching, filtering, and CRUD operations.
 */

import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  JiraWorklog,
  WorklogFilter,
  PaginationInfo,
  SortConfig,
  WorklogSummary,
  JiraIssue,
} from "../types";

// ============================================================================
// Types
// ============================================================================

interface WorklogState {
  // Data State
  worklogs: JiraWorklog[];
  selectedWorklog: JiraWorklog | null;
  filteredWorklogs: JiraWorklog[];
  summary: WorklogSummary | null;

  // UI State
  isLoading: boolean;
  isCreating: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
  error: string | null;

  // Filter & Pagination State
  filters: WorklogFilter;
  pagination: PaginationInfo;
  sort: SortConfig;

  // Cache State
  lastFetch: number | null;
  cacheValid: boolean;

  // Actions - Data Management
  setWorklogs: (worklogs: JiraWorklog[]) => void;
  addWorklog: (worklog: JiraWorklog) => void;
  updateWorklog: (worklogId: string, updates: Partial<JiraWorklog>) => void;
  removeWorklog: (worklogId: string) => void;
  setSelectedWorklog: (worklog: JiraWorklog | null) => void;
  setSummary: (summary: WorklogSummary) => void;

  // Actions - UI State
  setLoading: (loading: boolean) => void;
  setCreating: (creating: boolean) => void;
  setUpdating: (updating: boolean) => void;
  setDeleting: (deleting: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;

  // Actions - Filter & Search
  setFilters: (filters: Partial<WorklogFilter>) => void;
  clearFilters: () => void;
  setPagination: (pagination: Partial<PaginationInfo>) => void;
  setSort: (sort: SortConfig) => void;

  // Actions - Cache Management
  invalidateCache: () => void;
  refreshData: () => void;

  // Getters
  getWorklogById: (id: string) => JiraWorklog | undefined;
  getWorklogsByIssue: (issueKey: string) => JiraWorklog[];
  getTotalTimeSpent: () => number;
  getFilteredCount: () => number;
  hasActiveFilters: () => boolean;
  isCacheValid: () => boolean;
}

// ============================================================================
// Initial State
// ============================================================================

const initialFilters: WorklogFilter = {
  dateRange: {
    start: null,
    end: null,
  },
  projects: [],
  issues: [],
  authors: [],
  timeSpentRange: {
    min: null,
    max: null,
  },
  searchQuery: "",
};

const initialPagination: PaginationInfo = {
  page: 1,
  pageSize: 25,
  total: 0,
  totalPages: 0,
  hasNext: false,
  hasPrevious: false,
};

const initialSort: SortConfig = {
  field: "started",
  direction: "desc",
};

const initialState = {
  // Data State
  worklogs: [],
  selectedWorklog: null,
  filteredWorklogs: [],
  summary: null,

  // UI State
  isLoading: false,
  isCreating: false,
  isUpdating: false,
  isDeleting: false,
  error: null,

  // Filter & Pagination State
  filters: initialFilters,
  pagination: initialPagination,
  sort: initialSort,

  // Cache State
  lastFetch: null,
  cacheValid: false,
};

// ============================================================================
// Helper Functions
// ============================================================================

const applyFilters = (
  worklogs: JiraWorklog[],
  filters: WorklogFilter
): JiraWorklog[] => {
  return worklogs.filter((worklog) => {
    // Date range filter
    if (filters.dateRange.start || filters.dateRange.end) {
      const worklogDate = new Date(worklog.started);
      if (filters.dateRange.start && worklogDate < filters.dateRange.start)
        return false;
      if (filters.dateRange.end && worklogDate > filters.dateRange.end)
        return false;
    }

    // Project filter
    if (filters.projects.length > 0) {
      const projectKey = worklog.issue.key.split("-")[0];
      if (!filters.projects.includes(projectKey)) return false;
    }

    // Issue filter
    if (filters.issues.length > 0) {
      if (!filters.issues.includes(worklog.issue.key)) return false;
    }

    // Author filter
    if (filters.authors.length > 0) {
      if (!filters.authors.includes(worklog.author.accountId)) return false;
    }

    // Time spent range filter
    if (
      filters.timeSpentRange.min !== null ||
      filters.timeSpentRange.max !== null
    ) {
      if (
        filters.timeSpentRange.min !== null &&
        worklog.timeSpentSeconds < filters.timeSpentRange.min
      )
        return false;
      if (
        filters.timeSpentRange.max !== null &&
        worklog.timeSpentSeconds > filters.timeSpentRange.max
      )
        return false;
    }

    // Search query filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [
        worklog.issue.key,
        worklog.issue.summary,
        worklog.comment || "",
        worklog.author.displayName,
      ]
        .join(" ")
        .toLowerCase();

      if (!searchableText.includes(query)) return false;
    }

    return true;
  });
};

const applySorting = (
  worklogs: JiraWorklog[],
  sort: SortConfig
): JiraWorklog[] => {
  return [...worklogs].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sort.field) {
      case "started":
        aValue = new Date(a.started).getTime();
        bValue = new Date(b.started).getTime();
        break;
      case "timeSpent":
        aValue = a.timeSpentSeconds;
        bValue = b.timeSpentSeconds;
        break;
      case "issue":
        aValue = a.issue.key;
        bValue = b.issue.key;
        break;
      case "author":
        aValue = a.author.displayName;
        bValue = b.author.displayName;
        break;
      case "updated":
        aValue = new Date(a.updated).getTime();
        bValue = new Date(b.updated).getTime();
        break;
      default:
        return 0;
    }

    if (aValue < bValue) return sort.direction === "asc" ? -1 : 1;
    if (aValue > bValue) return sort.direction === "asc" ? 1 : -1;
    return 0;
  });
};

const calculateSummary = (worklogs: JiraWorklog[]): WorklogSummary => {
  const totalTimeSpent = worklogs.reduce(
    (sum, worklog) => sum + worklog.timeSpentSeconds,
    0
  );
  const totalEntries = worklogs.length;

  const issueMap = new Map<string, number>();
  const authorMap = new Map<string, number>();
  const projectMap = new Map<string, number>();

  worklogs.forEach((worklog) => {
    // Count by issue
    const currentIssueTime = issueMap.get(worklog.issue.key) || 0;
    issueMap.set(
      worklog.issue.key,
      currentIssueTime + worklog.timeSpentSeconds
    );

    // Count by author
    const currentAuthorTime = authorMap.get(worklog.author.accountId) || 0;
    authorMap.set(
      worklog.author.accountId,
      currentAuthorTime + worklog.timeSpentSeconds
    );

    // Count by project
    const projectKey = worklog.issue.key.split("-")[0];
    const currentProjectTime = projectMap.get(projectKey) || 0;
    projectMap.set(projectKey, currentProjectTime + worklog.timeSpentSeconds);
  });

  return {
    totalTimeSpent,
    totalEntries,
    avgTimePerEntry: totalEntries > 0 ? totalTimeSpent / totalEntries : 0,
    timeByIssue: Object.fromEntries(issueMap),
    timeByAuthor: Object.fromEntries(authorMap),
    timeByProject: Object.fromEntries(projectMap),
  };
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useWorklogStore = create<WorklogState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ====================================================================
      // Data Management Actions
      // ====================================================================

      setWorklogs: (worklogs: JiraWorklog[]) => {
        const { filters, sort } = get();
        const filtered = applyFilters(worklogs, filters);
        const sorted = applySorting(filtered, sort);
        const summary = calculateSummary(filtered);

        set(
          {
            worklogs,
            filteredWorklogs: sorted,
            summary,
            lastFetch: Date.now(),
            cacheValid: true,
          },
          false,
          "worklog/setWorklogs"
        );
      },

      addWorklog: (worklog: JiraWorklog) => {
        const { worklogs } = get();
        const updatedWorklogs = [...worklogs, worklog];
        get().setWorklogs(updatedWorklogs);
      },

      updateWorklog: (worklogId: string, updates: Partial<JiraWorklog>) => {
        const { worklogs } = get();
        const updatedWorklogs = worklogs.map((w) =>
          w.id === worklogId ? { ...w, ...updates } : w
        );
        get().setWorklogs(updatedWorklogs);
      },

      removeWorklog: (worklogId: string) => {
        const { worklogs } = get();
        const updatedWorklogs = worklogs.filter((w) => w.id !== worklogId);
        get().setWorklogs(updatedWorklogs);
      },

      setSelectedWorklog: (worklog: JiraWorklog | null) => {
        set({ selectedWorklog: worklog }, false, "worklog/setSelectedWorklog");
      },

      setSummary: (summary: WorklogSummary) => {
        set({ summary }, false, "worklog/setSummary");
      },

      // ====================================================================
      // UI State Actions
      // ====================================================================

      setLoading: (loading: boolean) => {
        set({ isLoading: loading }, false, "worklog/setLoading");
      },

      setCreating: (creating: boolean) => {
        set({ isCreating: creating }, false, "worklog/setCreating");
      },

      setUpdating: (updating: boolean) => {
        set({ isUpdating: updating }, false, "worklog/setUpdating");
      },

      setDeleting: (deleting: boolean) => {
        set({ isDeleting: deleting }, false, "worklog/setDeleting");
      },

      setError: (error: string | null) => {
        set({ error }, false, "worklog/setError");
      },

      clearError: () => {
        set({ error: null }, false, "worklog/clearError");
      },

      // ====================================================================
      // Filter & Search Actions
      // ====================================================================

      setFilters: (newFilters: Partial<WorklogFilter>) => {
        const { filters, worklogs, sort } = get();
        const updatedFilters = { ...filters, ...newFilters };
        const filtered = applyFilters(worklogs, updatedFilters);
        const sorted = applySorting(filtered, sort);
        const summary = calculateSummary(filtered);

        set(
          {
            filters: updatedFilters,
            filteredWorklogs: sorted,
            summary,
            pagination: { ...get().pagination, page: 1 }, // Reset to first page
          },
          false,
          "worklog/setFilters"
        );
      },

      clearFilters: () => {
        const { worklogs, sort } = get();
        const sorted = applySorting(worklogs, sort);
        const summary = calculateSummary(worklogs);

        set(
          {
            filters: initialFilters,
            filteredWorklogs: sorted,
            summary,
            pagination: { ...get().pagination, page: 1 },
          },
          false,
          "worklog/clearFilters"
        );
      },

      setPagination: (newPagination: Partial<PaginationInfo>) => {
        const { pagination } = get();
        const updatedPagination = { ...pagination, ...newPagination };

        set(
          {
            pagination: updatedPagination,
          },
          false,
          "worklog/setPagination"
        );
      },

      setSort: (newSort: SortConfig) => {
        const { filteredWorklogs } = get();
        const sorted = applySorting(filteredWorklogs, newSort);

        set(
          {
            sort: newSort,
            filteredWorklogs: sorted,
          },
          false,
          "worklog/setSort"
        );
      },

      // ====================================================================
      // Cache Management Actions
      // ====================================================================

      invalidateCache: () => {
        set(
          {
            cacheValid: false,
            lastFetch: null,
          },
          false,
          "worklog/invalidateCache"
        );
      },

      refreshData: () => {
        set(
          {
            cacheValid: false,
            lastFetch: null,
            isLoading: true,
          },
          false,
          "worklog/refreshData"
        );
      },

      // ====================================================================
      // Getters
      // ====================================================================

      getWorklogById: (id: string) => {
        const { worklogs } = get();
        return worklogs.find((w) => w.id === id);
      },

      getWorklogsByIssue: (issueKey: string) => {
        const { worklogs } = get();
        return worklogs.filter((w) => w.issue.key === issueKey);
      },

      getTotalTimeSpent: () => {
        const { filteredWorklogs } = get();
        return filteredWorklogs.reduce((sum, w) => sum + w.timeSpentSeconds, 0);
      },

      getFilteredCount: () => {
        const { filteredWorklogs } = get();
        return filteredWorklogs.length;
      },

      hasActiveFilters: () => {
        const { filters } = get();
        return (
          filters.dateRange.start !== null ||
          filters.dateRange.end !== null ||
          filters.projects.length > 0 ||
          filters.issues.length > 0 ||
          filters.authors.length > 0 ||
          filters.timeSpentRange.min !== null ||
          filters.timeSpentRange.max !== null ||
          filters.searchQuery.trim() !== ""
        );
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
      name: "worklog-store",
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

// Data selectors
export const useWorklogs = () =>
  useWorklogStore((state) => state.filteredWorklogs);
export const useAllWorklogs = () => useWorklogStore((state) => state.worklogs);
export const useSelectedWorklog = () =>
  useWorklogStore((state) => state.selectedWorklog);
export const useWorklogSummary = () =>
  useWorklogStore((state) => state.summary);

// UI state selectors
export const useWorklogLoading = () =>
  useWorklogStore((state) => ({
    isLoading: state.isLoading,
    isCreating: state.isCreating,
    isUpdating: state.isUpdating,
    isDeleting: state.isDeleting,
  }));
export const useWorklogError = () => useWorklogStore((state) => state.error);

// Filter & pagination selectors
export const useWorklogFilters = () =>
  useWorklogStore((state) => state.filters);
export const useWorklogPagination = () =>
  useWorklogStore((state) => state.pagination);
export const useWorklogSort = () => useWorklogStore((state) => state.sort);

// Action selectors
export const useWorklogActions = () =>
  useWorklogStore((state) => ({
    // Data actions
    setWorklogs: state.setWorklogs,
    addWorklog: state.addWorklog,
    updateWorklog: state.updateWorklog,
    removeWorklog: state.removeWorklog,
    setSelectedWorklog: state.setSelectedWorklog,

    // UI actions
    setLoading: state.setLoading,
    setCreating: state.setCreating,
    setUpdating: state.setUpdating,
    setDeleting: state.setDeleting,
    setError: state.setError,
    clearError: state.clearError,

    // Filter actions
    setFilters: state.setFilters,
    clearFilters: state.clearFilters,
    setPagination: state.setPagination,
    setSort: state.setSort,

    // Cache actions
    invalidateCache: state.invalidateCache,
    refreshData: state.refreshData,
  }));

// Combined selectors
export const useWorklogState = () => {
  const worklogs = useWorklogs();
  const loading = useWorklogLoading();
  const error = useWorklogError();
  const filters = useWorklogFilters();
  const pagination = useWorklogPagination();
  const sort = useWorklogSort();
  const summary = useWorklogSummary();
  const actions = useWorklogActions();

  return {
    worklogs,
    loading,
    error,
    filters,
    pagination,
    sort,
    summary,
    ...actions,
  };
};

export default useWorklogStore;
