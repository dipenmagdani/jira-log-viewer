/**
 * Application-wide constants for the Jira Worklog Viewer
 * 
 * This file centralizes all constant values used throughout the application,
 * making them easily maintainable and consistent.
 */

// ============================================================================
// API Constants
// ============================================================================

export const API_ENDPOINTS = {
  // Atlassian OAuth endpoints
  OAUTH: {
    AUTHORIZE: 'https://auth.atlassian.com/authorize',
    TOKEN: 'https://auth.atlassian.com/oauth/token',
    ACCESSIBLE_RESOURCES: 'https://api.atlassian.com/oauth/token/accessible-resources',
  },
  
  // Jira REST API v3 endpoints (relative to base URL)
  JIRA: {
    MYSELF: '/rest/api/3/myself',
    PROJECTS: '/rest/api/3/project/search',
    ISSUES: '/rest/api/3/search',
    ISSUE_DETAIL: '/rest/api/3/issue',
    WORKLOGS: '/rest/api/3/worklog/list',
    WORKLOG_DETAIL: '/rest/api/3/issue/{issueIdOrKey}/worklog',
    USER_GROUPS: '/rest/api/3/user/groups',
    PERMISSIONS: '/rest/api/3/mypermissions',
    ISSUE_TYPES: '/rest/api/3/issuetype',
    PRIORITIES: '/rest/api/3/priority',
    STATUSES: '/rest/api/3/status',
  },
  
  // Internal API endpoints
  INTERNAL: {
    AUTH: {
      LOGIN: '/api/auth/login',
      LOGOUT: '/api/auth/logout',
      SESSION: '/api/auth/session',
      CALLBACK: '/api/auth/callback/atlassian',
    },
    PROJECTS: '/api/projects',
    WORKLOGS: '/api/worklogs',
    ANALYTICS: '/api/analytics',
    ISSUES: '/api/issues',
    USER: '/api/user',
    SEARCH: '/api/search',
    WORKLOG: {
      ADD: '/api/add-worklog',
      UPDATE: '/api/update-worklog',
      DELETE: '/api/delete-worklog',
      DETAILS: '/api/worklog-details',
    },
  },
} as const;

// ============================================================================
// Authentication Constants
// ============================================================================

export const AUTH_CONFIG = {
  STORAGE_KEYS: {
    AUTH_DATA: 'atlassian_auth_data',
    ACCESS_TOKEN: 'atlassian_access_token',
    REFRESH_TOKEN: 'atlassian_refresh_token',
    USER_PREFERENCES: 'user_preferences',
  },
  
  TOKEN_EXPIRY_BUFFER: 60000, // 1 minute in milliseconds
  SESSION_TIMEOUT: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
  
  OAUTH_SCOPES: [
    'offline_access',
    'read:jira-user',
    'read:jira-work',
    'write:jira-work',
    'read:me',
  ],
} as const;

// ============================================================================
// UI Constants
// ============================================================================

export const UI_CONFIG = {
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 25,
    PAGE_SIZE_OPTIONS: [10, 25, 50, 100],
    MAX_VISIBLE_PAGES: 5,
  },
  
  DEBOUNCE_DELAY: 300, // milliseconds
  
  ANIMATION: {
    DURATION: {
      FAST: 150,
      NORMAL: 300,
      SLOW: 500,
    },
    EASING: {
      EASE_IN: 'cubic-bezier(0.4, 0, 1, 1)',
      EASE_OUT: 'cubic-bezier(0, 0, 0.2, 1)',
      EASE_IN_OUT: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  
  BREAKPOINTS: {
    SM: 640,
    MD: 768,
    LG: 1024,
    XL: 1280,
    '2XL': 1536,
  },
  
  Z_INDEX: {
    DROPDOWN: 1000,
    STICKY: 1010,
    FIXED: 1020,
    MODAL_BACKDROP: 1030,
    MODAL: 1040,
    POPOVER: 1050,
    TOOLTIP: 1060,
    TOAST: 1070,
  },
} as const;

// ============================================================================
// Date and Time Constants
// ============================================================================

export const DATE_CONFIG = {
  FORMATS: {
    DISPLAY_DATE: 'MMM dd, yyyy',
    DISPLAY_DATETIME: 'MMM dd, yyyy HH:mm',
    API_DATE: 'yyyy-MM-dd',
    API_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSSXXX",
    ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss.SSS'+0000'",
    TIME_ONLY: 'HH:mm',
    YEAR_MONTH: 'yyyy-MM',
  },
  
  TIME_RANGES: {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    THIS_WEEK: 'this_week',
    LAST_WEEK: 'last_week',
    THIS_MONTH: 'this_month',
    LAST_MONTH: 'last_month',
    THIS_QUARTER: 'this_quarter',
    LAST_QUARTER: 'last_quarter',
    THIS_YEAR: 'this_year',
    LAST_YEAR: 'last_year',
    CUSTOM: 'custom',
  },
  
  DEFAULT_DATE_RANGE_DAYS: 30,
} as const;

// ============================================================================
// Error Messages
// ============================================================================

export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your internet connection.',
  AUTHENTICATION: 'Authentication failed. Please log in again.',
  AUTHORIZATION: 'You do not have permission to access this resource.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  SERVER_ERROR: 'Server error. Please try again later.',
  TIMEOUT: 'Request timed out. Please try again.',
  
  // Specific error messages
  INVALID_CREDENTIALS: 'Invalid email or API token.',
  TOKEN_EXPIRED: 'Your session has expired. Please log in again.',
  NO_PROJECTS: 'No projects found for your account.',
  NO_WORKLOGS: 'No worklogs found for the selected criteria.',
  INVALID_TIME_FORMAT: 'Please enter time in valid format (e.g., 1h 30m, 2.5h, 150m).',
  REQUIRED_FIELD: 'This field is required.',
  INVALID_DATE_RANGE: 'End date must be after start date.',
  MAX_DATE_RANGE: 'Date range cannot exceed 1 year.',
} as const;

// ============================================================================
// Success Messages
// ============================================================================

export const SUCCESS_MESSAGES = {
  LOGIN: 'Successfully logged in!',
  LOGOUT: 'Successfully logged out!',
  WORKLOG_ADDED: 'Worklog added successfully!',
  WORKLOG_UPDATED: 'Worklog updated successfully!',
  WORKLOG_DELETED: 'Worklog deleted successfully!',
  DATA_EXPORTED: 'Data exported successfully!',
  SETTINGS_SAVED: 'Settings saved successfully!',
} as const;

// ============================================================================
// Form Validation Constants
// ============================================================================

export const VALIDATION_RULES = {
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MAX_LENGTH: 254,
  },
  
  ISSUE_KEY: {
    PATTERN: /^[A-Z]{1,10}-\d+$/,
    MAX_LENGTH: 20,
  },
  
  TIME_SPENT: {
    PATTERNS: {
      HOURS_MINUTES: /^(\d+h)?(\s*\d+m)?$/i,
      DECIMAL_HOURS: /^\d+(\.\d+)?h?$/i,
      MINUTES_ONLY: /^\d+m$/i,
    },
    MAX_HOURS: 24,
    MAX_MINUTES: 1440, // 24 hours
  },
  
  COMMENT: {
    MAX_LENGTH: 32767, // Jira's limit
  },
  
  PROJECT_KEY: {
    PATTERN: /^[A-Z]{1,10}$/,
    MAX_LENGTH: 10,
  },
} as const;

// ============================================================================
// Chart and Analytics Constants
// ============================================================================

export const CHART_CONFIG = {
  COLORS: {
    PRIMARY: '#3B82F6',
    SECONDARY: '#10B981',
    WARNING: '#F59E0B',
    ERROR: '#EF4444',
    INFO: '#06B6D4',
    PURPLE: '#8B5CF6',
    PINK: '#EC4899',
    GRAY: '#6B7280',
  },
  
  PALETTE: [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
  ],
  
  DEFAULT_OPTIONS: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
      },
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
        },
      },
      y: {
        display: true,
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
      },
    },
  },
} as const;

// ============================================================================
// File and Export Constants
// ============================================================================

export const EXPORT_CONFIG = {
  FORMATS: {
    CSV: 'csv',
    EXCEL: 'xlsx',
    PDF: 'pdf',
    JSON: 'json',
  },
  
  FILE_SIZE_LIMITS: {
    MAX_EXPORT_RECORDS: 10000,
    MAX_FILE_SIZE_MB: 50,
  },
  
  MIME_TYPES: {
    CSV: 'text/csv',
    EXCEL: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    PDF: 'application/pdf',
    JSON: 'application/json',
  },
} as const;

// ============================================================================
// Feature Flags
// ============================================================================

export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: true,
  ENABLE_EXPORT: true,
  ENABLE_NOTIFICATIONS: true,
  ENABLE_DARK_MODE: true,
  ENABLE_KEYBOARD_SHORTCUTS: true,
  ENABLE_ADVANCED_FILTERS: true,
  ENABLE_BULK_OPERATIONS: true,
  ENABLE_OFFLINE_MODE: false,
  ENABLE_PWA: false,
} as const;

// ============================================================================
// Performance Constants
// ============================================================================

export const PERFORMANCE_CONFIG = {
  CACHE_DURATION: {
    PROJECTS: 5 * 60 * 1000, // 5 minutes
    USER_INFO: 10 * 60 * 1000, // 10 minutes
    ISSUE_TYPES: 30 * 60 * 1000, // 30 minutes
    WORKLOGS: 2 * 60 * 1000, // 2 minutes
  },
  
  RETRY_CONFIG: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000,
    BACKOFF_MULTIPLIER: 2,
    MAX_DELAY: 10000,
  },
  
  VIRTUAL_SCROLL: {
    ITEM_HEIGHT: 60,
    BUFFER_SIZE: 10,
    THRESHOLD: 100,
  },
} as const;

// ============================================================================
// Keyboard Shortcuts
// ============================================================================

export const KEYBOARD_SHORTCUTS = {
  SEARCH: 'cmd+k,ctrl+k',
  NEW_WORKLOG: 'cmd+n,ctrl+n',
  REFRESH: 'cmd+r,ctrl+r',
  EXPORT: 'cmd+e,ctrl+e',
  HELP: '?',
  CLOSE_MODAL: 'Escape',
  SAVE: 'cmd+s,ctrl+s',
  CANCEL: 'Escape',
} as const;

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_VALUES = {
  PAGINATION: {
    PAGE: 1,
    PAGE_SIZE: 25,
  },
  
  DATE_RANGE: {
    DAYS_BACK: 30,
  },
  
  SORT: {
    FIELD: 'started',
    DIRECTION: 'desc' as const,
  },
  
  THEME: {
    MODE: 'light' as const,
    COLOR_SCHEME: 'blue' as const,
  },
  
  WORKLOG: {
    TIME_SPENT: '',
    COMMENT: '',
    STARTED: new Date(),
  },
} as const;

// ============================================================================
// Regular Expressions
// ============================================================================

export const REGEX_PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  ISSUE_KEY: /^[A-Z]{1,10}-\d+$/,
  PROJECT_KEY: /^[A-Z]{1,10}$/,
  TIME_SPENT: /^(?:(\d+)h)?\s*(?:(\d+)m)?$|^(\d+(?:\.\d+)?)h?$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
} as const;

// ============================================================================
// Environment Constants
// ============================================================================

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  ATLASSIAN_CLIENT_ID: process.env.NEXT_PUBLIC_ATLASSIAN_CLIENT_ID || '',
  ATLASSIAN_CLIENT_SECRET: process.env.ATLASSIAN_CLIENT_SECRET || '',
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'http://localhost:3000',
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
} as const;

export const IS_DEVELOPMENT = ENV.NODE_ENV === 'development';
export const IS_PRODUCTION = ENV.NODE_ENV === 'production';
export const IS_TEST = ENV.NODE_ENV === 'test';
