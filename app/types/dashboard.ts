// Types and interfaces for Dashboard and related components

export interface AuthData {
  siteUrl: string;
  email: string;
  apiToken: string;
}

export interface JiraWorklog {
  id: string;
  issueKey: string;
  summary: string;
  timeSpent: string;
  timeSpentSeconds: number;
  comment: string;
  started: string;
  created: string;
  project?: {
    key: string;
    name: string;
    avatarUrls?: {
      "24x24": string;
    };
  };
  author: {
    displayName: string;
    emailAddress: string;
    avatarUrls?: {
      "24x24": string;
    };
  };
  issueType?: {
    name: string;
    iconUrl: string;
  };
  priority?: {
    name: string;
    iconUrl: string;
  };
  status?: {
    name: string;
    statusCategory: {
      name: string;
      colorName: string;
    };
  };
}

export interface DashboardData {
  summary: {
    totalWorklogs: number;
    totalHours: number;
    uniqueIssues: number;
    uniqueProjects: number;
  };
  worklogs: JiraWorklog[];
}

export interface AnalyticsData {
  analytics: {
    dateRange: { start: string; end: string };
    worklogSummary: {
      totalWorklogs: number;
      totalHours: number;
      averageHoursPerDay: number;
      uniqueProjects: number;
      uniqueIssues: number;
    };
    issueSummary: {
      totalIssues: number;
      resolvedIssues: number;
      createdIssues: number;
      resolutionRate: number;
    };
    distributions: {
      issuesByStatus: { [key: string]: number };
      issuesByPriority: { [key: string]: number };
      projectTimeStats: Array<{
        projectKey: string;
        projectName: string;
        totalHours: number;
        totalEntries: number;
        percentage: number;
      }>;
    };
    trends: {
      dailyStats: { [key: string]: { hours: number; entries: number } };
      mostProductiveDay: { date: string; hours: number; entries: number };
    };
  };
}

export interface ProjectData {
  projects: Array<{
    id: string;
    key: string;
    name: string;
    description: string;
    avatarUrls: any;
    lead: {
      displayName: string;
      avatarUrls: any;
    };
  }>;
  total: number;
}

export interface DashboardProps {
  authData: AuthData;
  onLogout: () => void;
}

export interface DateRangeCalendarProps {
  worklogs: JiraWorklog[];
  onDateClick: (date: Date) => void;
  selectedDate: Date | null;
  startDateRange: Date | null;
  endDateRange: Date | null;
  setSelectedDate: (date: Date) => void;
  setIsEditMode: (isEdit: boolean) => void;
  setCurrentWorklog: (worklog: JiraWorklog | null) => void;
  setWorklogForm: (form: any) => void;
  setShowWorklogModal: (show: boolean) => void;
  setDayWorklogs: (worklogs: JiraWorklog[]) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export interface WorklogListProps {
  worklogs: JiraWorklog[];
  onEditClick: (worklog: JiraWorklog) => void;
  onAddNewClick: () => void;
  onClose: () => void;
}
