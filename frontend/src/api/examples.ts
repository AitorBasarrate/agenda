// Example usage of the API client utilities

import {
  TaskService,
  EventService,
  DashboardService,
  ApiErrorHandler,
  ApiError,
} from './index';
import type { Task } from './index';

// Example: Task Management
export async function exampleTaskOperations() {
  try {
    // Create a new task
    const newTask = await TaskService.createTask({
      title: 'Complete project documentation',
      description: 'Write comprehensive documentation for the task manager',
      due_date: '2024-01-15T17:00:00Z',
    });
    console.log('Created task:', newTask);

    // Get all pending tasks
    const pendingTasks = await TaskService.getTasks({
      status: 'pending',
      page: 1,
      page_size: 20,
    });
    console.log('Pending tasks:', pendingTasks);

    // Toggle task status
    const updatedTask = await TaskService.toggleTaskStatus(newTask);
    console.log('Updated task:', updatedTask);

    // Get overdue tasks
    const overdueTasks = await TaskService.getOverdueTasks();
    console.log('Overdue tasks:', overdueTasks);

  } catch (error) {
    if (ApiErrorHandler.isApiError(error)) {
      console.error('API Error:', ApiErrorHandler.getUserFriendlyMessage(error));
      
      if (ApiErrorHandler.isRetryable(error)) {
        console.log('This error is retryable');
      }
    } else {
      console.error('Unexpected error:', error);
    }
  }
}

// Example: Event Management
export async function exampleEventOperations() {
  try {
    // Create a new event
    const newEvent = await EventService.createEvent({
      title: 'Team Meeting',
      description: 'Weekly team sync meeting',
      start_time: '2024-01-15T10:00:00Z',
      end_time: '2024-01-15T11:00:00Z',
    });
    console.log('Created event:', newEvent);

    // Get events for current month
    const now = new Date();
    const monthEvents = await EventService.getEventsForMonth(
      now.getFullYear(),
      now.getMonth() + 1
    );
    console.log('This month events:', monthEvents);

    // Get events for today
    const todayEvents = await EventService.getEventsToday();
    console.log('Today events:', todayEvents);

    // Get upcoming events
    const upcomingEvents = await EventService.getUpcomingEvents(5);
    console.log('Upcoming events:', upcomingEvents);

  } catch (error) {
    console.error('Event operation failed:', ApiErrorHandler.getUserFriendlyMessage(error));
  }
}

// Example: Dashboard Operations
export async function exampleDashboardOperations() {
  try {
    // Get dashboard stats
    const stats = await DashboardService.getDashboardStats();
    console.log('Dashboard stats:', stats);

    // Get upcoming items
    const upcomingItems = await DashboardService.getUpcomingItems(7, 10);
    console.log('Upcoming items:', upcomingItems);

    // Get current month calendar view
    const calendarView = await DashboardService.getCurrentMonthData();
    console.log('Calendar view:', calendarView);

    // Get current week data
    const weekData = await DashboardService.getCurrentWeekData();
    console.log('Week data:', weekData);

    // Get dashboard data with filters
    const dashboardData = await DashboardService.getDashboardData({
      include_tasks: 'true',
      include_events: 'true',
      task_status: 'pending',
    });
    console.log('Dashboard data:', dashboardData);

  } catch (error) {
    console.error('Dashboard operation failed:', ApiErrorHandler.getUserFriendlyMessage(error));
  }
}

// Example: Error Handling Patterns
export async function exampleErrorHandling() {
  try {
    // This will likely fail
    await TaskService.getTask(99999);
  } catch (error) {
    if (error instanceof ApiError) {
      console.log('Error details:');
      console.log('- Status:', error.status);
      console.log('- Code:', error.code);
      console.log('- Message:', error.message);
      console.log('- Details:', error.details);
      
      // Handle specific error types
      switch (error.code) {
        case 'TASK_NOT_FOUND':
          console.log('Task does not exist');
          break;
        case 'VALIDATION_ERROR':
          console.log('Input validation failed:', error.details);
          break;
        case 'NETWORK_ERROR':
          console.log('Network connection issue');
          break;
        default:
          console.log('Unknown error occurred');
      }
    }
  }
}

// Example: Batch Operations
export async function exampleBatchOperations() {
  try {
    // Get all data needed for a dashboard in parallel
    const [stats, upcomingItems, todayTasks, todayEvents] = await Promise.all([
      DashboardService.getDashboardStats(),
      DashboardService.getUpcomingItems(7, 10),
      TaskService.getTasksDueToday(),
      EventService.getEventsToday(),
    ]);

    console.log('Dashboard data loaded:', {
      stats,
      upcomingItems,
      todayTasks,
      todayEvents,
    });

  } catch (error) {
    console.error('Batch operation failed:', ApiErrorHandler.getUserFriendlyMessage(error));
  }
}

// Example: Pagination Handling
export async function examplePaginationHandling() {
  try {
    // Get first page of tasks
    let page = 1;
    const pageSize = 10;
    let allTasks: Task[] = [];

    while (true) {
      const response = await TaskService.getTasks({
        page,
        page_size: pageSize,
        status: 'pending',
      });

      allTasks.push(...response.data);
      
      console.log(`Loaded page ${page}/${response.total_pages} (${response.data.length} tasks)`);

      if (page >= response.total_pages) {
        break;
      }
      
      page++;
    }

    console.log(`Total tasks loaded: ${allTasks.length}`);

    // Alternative: Use the convenience method to get all tasks at once
    const allTasksAtOnce = await TaskService.getAllTasks({ status: 'pending' });
    console.log(`All tasks at once: ${allTasksAtOnce.length}`);

  } catch (error) {
    console.error('Pagination handling failed:', ApiErrorHandler.getUserFriendlyMessage(error));
  }
}