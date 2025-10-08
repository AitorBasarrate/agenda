// API Type Definitions

// Base types
export interface Task {
  id: number;
  title: string;
  description: string;
  due_date: string | null;
  status: 'pending' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: number;
  title: string;
  description: string;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
}

// Request types
export interface CreateTaskRequest {
  title: string;
  description?: string;
  due_date?: string | null;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  due_date?: string | null;
  status?: 'pending' | 'completed';
}

export interface CreateEventRequest {
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
}

export interface UpdateEventRequest {
  title?: string;
  description?: string;
  start_time?: string;
  end_time?: string;
}

// Query parameters
export interface TaskListQuery {
  status?: string;
  due_after?: string;
  due_before?: string;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface EventListQuery {
  title?: string;
  start_after?: string;
  start_before?: string;
  end_after?: string;
  end_before?: string;
  search?: string;
  year?: number;
  month?: number;
  day?: string;
  page?: number;
  page_size?: number;
}

export interface DashboardQuery {
  start_date?: string;
  end_date?: string;
  include_tasks?: string;
  include_events?: string;
  task_status?: string;
}

export interface CalendarViewQuery {
  year: number;
  month: number;
}

export interface DateRangeQuery {
  start_date: string;
  end_date: string;
  format?: 'items' | 'calendar';
}

export interface UpcomingQuery {
  days?: number;
  limit?: number;
}

// Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ErrorDetail {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ErrorResponse {
  error: ErrorDetail;
}

export interface DashboardData {
  tasks: Task[];
  events: Event[];
  stats: DashboardStats;
  start_date?: string;
  end_date?: string;
}

export interface DashboardStats {
  total_tasks: number;
  completed_tasks: number;
  pending_tasks: number;
  total_events: number;
  upcoming_events: number;
  overdue_tasks: number;
}

export interface UpcomingItems {
  tasks: Task[];
  events: Event[];
  total: number;
  days: number;
}

export interface CalendarViewData {
  tasks: Task[];
  events: Event[];
  year: number;
  month: number;
  total_items: number;
}

export interface CalendarItem {
  id: number;
  title: string;
  description: string;
  date: string;
  type: 'task' | 'event';
  status?: string;
  start_time?: string;
  end_time?: string;
}

export interface DateRangeData {
  tasks: Task[];
  events: Event[];
  start_date: string;
  end_date: string;
  total_tasks: number;
  total_events: number;
}

export interface MonthEventsResponse {
  events: Event[];
  year: number;
  month: number;
  total: number;
}

export interface DayEventsResponse {
  events: Event[];
  date: string;
  total: number;
}

export interface UpcomingEventsResponse {
  events: Event[];
  limit: number;
  total: number;
}