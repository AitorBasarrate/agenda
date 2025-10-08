# API Client Documentation

This directory contains the TypeScript API client utilities for the Task and Calendar Manager application.

## Overview

The API client provides a type-safe, error-handled interface to communicate with the Go backend API. It includes:

- **Type definitions** for all API requests and responses
- **HTTP client** with request/response interceptors
- **High-level services** with convenience methods
- **Error handling** utilities
- **Comprehensive testing**

## Files Structure

```
src/api/
├── index.ts           # Main exports
├── client.ts          # Core HTTP client with interceptors
├── services.ts        # High-level service classes
├── examples.ts        # Usage examples
├── README.md          # This documentation
├── __tests__/
│   └── client.test.ts # Unit tests
└── ../types/
    └── api.ts         # TypeScript type definitions
```

## Quick Start

### Basic Usage

```typescript
import { TaskService, EventService, DashboardService } from '../api';

// Create a task
const task = await TaskService.createTask({
  title: 'Complete project',
  description: 'Finish the task manager implementation',
  due_date: '2024-01-15T17:00:00Z'
});

// Get events for current month
const events = await EventService.getEventsForMonth(2024, 1);

// Get dashboard stats
const stats = await DashboardService.getDashboardStats();
```

### Error Handling

```typescript
import { ApiErrorHandler, ApiError } from '../api';

try {
  const task = await TaskService.getTask(123);
} catch (error) {
  if (ApiErrorHandler.isApiError(error)) {
    console.log('Error code:', error.code);
    console.log('User message:', ApiErrorHandler.getUserFriendlyMessage(error));
    
    if (ApiErrorHandler.isRetryable(error)) {
      // Retry the operation
    }
  }
}
```

## API Client Features

### Request/Response Interceptors

The API client automatically handles:

- **Content-Type headers** - Sets `application/json` for all requests
- **Query parameter encoding** - Filters out undefined/null values
- **Response parsing** - Handles JSON parsing and 204 No Content responses
- **Error standardization** - Converts all errors to `ApiError` instances

### Error Types

The client handles several error scenarios:

- **Network errors** - Connection failures, timeouts
- **HTTP errors** - 4xx and 5xx status codes with detailed error messages
- **Parsing errors** - Invalid JSON responses
- **Validation errors** - Request validation failures

### Type Safety

All API methods are fully typed with TypeScript:

```typescript
// Request types
interface CreateTaskRequest {
  title: string;
  description?: string;
  due_date?: string | null;
}

// Response types
interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string | null;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
}

// Paginated responses
interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}
```

## Service Classes

### TaskService

Handles all task-related operations:

```typescript
// CRUD operations
TaskService.createTask(data: CreateTaskRequest): Promise<Task>
TaskService.getTask(id: number): Promise<Task>
TaskService.updateTask(id: number, data: UpdateTaskRequest): Promise<Task>
TaskService.deleteTask(id: number): Promise<void>

// List operations
TaskService.getTasks(query?: TaskListQuery): Promise<PaginatedResponse<Task>>
TaskService.getAllTasks(filters?: TaskListQuery): Promise<Task[]>

// Status operations
TaskService.toggleTaskStatus(task: Task): Promise<Task>

// Convenience methods
TaskService.getOverdueTasks(): Promise<Task[]>
TaskService.getTasksDueToday(): Promise<Task[]>
```

### EventService

Handles all event-related operations:

```typescript
// CRUD operations
EventService.createEvent(data: CreateEventRequest): Promise<Event>
EventService.getEvent(id: number): Promise<Event>
EventService.updateEvent(id: number, data: UpdateEventRequest): Promise<Event>
EventService.deleteEvent(id: number): Promise<void>

// List operations
EventService.getEvents(query?: EventListQuery): Promise<PaginatedResponse<Event>>
EventService.getAllEvents(filters?: EventListQuery): Promise<Event[]>

// Calendar operations
EventService.getEventsForMonth(year: number, month: number): Promise<Event[]>
EventService.getEventsForDay(date: string): Promise<Event[]>
EventService.getUpcomingEvents(limit?: number): Promise<Event[]>
EventService.getEventsToday(): Promise<Event[]>
```

### DashboardService

Handles dashboard and aggregated data operations:

```typescript
// Dashboard data
DashboardService.getDashboardData(query?: DashboardQuery): Promise<DashboardData>
DashboardService.getDashboardStats(): Promise<DashboardStats>
DashboardService.getUpcomingItems(days?: number, limit?: number): Promise<UpcomingItems>

// Calendar views
DashboardService.getCalendarView(year: number, month: number): Promise<CalendarViewData>
DashboardService.getDateRangeData(startDate: string, endDate: string): Promise<DateRangeData>

// Convenience methods
DashboardService.getCurrentWeekData(): Promise<DateRangeData>
DashboardService.getCurrentMonthData(): Promise<CalendarViewData>
```

## Configuration

### Environment Variables

Create a `.env` file in the frontend root:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Custom Configuration

You can create a custom API client instance:

```typescript
import { ApiClient } from '../api';

const customClient = new ApiClient('https://api.example.com');
```

## Testing

The API client includes comprehensive unit tests. Run them with:

```bash
npm run test
```

Tests cover:
- Request/response handling
- Error scenarios
- Query parameter encoding
- All API method endpoints

## Usage in React Components

### With useState and useEffect

```typescript
import React, { useState, useEffect } from 'react';
import { TaskService, ApiErrorHandler, Task } from '../api';

export const TaskList: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await TaskService.getTasks({ status: 'pending' });
      setTasks(response.data);
    } catch (err) {
      setError(ApiErrorHandler.getUserFriendlyMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // Component JSX...
};
```

### Batch Operations

```typescript
// Load multiple data sources in parallel
const [stats, upcomingItems, todayTasks] = await Promise.all([
  DashboardService.getDashboardStats(),
  DashboardService.getUpcomingItems(7, 10),
  TaskService.getTasksDueToday(),
]);
```

### Pagination Handling

```typescript
// Manual pagination
const response = await TaskService.getTasks({
  page: 1,
  page_size: 20,
  status: 'pending'
});

// Get all items (handles pagination automatically)
const allTasks = await TaskService.getAllTasks({ status: 'pending' });
```

## Best Practices

1. **Always handle errors** - Use `ApiErrorHandler` for consistent error handling
2. **Use TypeScript types** - Leverage the provided type definitions
3. **Batch requests** - Use `Promise.all()` for parallel operations
4. **Handle loading states** - Show loading indicators during API calls
5. **Implement retry logic** - Check `ApiErrorHandler.isRetryable()` for retryable errors
6. **Cache when appropriate** - Consider caching frequently accessed data
7. **Use pagination** - Don't load all data at once for large datasets

## Error Codes

Common error codes returned by the API:

- `NETWORK_ERROR` - Connection or network issues
- `VALIDATION_ERROR` - Request validation failed
- `TASK_NOT_FOUND` - Requested task doesn't exist
- `EVENT_NOT_FOUND` - Requested event doesn't exist
- `TIME_CONFLICT` - Event time conflicts with existing events
- `TASK_ALREADY_COMPLETED` - Task is already completed
- `TASK_ALREADY_PENDING` - Task is already pending
- `PARSE_ERROR` - Response parsing failed
- `INTERNAL_ERROR` - Server-side error

## Contributing

When adding new API endpoints:

1. Add type definitions to `types/api.ts`
2. Add client methods to `client.ts`
3. Add service methods to `services.ts`
4. Add tests to `__tests__/client.test.ts`
5. Update this documentation