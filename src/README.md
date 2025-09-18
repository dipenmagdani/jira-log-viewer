# Jira Worklog Viewer - Modern Architecture

A production-ready, scalable Jira worklog management application built with modern web technologies.

## 🏗️ Architecture Overview

This application has been completely refactored to use modern development practices and a scalable architecture.

### Tech Stack

- **Framework**: Next.js 15.5.3 with App Router
- **Language**: TypeScript with strict type checking
- **State Management**: Zustand for global state
- **Data Fetching**: TanStack React Query (v5)
- **HTTP Client**: Axios with interceptors
- **Styling**: Tailwind CSS
- **Authentication**: Manual OAuth + Basic Auth with Atlassian
- **Package Manager**: Bun (with fallback support for npm/pnpm)

### Project Structure

```
src/
├── components/          # React components (to be implemented)
├── hooks/              # Custom React hooks (to be implemented)
├── services/           # API services with React Query
├── stores/             # Zustand state management
├── types/              # TypeScript definitions
├── constants/          # Application constants
├── config/             # Configuration files
├── lib/                # Library configurations (axios, queryClient)
└── utils/              # Utility functions (to be implemented)
```

## 🚀 Key Features

### Authentication System

- **OAuth 2.0**: Atlassian OAuth with PKCE flow
- **Basic Auth**: Traditional API token authentication
- **Token Management**: Automatic refresh and expiry handling
- **Session Persistence**: Secure localStorage with validation

### State Management

- **Zustand Stores**: Lightweight, TypeScript-first state management
  - `AuthStore`: Authentication state and user data
  - `WorklogStore`: Worklog data with filtering, pagination, and sorting
  - `ProjectsStore`: Project data with intelligent caching
- **Devtools Integration**: Debug state changes in development
- **Persistence**: Automatic state hydration with validation

### Data Fetching

- **React Query**: Server state management with caching
- **Optimistic Updates**: Immediate UI feedback for mutations
- **Background Refetching**: Keep data fresh automatically
- **Error Recovery**: Intelligent retry logic with exponential backoff
- **Infinite Queries**: Smooth pagination for large datasets

### API Layer

- **Axios Interceptors**: Automatic authentication and error handling
- **Request/Response Transformation**: Consistent data formatting
- **Error Boundaries**: Graceful error handling throughout the app
- **Type Safety**: Full TypeScript integration for all API calls

## 📁 Core Services

### Authentication Service (`src/services/authService.ts`)

```typescript
// OAuth login
const { mutate: loginWithOAuth } = useOAuthLogin();

// Session management
const { data: session } = useSession();

// Token refresh
const { mutate: refreshTokens } = useRefreshTokens();
```

### Worklog Service (`src/services/worklogService.ts`)

```typescript
// Fetch worklogs with filtering
const { data: worklogs } = useWorklogs({
  startDate: "2024-01-01",
  projectKeys: ["PROJ"],
});

// Create worklog with optimistic update
const { mutate: createWorklog } = useCreateWorklog();

// Analytics
const { data: analytics } = useWorklogAnalytics();
```

### Projects Service (`src/services/projectsService.ts`)

```typescript
// Fetch all projects
const { data: projects } = useProjects();

// Search projects
const { data: searchResults } = useSearchProjects(query);

// Get project details
const { data: project } = useProject(projectKey);
```

## 🎯 State Management

### Zustand Stores

```typescript
// Auth store usage
import { useAuth } from "@/stores";

const { isAuthenticated, user, login, logout } = useAuth();

// Worklog store usage
import { useWorklogState } from "@/stores";

const { worklogs, filters, setFilters, isLoading } = useWorklogState();
```

### Store Features

- **Type Safety**: Full TypeScript support
- **Devtools**: Debug state changes in development
- **Persistence**: Automatic localStorage sync with validation
- **Selectors**: Optimized component re-renders
- **Actions**: Clean separation of concerns

## 🔧 Configuration

### Environment Variables

```env
NEXT_PUBLIC_ATLASSIAN_CLIENT_ID=your_client_id
ATLASSIAN_CLIENT_SECRET=your_client_secret
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_secret
```

### Feature Flags (`src/config/index.ts`)

```typescript
export const featureConfig = {
  analytics: { enabled: true },
  export: { enabled: true },
  darkMode: { enabled: true },
  // ... more features
};
```

## 🎨 Type System

### Comprehensive TypeScript Definitions

- **Authentication Types**: `AuthData`, `User`, `AtlassianResource`
- **Jira Types**: `JiraProject`, `JiraIssue`, `JiraWorklog`
- **API Types**: `ApiResponse<T>`, request/response interfaces
- **Store Types**: `WorklogFilter`, `PaginationInfo`, `SortConfig`
- **UI Types**: Component props and state interfaces

## 🚦 Error Handling

### Global Error Management

- **Query Error Boundaries**: Automatic error recovery
- **Authentication Errors**: Automatic logout and redirect
- **Network Errors**: Retry logic with exponential backoff
- **Validation Errors**: User-friendly error messages

### Error Types

```typescript
// Network errors
if (isNetworkError(error)) {
  // Handle network issues
}

// Authentication errors
if (isAuthError(error)) {
  // Redirect to login
}

// Server errors
if (isServerError(error)) {
  // Show server error message
}
```

## 🔄 Caching Strategy

### Intelligent Cache Management

- **Stale-While-Revalidate**: Fresh data with background updates
- **Cache Invalidation**: Smart invalidation on mutations
- **Prefetching**: Anticipate user needs
- **Offline Support**: Serve cached data when offline (planned)

### Cache Configuration

```typescript
const cacheConfig = {
  projects: 5 * 60 * 1000, // 5 minutes
  worklogs: 2 * 60 * 1000, // 2 minutes
  userInfo: 10 * 60 * 1000, // 10 minutes
  issueTypes: 30 * 60 * 1000, // 30 minutes
};
```

## 🧪 Development

### Getting Started

```bash
# Install dependencies
bun install

# Start development server
bun dev

# Type checking
bun run type-check

# Linting
bun run lint
```

### Development Tools

- **React Query Devtools**: Inspect queries and mutations
- **Zustand Devtools**: Debug state changes
- **TypeScript**: Strict type checking
- **ESLint + Prettier**: Code formatting and linting

## 🏗️ Next Steps

### Immediate Implementation Needed:

1. **Component Layer**: React components using the stores and services
2. **Custom Hooks**: Reusable hooks for common patterns
3. **UI Components**: Actual user interface implementation
4. **Routing**: Next.js App Router with authentication guards
5. **Testing**: Comprehensive test suite

### Future Enhancements:

- **Offline Support**: PWA with service workers
- **Real-time Updates**: WebSocket integration
- **Advanced Analytics**: Custom reporting dashboard
- **Bulk Operations**: Multi-worklog management
- **Mobile App**: React Native version

## 📚 Documentation

### API Documentation

- All services are fully documented with JSDoc
- TypeScript provides inline documentation
- Examples provided for common use cases

### Code Examples

Check the service files for comprehensive examples of:

- Query hooks usage
- Mutation handling
- Optimistic updates
- Error recovery
- Caching strategies

---

This architecture provides a solid foundation for a production-ready, scalable application with excellent developer experience and modern best practices.
