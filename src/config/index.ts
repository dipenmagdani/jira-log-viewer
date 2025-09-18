/**
 * Application Configuration
 *
 * This file centralizes all configuration for the Jira Worklog Viewer application,
 * including environment variables, feature flags, and API configurations.
 */

import { ENV, IS_DEVELOPMENT, IS_PRODUCTION } from "../constants";

// ============================================================================
// Environment Configuration
// ============================================================================

export const appConfig = {
  env: ENV.NODE_ENV,
  isDevelopment: IS_DEVELOPMENT,
  isProduction: IS_PRODUCTION,

  // Application URLs
  baseUrl: ENV.NEXTAUTH_URL,
  apiBaseUrl: `${ENV.NEXTAUTH_URL}/api`,

  // Atlassian OAuth Configuration
  atlassian: {
    clientId: ENV.ATLASSIAN_CLIENT_ID,
    clientSecret: ENV.ATLASSIAN_CLIENT_SECRET,
    redirectUri: `${ENV.NEXTAUTH_URL}/api/auth/callback/atlassian`,
    scopes: [
      "offline_access",
      "read:jira-user",
      "read:jira-work",
      "write:jira-work",
      "read:me",
    ],
    audience: "api.atlassian.com",
    state: "random-string", // Should be generated per request in production
  },

  // Database Configuration (for future use)
  database: {
    url: ENV.DATABASE_URL,
  },

  // Redis Configuration (for future use)
  redis: {
    url: ENV.REDIS_URL,
  },
} as const;

// ============================================================================
// API Configuration
// ============================================================================

export const apiConfig = {
  // Request timeout in milliseconds
  timeout: 30000,

  // Retry configuration
  retry: {
    attempts: 3,
    delay: 1000,
    backoffMultiplier: 2,
    maxDelay: 10000,
  },

  // Rate limiting
  rateLimit: {
    maxRequests: 100,
    windowMs: 60000, // 1 minute
  },

  // Request headers
  defaultHeaders: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // Atlassian API specific configuration
  atlassianApi: {
    baseUrl: "https://api.atlassian.com",
    version: "3",
    userAgent: "JiraWorklogViewer/1.0.0",
    maxResults: 100,
  },
} as const;

// ============================================================================
// Feature Configuration
// ============================================================================

export const featureConfig = {
  // Core features
  authentication: {
    enabled: true,
    methods: ["oauth", "basic"],
    defaultMethod: "oauth",
    rememberMe: true,
    sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
  },

  // Worklog features
  worklogs: {
    enabled: true,
    maxRecordsPerPage: 100,
    defaultPageSize: 25,
    bulkOperations: true,
    timeTracking: true,
    comments: true,
    attachments: false, // Future feature
  },

  // Analytics features
  analytics: {
    enabled: true,
    charts: true,
    exports: true,
    realTimeUpdates: false,
    customReports: false, // Future feature
  },

  // Search and filtering
  search: {
    enabled: true,
    fuzzySearch: true,
    advancedFilters: true,
    savedSearches: false, // Future feature
    globalSearch: true,
  },

  // UI/UX features
  ui: {
    darkMode: true,
    themes: ["light", "dark", "system"],
    defaultTheme: "system",
    animations: true,
    keyboardShortcuts: true,
    accessibility: true,
  },

  // Data management
  dataManagement: {
    caching: true,
    offline: false, // Future feature
    syncOnReconnect: false, // Future feature
    localBackup: false, // Future feature
  },

  // Export features
  export: {
    enabled: true,
    formats: ["csv", "excel", "pdf"],
    maxRecords: 10000,
    scheduling: false, // Future feature
  },

  // Notification features
  notifications: {
    enabled: true,
    types: ["success", "error", "warning", "info"],
    persistence: false,
    sound: false,
  },
} as const;

// ============================================================================
// Performance Configuration
// ============================================================================

export const performanceConfig = {
  // Caching
  cache: {
    enabled: true,
    ttl: {
      projects: 5 * 60 * 1000, // 5 minutes
      userInfo: 10 * 60 * 1000, // 10 minutes
      issueTypes: 30 * 60 * 1000, // 30 minutes
      worklogs: 2 * 60 * 1000, // 2 minutes
    },
    maxSize: 100, // Maximum number of cached items
  },

  // Pagination
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    prefetchPages: 1,
  },

  // Virtual scrolling
  virtualScroll: {
    enabled: true,
    itemHeight: 60,
    bufferSize: 10,
    threshold: 100,
  },

  // Debouncing
  debounce: {
    search: 300,
    filter: 200,
    resize: 100,
  },

  // Lazy loading
  lazyLoading: {
    enabled: true,
    threshold: 0.1,
    rootMargin: "50px",
  },
} as const;

// ============================================================================
// Security Configuration
// ============================================================================

export const securityConfig = {
  // CORS configuration
  cors: {
    origin: IS_PRODUCTION
      ? ["https://yourdomain.com"]
      : ["http://localhost:3000", "http://127.0.0.1:3000"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  },

  // Content Security Policy
  csp: {
    enabled: IS_PRODUCTION,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: [
        "'self'",
        "https://api.atlassian.com",
        "https://auth.atlassian.com",
      ],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  // Rate limiting
  rateLimit: {
    enabled: IS_PRODUCTION,
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: "Too many requests from this IP, please try again later.",
  },

  // Input validation
  validation: {
    enabled: true,
    sanitizeHtml: true,
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
    ],
  },
} as const;

// ============================================================================
// Logging Configuration
// ============================================================================

export const loggingConfig = {
  level: IS_DEVELOPMENT ? "debug" : "info",

  // Console logging
  console: {
    enabled: true,
    colorize: IS_DEVELOPMENT,
    timestamp: true,
  },

  // File logging (for server-side)
  file: {
    enabled: IS_PRODUCTION,
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    path: "./logs",
  },

  // Remote logging (for production monitoring)
  remote: {
    enabled: false, // Configure based on your monitoring service
    endpoint: "",
    apiKey: "",
  },

  // Error tracking
  errorTracking: {
    enabled: IS_PRODUCTION,
    service: "sentry", // or other error tracking service
    dsn: "", // Configure based on your error tracking service
  },
} as const;

// ============================================================================
// Development Configuration
// ============================================================================

export const developmentConfig = {
  // Development tools
  devTools: {
    enabled: IS_DEVELOPMENT,
    reactQueryDevtools: true,
    zustandDevtools: true,
    reduxDevtools: false,
  },

  // Hot reloading
  hotReload: {
    enabled: IS_DEVELOPMENT,
    overlay: true,
  },

  // Mock data
  mockData: {
    enabled: IS_DEVELOPMENT,
    useLocalStorage: true,
    generateRandomData: false,
  },

  // Debug options
  debug: {
    api: IS_DEVELOPMENT,
    state: IS_DEVELOPMENT,
    rendering: false,
    performance: false,
  },
} as const;

// ============================================================================
// Production Configuration
// ============================================================================

export const productionConfig = {
  // Build optimization
  build: {
    analyze: false,
    sourceMaps: false,
    compression: true,
    minification: true,
  },

  // CDN configuration
  cdn: {
    enabled: false,
    baseUrl: "",
    assets: ["images", "fonts", "static"],
  },

  // Monitoring
  monitoring: {
    enabled: true,
    analytics: false, // Configure based on your analytics service
    performanceTracking: true,
    errorReporting: true,
  },

  // SEO configuration
  seo: {
    enabled: true,
    sitemap: true,
    robots: true,
    ogTags: true,
  },
} as const;

// ============================================================================
// Theme Configuration
// ============================================================================

export const themeConfig = {
  // Available themes
  themes: {
    light: {
      name: "Light",
      primary: "#3B82F6",
      secondary: "#10B981",
      background: "#FFFFFF",
      surface: "#F8FAFC",
      text: "#1F2937",
    },
    dark: {
      name: "Dark",
      primary: "#60A5FA",
      secondary: "#34D399",
      background: "#111827",
      surface: "#1F2937",
      text: "#F9FAFB",
    },
  },

  // Default theme
  defaultTheme: "light",

  // Theme persistence
  persistence: {
    enabled: true,
    key: "theme-preference",
    storage: "localStorage",
  },

  // System theme detection
  systemTheme: {
    enabled: true,
    respectUserPreference: true,
  },
} as const;

// ============================================================================
// Export main configuration object
// ============================================================================

export const config = {
  app: appConfig,
  api: apiConfig,
  features: featureConfig,
  performance: performanceConfig,
  security: securityConfig,
  logging: loggingConfig,
  development: developmentConfig,
  production: productionConfig,
  theme: themeConfig,
} as const;

export default config;
