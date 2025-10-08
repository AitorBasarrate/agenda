// High-level API services with additional convenience methods

import { apiClient, ApiError } from './client';
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
  PaginatedResponse,
  DashboardData,
  DashboardStats,
  UpcomingItems,
  CalendarViewData,
  DateRangeData,
} from '../types/api';

// Task Service
export class TaskService {
  // Get all tasks with optional filtering
  static async getAllTasks(filters?: Omit<TaskListQuery, 'page' | 'page_size'>): Promise<Task[]> {
    try {
      const allTasks: Task[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await apiClient.listTasks({
          ...filters,
          page,
          page_size: 100, // Get larger chunks
        });

        allTasks.push(...response.data);
        hasMore = page < response.total_pages;
        page++;
      }

      return allTasks;
    } catch (error) {
      console.error('Failed to fetch all tasks:', error);
      throw error;
    }
  }

  // Get tasks with pagination
  static async getTasks(query?: TaskListQuery): Promise<PaginatedResponse<Task>> {
    try {
      return await apiClient.listTasks(query);
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      throw error;
    }
  }

  // Create a new task
  static async createTask(data: CreateTaskRequest): Promise<Task> {
    try {
      return await apiClient.createTask(data);
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  }

  // Get a specific task
  static async getTask(id: number): Promise<Task> {
    try {
      return await apiClient.getTask(id);
    } catch (error) {
      console.error(`Failed to fetch task ${id}:`, error);
      throw error;
    }
  }

  // Update a task
  static async updateTask(id: number, data: UpdateTaskRequest): Promise<Task> {
    try {
      return await apiClient.updateTask(id, data);
    } catch (error) {
      console.error(`Failed to update task ${id}:`, error);
      throw error;
    }
  }

  // Delete a task
  static async deleteTask(id: number): Promise<void> {
    try {
      await apiClient.deleteTask(id);
    } catch (error) {
      console.error(`Failed to delete task ${id}:`, error);
      throw error;
    }
  }

  // Toggle task completion status
  static async toggleTaskStatus(task: Task): Promise<Task> {
    try {
      if (task.status === 'completed') {
        return await apiClient.reopenTask(task.id);
      } else {
        return await apiClient.completeTask(task.id);
      }
    } catch (error) {
      console.error(`Failed to toggle task ${task.id} status:`, error);
      throw error;
    }
  }

  // Get overdue tasks
  static async getOverdueTasks(): Promise<Task[]> {
    try {
      const now = new Date().toISOString();
      const response = await apiClient.listTasks({
        status: 'pending',
        due_before: now,
        page_size: 100,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch overdue tasks:', error);
      throw error;
    }
  }

  // Get tasks due today
  static async getTasksDueToday(): Promise<Task[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1).toISOString();

      const response = await apiClient.listTasks({
        status: 'pending',
        due_after: startOfDay,
        due_before: endOfDay,
        page_size: 100,
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch tasks due today:', error);
      throw error;
    }
  }
}

// Event Service
export class EventService {
  // Get all events with optional filtering
  static async getAllEvents(filters?: Omit<EventListQuery, 'page' | 'page_size'>): Promise<Event[]> {
    try {
      const allEvents: Event[] = [];
      let page = 1;
      let hasMore = true;

      while (hasMore) {
        const response = await apiClient.listEvents({
          ...filters,
          page,
          page_size: 100,
        });

        allEvents.push(...response.data);
        hasMore = page < response.total_pages;
        page++;
      }

      return allEvents;
    } catch (error) {
      console.error('Failed to fetch all events:', error);
      throw error;
    }
  }

  // Get events with pagination
  static async getEvents(query?: EventListQuery): Promise<PaginatedResponse<Event>> {
    try {
      return await apiClient.listEvents(query);
    } catch (error) {
      console.error('Failed to fetch events:', error);
      throw error;
    }
  }

  // Create a new event
  static async createEvent(data: CreateEventRequest): Promise<Event> {
    try {
      return await apiClient.createEvent(data);
    } catch (error) {
      console.error('Failed to create event:', error);
      throw error;
    }
  }

  // Get a specific event
  static async getEvent(id: number): Promise<Event> {
    try {
      return await apiClient.getEvent(id);
    } catch (error) {
      console.error(`Failed to fetch event ${id}:`, error);
      throw error;
    }
  }

  // Update an event
  static async updateEvent(id: number, data: UpdateEventRequest): Promise<Event> {
    try {
      return await apiClient.updateEvent(id, data);
    } catch (error) {
      console.error(`Failed to update event ${id}:`, error);
      throw error;
    }
  }

  // Delete an event
  static async deleteEvent(id: number): Promise<void> {
    try {
      await apiClient.deleteEvent(id);
    } catch (error) {
      console.error(`Failed to delete event ${id}:`, error);
      throw error;
    }
  }

  // Get events for a specific month
  static async getEventsForMonth(year: number, month: number): Promise<Event[]> {
    try {
      const response = await apiClient.getEventsByMonth(year, month);
      return response.events;
    } catch (error) {
      console.error(`Failed to fetch events for ${year}-${month}:`, error);
      throw error;
    }
  }

  // Get events for a specific day
  static async getEventsForDay(date: string): Promise<Event[]> {
    try {
      const response = await apiClient.getEventsByDay(date);
      return response.events;
    } catch (error) {
      console.error(`Failed to fetch events for ${date}:`, error);
      throw error;
    }
  }

  // Get upcoming events
  static async getUpcomingEvents(limit: number = 10): Promise<Event[]> {
    try {
      const response = await apiClient.getUpcomingEvents(limit);
      return response.events;
    } catch (error) {
      console.error('Failed to fetch upcoming events:', error);
      throw error;
    }
  }

  // Get events happening today
  static async getEventsToday(): Promise<Event[]> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      return await this.getEventsForDay(today);
    } catch (error) {
      console.error('Failed to fetch events for today:', error);
      throw error;
    }
  }
}

// Dashboard Service
export class DashboardService {
  // Get dashboard data
  static async getDashboardData(query?: DashboardQuery): Promise<DashboardData> {
    try {
      return await apiClient.getDashboard(query);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      throw error;
    }
  }

  // Get dashboard statistics
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await apiClient.getDashboardStats();
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      throw error;
    }
  }

  // Get upcoming items (tasks and events)
  static async getUpcomingItems(days: number = 7, limit: number = 20): Promise<UpcomingItems> {
    try {
      return await apiClient.getUpcomingItems({ days, limit });
    } catch (error) {
      console.error('Failed to fetch upcoming items:', error);
      throw error;
    }
  }

  // Get calendar view for a specific month
  static async getCalendarView(year: number, month: number): Promise<CalendarViewData> {
    try {
      return await apiClient.getCalendarView({ year, month });
    } catch (error) {
      console.error(`Failed to fetch calendar view for ${year}-${month}:`, error);
      throw error;
    }
  }

  // Get items for a date range
  static async getDateRangeData(startDate: string, endDate: string): Promise<DateRangeData> {
    try {
      return await apiClient.getDateRange({ start_date: startDate, end_date: endDate });
    } catch (error) {
      console.error(`Failed to fetch date range data from ${startDate} to ${endDate}:`, error);
      throw error;
    }
  }

  // Get current week's data
  static async getCurrentWeekData(): Promise<DateRangeData> {
    try {
      const now = new Date();
      const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      const endOfWeek = new Date(now.setDate(startOfWeek.getDate() + 6));

      return await this.getDateRangeData(
        startOfWeek.toISOString(),
        endOfWeek.toISOString()
      );
    } catch (error) {
      console.error('Failed to fetch current week data:', error);
      throw error;
    }
  }

  // Get current month's data
  static async getCurrentMonthData(): Promise<CalendarViewData> {
    try {
      const now = new Date();
      return await this.getCalendarView(now.getFullYear(), now.getMonth() + 1);
    } catch (error) {
      console.error('Failed to fetch current month data:', error);
      throw error;
    }
  }
}

// Utility functions for error handling
export class ApiErrorHandler {
  // Check if error is an API error
  static isApiError(error: any): error is ApiError {
    return error instanceof ApiError;
  }

  // Get user-friendly error message
  static getUserFriendlyMessage(error: any): string {
    if (this.isApiError(error)) {
      switch (error.code) {
        case 'NETWORK_ERROR':
          return 'Unable to connect to the server. Please check your internet connection.';
        case 'VALIDATION_ERROR':
          return 'Please check your input and try again.';
        case 'TASK_NOT_FOUND':
          return 'The requested task could not be found.';
        case 'EVENT_NOT_FOUND':
          return 'The requested event could not be found.';
        case 'TIME_CONFLICT':
          return 'This event conflicts with an existing event.';
        case 'TASK_ALREADY_COMPLETED':
          return 'This task is already completed.';
        case 'TASK_ALREADY_PENDING':
          return 'This task is already pending.';
        default:
          return error.message || 'An unexpected error occurred.';
      }
    }
    
    return 'An unexpected error occurred. Please try again.';
  }

  // Check if error is retryable
  static isRetryable(error: any): boolean {
    if (this.isApiError(error)) {
      return error.code === 'NETWORK_ERROR' || error.status >= 500;
    }
    return false;
  }
}

// Export all services
export { apiClient, ApiError };