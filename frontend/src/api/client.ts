// API Client with interceptors and error handling

import type {
  Task,
  Event,
  CreateTaskRequest,
  UpdateTaskRequest,
  CreateEventRequest,
  UpdateEventRequest,
  TaskListQuery,
  EventListQuery,
  DashboardQuery,
  CalendarViewQuery,
  DateRangeQuery,
  UpcomingQuery,
  PaginatedResponse,
  ErrorResponse,
  DashboardData,
  DashboardStats,
  UpcomingItems,
  CalendarViewData,
  DateRangeData,
  MonthEventsResponse,
  DayEventsResponse,
  UpcomingEventsResponse,
} from '../types/api';

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const API_PREFIX = '/api';

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  code: string;
  details?: Record<string, any>;

  constructor(
    status: number,
    code: string,
    message: string,
    details?: Record<string, any>
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

// Request configuration interface
interface RequestConfig extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

// Type for query parameters
type QueryParams = Record<string, string | number | boolean | undefined>;

// API Client class
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
  }

  // Build URL with query parameters
  private buildURL(endpoint: string, params?: QueryParams): string {
    const url = new URL(`${this.baseURL}${API_PREFIX}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          url.searchParams.append(key, String(value));
        }
      });
    }
    
    return url.toString();
  }

  // Request interceptor - adds common headers and handles request preparation
  private async prepareRequest(config: RequestConfig): Promise<RequestInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...config.headers,
    };

    return {
      ...config,
      headers,
    };
  }

  // Response interceptor - handles common response processing and errors
  private async handleResponse<T>(response: Response): Promise<T> {
    // Handle non-JSON responses (like 204 No Content)
    if (response.status === 204) {
      return undefined as T;
    }

    let data: any;
    try {
      data = await response.json();
    } catch (error) {
      throw new ApiError(
        response.status,
        'PARSE_ERROR',
        'Failed to parse response as JSON'
      );
    }

    // Handle error responses
    if (!response.ok) {
      const errorResponse = (data as Partial<ErrorResponse> | undefined)?.error;
      throw new ApiError(
        response.status,
        errorResponse?.code ?? 'UNKNOWN_ERROR',
        errorResponse?.message ?? response.statusText ?? 'Request failed',
        errorResponse?.details
      );
    }

    return data;
  }

  // Generic request method
  private async request<T>(endpoint: string, config: RequestConfig = {}): Promise<T> {
    const { params, ...requestConfig } = config;
    const url = this.buildURL(endpoint, params);
    const preparedConfig = await this.prepareRequest(requestConfig);

    try {
      const response = await fetch(url, preparedConfig);
      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Handle network errors
      throw new ApiError(
        0,
        'NETWORK_ERROR',
        'Network request failed. Please check your connection.'
      );
    }
  }

  // HTTP method helpers
  async get<T>(endpoint: string, params?: QueryParams): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET', params });
  }

  async post<T>(endpoint: string, data?: any, params?: QueryParams): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      params,
    });
  }

  async put<T>(endpoint: string, data?: any, params?: QueryParams): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      params,
    });
  }

  async delete<T>(endpoint: string, params?: QueryParams): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE', params });
  }

  // Task API methods
  async createTask(data: CreateTaskRequest): Promise<Task> {
    return this.post<Task>('/tasks', data);
  }

  async getTask(id: number): Promise<Task> {
    return this.get<Task>(`/tasks/${id}`);
  }

  async updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
    return this.put<Task>(`/tasks/${id}`, data);
  }

  async deleteTask(id: number): Promise<void> {
    return this.delete<void>(`/tasks/${id}`);
  }

  async listTasks(query?: TaskListQuery): Promise<PaginatedResponse<Task>> {
    return this.get<PaginatedResponse<Task>>('/tasks', query as QueryParams);
  }

  async completeTask(id: number): Promise<Task> {
    return this.post<Task>(`/tasks/${id}/complete`);
  }

  async reopenTask(id: number): Promise<Task> {
    return this.post<Task>(`/tasks/${id}/reopen`);
  }

  // Event API methods
  async createEvent(data: CreateEventRequest): Promise<Event> {
    return this.post<Event>('/events', data);
  }

  async getEvent(id: number): Promise<Event> {
    return this.get<Event>(`/events/${id}`);
  }

  async updateEvent(id: number, data: UpdateEventRequest): Promise<Event> {
    return this.put<Event>(`/events/${id}`, data);
  }

  async deleteEvent(id: number): Promise<void> {
    return this.delete<void>(`/events/${id}`);
  }

  async listEvents(query?: EventListQuery): Promise<PaginatedResponse<Event>> {
    return this.get<PaginatedResponse<Event>>('/events', query as QueryParams);
  }

  async getEventsByMonth(year: number, month: number): Promise<MonthEventsResponse> {
    return this.get<MonthEventsResponse>('/events', { year, month });
  }

  async getEventsByDay(day: string): Promise<DayEventsResponse> {
    return this.get<DayEventsResponse>('/events', { day });
  }

  async getUpcomingEvents(limit?: number): Promise<UpcomingEventsResponse> {
    return this.get<UpcomingEventsResponse>('/events/upcoming', { limit });
  }

  // Dashboard API methods
  async getDashboard(query?: DashboardQuery): Promise<DashboardData> {
    return this.get<DashboardData>('/dashboard', query as QueryParams);
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.get<DashboardStats>('/dashboard/stats');
  }

  async getUpcomingItems(query?: UpcomingQuery): Promise<UpcomingItems> {
    return this.get<UpcomingItems>('/dashboard/upcoming', query as QueryParams);
  }

  async getCalendarView(query: CalendarViewQuery): Promise<CalendarViewData> {
    return this.get<CalendarViewData>('/dashboard/calendar', query as unknown as QueryParams);
  }

  async getDateRange(query: DateRangeQuery): Promise<DateRangeData> {
    return this.get<DateRangeData>('/dashboard/daterange', query as unknown as QueryParams);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing or custom instances
export { ApiClient };