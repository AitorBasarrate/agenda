import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { AppProvider, useTaskContext, useEventContext, useDashboardContext } from '../AppContext';

// Mock the API client
vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    apiClient: {
      listTasks: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
      listEvents: vi.fn(),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
      getEventsByMonth: vi.fn(),
      getEventsByDay: vi.fn(),
      getDashboard: vi.fn(),
      getDashboardStats: vi.fn(),
      getUpcomingItems: vi.fn(),
      getCalendarView: vi.fn(),
      getDateRange: vi.fn(),
    },
  };
});

// Test component that uses all contexts
function TestComponent() {
  const taskContext = useTaskContext();
  const eventContext = useEventContext();
  const dashboardContext = useDashboardContext();

  return (
    <div>
      <div data-testid="task-context">{taskContext ? 'task-available' : 'task-unavailable'}</div>
      <div data-testid="event-context">{eventContext ? 'event-available' : 'event-unavailable'}</div>
      <div data-testid="dashboard-context">{dashboardContext ? 'dashboard-available' : 'dashboard-unavailable'}</div>
      <div data-testid="tasks-count">{taskContext.tasks.length}</div>
      <div data-testid="events-count">{eventContext.events.length}</div>
      <div data-testid="upcoming-tasks-count">{dashboardContext.upcomingTasks.length}</div>
    </div>
  );
}

describe('AppContext', () => {
  it('should provide all contexts to children', () => {
    render(
      <AppProvider>
        <TestComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('task-context')).toHaveTextContent('task-available');
    expect(screen.getByTestId('event-context')).toHaveTextContent('event-available');
    expect(screen.getByTestId('dashboard-context')).toHaveTextContent('dashboard-available');
    
    // Check initial states
    expect(screen.getByTestId('tasks-count')).toHaveTextContent('0');
    expect(screen.getByTestId('events-count')).toHaveTextContent('0');
    expect(screen.getByTestId('upcoming-tasks-count')).toHaveTextContent('0');
  });

  it('should throw error when contexts are used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow();

    consoleSpy.mockRestore();
  });

  it('should allow nested providers to work independently', () => {
    function TaskOnlyComponent() {
      const taskContext = useTaskContext();
      return <div data-testid="task-only">{taskContext.tasks.length}</div>;
    }

    // Test that individual providers can be used independently
    render(
      <AppProvider>
        <TaskOnlyComponent />
      </AppProvider>
    );

    expect(screen.getByTestId('task-only')).toHaveTextContent('0');
  });
});