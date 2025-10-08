// API module exports

// Export the main API client and error class
export { apiClient, ApiClient, ApiError } from './client';

// Export high-level services
export {
  TaskService,
  EventService,
  DashboardService,
  ApiErrorHandler,
} from './services';

// Export all types
export * from '../types/api';

// Re-export for convenience
export { apiClient as api } from './client';