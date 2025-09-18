/**
 * Core type definitions for the Jira Worklog Viewer application
 *
 * This file contains all the essential TypeScript interfaces and types
 * that are used throughout the application for type safety and consistency.
 */

// ============================================================================
// Authentication Types
// ============================================================================

export interface AuthCredentials {
  email: string;
  apiToken?: string;
  accessToken?: string;
  isOAuth?: boolean;
}

export interface AtlassianUser {
  accountId: string; // Changed from account_id for consistency
  name: string;
  email: string;
  picture: string;
  displayName?: string;
  emailAddress?: string;
  accountType?: string;
  active?: boolean;
  timeZone?: string;
  locale?: string;
  avatarUrls?: Record<string, string>;
}

export interface AtlassianSite {
  id: string;
  name: string;
  url: string;
  scopes: string[];
  avatarUrl: string;
}

export interface AtlassianTokens {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  token_type?: string;
  scope?: string;
}

// Authentication Types
export interface AuthData {
  email: string;
  userId?: string;
  displayName?: string;
  avatarUrl?: string;

  // OAuth specific fields
  isOAuth?: boolean;
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  cloudId?: string;

  // Basic auth specific fields
  serverUrl?: string;
  apiToken?: string;
}

export interface User {
  accountId: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
  locale?: string;
  timeZone?: string;
  accountType: "atlassian" | "customer";
  active: boolean;
}

export interface AtlassianResource {
  id: string;
  name: string;
  url: string;
  scopes: string[];
  avatarUrl?: string;
}

// ============================================================================
// Jira Data Types
// ============================================================================

export interface JiraProject {
  id: string;
  key: string;
  name: string;
  description?: string;
  projectTypeKey?: string;
  simplified?: boolean;
  style?: string;
  isPrivate?: boolean;
  lead?: {
    accountId: string;
    displayName: string;
    avatarUrls: Record<string, string>;
  };
  avatarUrls?: Record<string, string>;
  url?: string;
  issueTypes?: JiraIssueType[];
  permissions?: Record<string, boolean>;
  insight?: Record<string, any>;
}

export interface JiraIssueType {
  id: string;
  name: string;
  description?: string;
  iconUrl?: string;
  subtask?: boolean;
  avatarId?: number;
  hierarchyLevel?: number;
}

export interface JiraIssue {
  id: string;
  key: string;
  summary: string;
  description?: string;
  issueType: JiraIssueType;
  priority: {
    id: string;
    name: string;
    iconUrl: string;
  };
  status: {
    id: string;
    name: string;
    statusCategory: {
      id: string;
      name: string;
      colorName: string;
      key: string;
    };
  };
  project: JiraProject;
  assignee?: AtlassianUser;
  reporter?: AtlassianUser;
  created: string;
  updated: string;
  duedate?: string;
  timetracking?: {
    originalEstimate?: string;
    remainingEstimate?: string;
    timeSpent?: string;
    originalEstimateSeconds?: number;
    remainingEstimateSeconds?: number;
    timeSpentSeconds?: number;
  };
  worklog?: {
    worklogs: JiraWorklog[];
    total: number;
    maxResults: number;
  };
  subtasks?: JiraIssue[];
  parent?: {
    id: string;
    key: string;
    summary: string;
  };
}

export interface JiraWorklog {
  id: string;
  issueId: string;
  issueKey: string;
  summary: string;
  timeSpent: string;
  timeSpentSeconds: number;
  comment?: string;
  created: string;
  updated: string;
  started: string;
  author: AtlassianUser;
  updateAuthor?: AtlassianUser;
  visibility?: {
    type: string;
    value: string;
  };
  issueType: JiraIssueType;
  priority: {
    id: string;
    name: string;
    iconUrl: string;
  };
  status: {
    id: string;
    name: string;
    statusCategory: {
      id: string;
      name: string;
      colorName: string;
      key: string;
    };
  };
  project: JiraProject;
  // Convenience property for easier access
  issue: {
    key: string;
    summary: string;
  };
}

// ============================================================================
// Analytics and Dashboard Types
// ============================================================================

export interface WorklogAnalytics {
  totalTimeSpent: number;
  totalTimeSpentFormatted: string;
  totalWorklogs: number;
  averageTimePerWorklog: number;
  averageTimePerWorklogFormatted: string;
  projectBreakdown: Array<{
    projectKey: string;
    projectName: string;
    timeSpent: number;
    timeSpentFormatted: string;
    worklogCount: number;
    percentage: number;
  }>;
  issueTypeBreakdown: Array<{
    issueTypeName: string;
    timeSpent: number;
    timeSpentFormatted: string;
    worklogCount: number;
    percentage: number;
  }>;
  dailyBreakdown: Array<{
    date: string;
    timeSpent: number;
    timeSpentFormatted: string;
    worklogCount: number;
  }>;
  weeklyBreakdown: Array<{
    week: string;
    timeSpent: number;
    timeSpentFormatted: string;
    worklogCount: number;
  }>;
  monthlyBreakdown: Array<{
    month: string;
    timeSpent: number;
    timeSpentFormatted: string;
    worklogCount: number;
  }>;
}

export interface DashboardFilters {
  startDate?: Date;
  endDate?: Date;
  projectKeys?: string[];
  issueTypes?: string[];
  statuses?: string[];
  priorities?: string[];
  searchTerm?: string;
}

export interface DateRange {
  start: Date;
  end: Date;
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    maxResults?: number;
    startAt?: number;
    isLast?: boolean;
    cloudId?: string;
    baseUrl?: string;
  };
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  meta: {
    total: number;
    maxResults: number;
    startAt: number;
    isLast: boolean;
  };
}

export interface JiraSearchResponse {
  expand: string;
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
}

// ============================================================================
// Form and UI Types
// ============================================================================

export interface WorklogFormData {
  issueKey: string;
  timeSpent: string;
  started: Date;
  comment?: string;
  visibility?: {
    type: "group" | "role";
    value: string;
  };
}

export interface SearchFilters {
  query?: string;
  projectKey?: string;
  issueType?: string;
  status?: string;
  priority?: string;
  timeRange?: "today" | "week" | "month" | "quarter" | "year" | "custom";
  sortBy?:
    | "date_desc"
    | "date_asc"
    | "time_desc"
    | "time_asc"
    | "project"
    | "issue";
  searchFields?: string[];
}

export interface TableColumn<T = any> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  width?: string;
  render?: (value: any, record: T) => React.ReactNode;
}

export interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

// ============================================================================
// Error Handling Types
// ============================================================================

export interface AppError {
  code: string;
  message: string;
  details?: any;
  timestamp: number;
  stack?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// ============================================================================
// State Management Types
// ============================================================================

export interface AuthState {
  isAuthenticated: boolean;
  user: AtlassianUser | null;
  authData: AuthData | null;
  isLoading: boolean;
  error: string | null;
}

export interface WorklogState {
  worklogs: JiraWorklog[];
  filteredWorklogs: JiraWorklog[];
  isLoading: boolean;
  error: string | null;
  filters: DashboardFilters;
  analytics: WorklogAnalytics | null;
}

export interface ProjectState {
  projects: JiraProject[];
  selectedProject: JiraProject | null;
  isLoading: boolean;
  error: string | null;
}

// ============================================================================
// Configuration Types
// ============================================================================

export interface AppConfig {
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
    retryDelay: number;
  };
  auth: {
    tokenKey: string;
    refreshTokenKey: string;
    sessionTimeout: number;
  };
  oauth: {
    clientId: string;
    redirectUri: string;
    scopes: string[];
  };
  features: {
    enableAnalytics: boolean;
    enableExport: boolean;
    enableNotifications: boolean;
    maxWorklogsPerPage: number;
  };
}

// ============================================================================
// Utility Types
// ============================================================================

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type AsyncState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};

export type QueryKey = readonly unknown[];

// ============================================================================
// Theme and UI Types
// ============================================================================

export interface Theme {
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      disabled: string;
    };
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  borderRadius: {
    sm: string;
    md: string;
    lg: string;
  };
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

export type ComponentSize = "sm" | "md" | "lg";
export type ComponentVariant = "primary" | "secondary" | "outline" | "ghost";
export type AlertType = "success" | "error" | "warning" | "info";

// ============================================================================
// Worklog Store Types
// ============================================================================

export interface WorklogFilter {
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  projects: string[];
  issues: string[];
  authors: string[];
  timeSpentRange: {
    min: number | null;
    max: number | null;
  };
  searchQuery: string;
}

export interface WorklogSummary {
  totalTimeSpent: number;
  totalEntries: number;
  avgTimePerEntry: number;
  timeByIssue: Record<string, number>;
  timeByAuthor: Record<string, number>;
  timeByProject: Record<string, number>;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface SortConfig {
  field: "started" | "timeSpent" | "issue" | "author" | "updated";
  direction: "asc" | "desc";
}
