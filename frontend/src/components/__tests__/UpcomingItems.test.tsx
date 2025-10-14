import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { UpcomingItems } from '../UpcomingItems';
import { DashboardProvider } from '../../contexts/DashboardContext';
import type { Task, Event } from '../../types/api';

// Mock the dashboard hook
const mockUseDashboard = vi.fn();
vi.mock('../../hooks/useDashboard', () => ({
  useDashboard: () => mockUseDashboard(),
}));

const mockTask: Task = {
  id: 1,
  title: 'Test Task',
  description: 'Test task description',
  due_date: '2023-12-25T10:00:00Z',
  status: 'pending',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const mockCompletedTask: Task = {
  ...mockTask,
  id: 2,
  title: 'Completed Task',
  status: 'completed',
};

const mockOverdueTask: Task = {
  ...mockTask,
  id: 3,
  title: 'Overdue Task',
  due_date: '2022-12-01T10:00:00Z', // Past date
};

const mockEvent: Event = {
  id: 1,
  title: 'Test Event',
  description: 'Test event description',
  start_time: '2023-12-25T14:00:00Z',
  end_time: '2023-12-25T15:00:00Z',
  created_at: '2023-01-01T00:00:00Z',
  updated_at: '2023-01-01T00:00:00Z',
};

const defaultMockState = {
  upcomingTasks: [],
  upcomingEvents: [],
  stats: null,
  loading: false,
  error: null,
  lastUpdated: null,
  loadDashboard: vi.fn(),
  loadStats: vi.fn(),
  loadUpcomingItems: vi.fn(),
  loadCalendarView: vi.fn(),
  loadDateRange: vi.fn(),
  refreshDashboard: vi.fn(),
  setError: vi.fn(),
  getSummary: vi.fn(),
  isDataStale: vi.fn(),
};

function renderUpcomingItems(mockState = defaultMockState) {
  mockUseDashboard.mockReturnValue(mockState);
  
  return render(
    <DashboardProvider>
      <UpcomingItems />
    </DashboardProvider>
  );
}

describe('UpcomingItems', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock current date for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-12-20T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders component header correctly', () => {
    renderUpcomingItems();
    
    expect(screen.getByText('Upcoming Items')).toBeInTheDocument();
  });

  it('shows loading state when loading is true', () => {
    renderUpcomingItems({
      ...defaultMockState,
      loading: true,
    });
    
    const spinner = document.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('shows error state when there is an error', () => {
    const errorMessage = 'Failed to load items';
    renderUpcomingItems({
      ...defaultMockState,
      error: errorMessage,
    });
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Try again')).toBeInTheDocument();
  });

  it('calls loadUpcomingItems when try again is clicked', () => {
    const mockLoadUpcomingItems = vi.fn();
    renderUpcomingItems({
      ...defaultMockState,
      error: 'Some error',
      loadUpcomingItems: mockLoadUpcomingItems,
    });
    
    fireEvent.click(screen.getByText('Try again'));
    expect(mockLoadUpcomingItems).toHaveBeenCalledWith({ days: 30, limit: 20 });
  });

  it('shows empty state when no items are available', () => {
    renderUpcomingItems({
      ...defaultMockState,
      upcomingTasks: [],
      upcomingEvents: [],
    });
    
    expect(screen.getByText('No upcoming items')).toBeInTheDocument();
    expect(screen.getByText("You're all caught up! Create a new task or event to get started.")).toBeInTheDocument();
  });

  it('renders task items correctly', () => {
    renderUpcomingItems({
      ...defaultMockState,
      upcomingTasks: [mockTask],
    });
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test task description')).toBeInTheDocument();
    expect(screen.getByText('Due in 5 days')).toBeInTheDocument(); // 25th - 20th = 5 days
  });

  it('renders event items correctly', () => {
    renderUpcomingItems({
      ...defaultMockState,
      upcomingEvents: [mockEvent],
    });
    
    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Test event description')).toBeInTheDocument();
    expect(screen.getByText('In 6 days')).toBeInTheDocument(); // 25th - 20th + 1 = 6 days
    expect(screen.getByText('15:00 - 16:00')).toBeInTheDocument(); // 24-hour format
  });

  it('shows completed status for completed tasks', () => {
    renderUpcomingItems({
      ...defaultMockState,
      upcomingTasks: [mockCompletedTask],
    });
    
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });

  it('shows overdue status for overdue tasks', () => {
    renderUpcomingItems({
      ...defaultMockState,
      upcomingTasks: [mockOverdueTask],
    });
    
    expect(screen.getByText(/days overdue/)).toBeInTheDocument();
  });

  it('displays correct item count', () => {
    renderUpcomingItems({
      ...defaultMockState,
      upcomingTasks: [mockTask, mockCompletedTask],
      upcomingEvents: [mockEvent],
    });
    
    expect(screen.getByText('3 items')).toBeInTheDocument();
  });

  it('displays singular item count correctly', () => {
    renderUpcomingItems({
      ...defaultMockState,
      upcomingTasks: [mockTask],
    });
    
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('sorts items by date correctly', () => {
    const earlierTask: Task = {
      ...mockTask,
      id: 4,
      title: 'Earlier Task',
      due_date: '2023-12-22T10:00:00Z',
    };
    
    const laterTask: Task = {
      ...mockTask,
      id: 5,
      title: 'Later Task',
      due_date: '2023-12-28T10:00:00Z',
    };
    
    renderUpcomingItems({
      ...defaultMockState,
      upcomingTasks: [laterTask, earlierTask], // Intentionally out of order
    });
    
    const taskElements = screen.getAllByText(/Task/);
    expect(taskElements[0]).toHaveTextContent('Earlier Task');
    expect(taskElements[1]).toHaveTextContent('Later Task');
  });

  it('shows load more button when there are 10 or more items', () => {
    const manyTasks = Array.from({ length: 10 }, (_, i) => ({
      ...mockTask,
      id: i + 1,
      title: `Task ${i + 1}`,
    }));
    
    renderUpcomingItems({
      ...defaultMockState,
      upcomingTasks: manyTasks,
    });
    
    expect(screen.getByText('Load more items')).toBeInTheDocument();
  });

  it('calls loadUpcomingItems when load more is clicked', () => {
    const mockLoadUpcomingItems = vi.fn();
    const manyTasks = Array.from({ length: 10 }, (_, i) => ({
      ...mockTask,
      id: i + 1,
      title: `Task ${i + 1}`,
    }));
    
    renderUpcomingItems({
      ...defaultMockState,
      upcomingTasks: manyTasks,
      loadUpcomingItems: mockLoadUpcomingItems,
    });
    
    fireEvent.click(screen.getByText('Load more items'));
    expect(mockLoadUpcomingItems).toHaveBeenCalledWith({ days: 30, limit: 20 });
  });

  it('filters out items without dates', () => {
    const taskWithoutDate: Task = {
      ...mockTask,
      id: 6,
      title: 'Task Without Date',
      due_date: null,
    };
    
    renderUpcomingItems({
      ...defaultMockState,
      upcomingTasks: [mockTask, taskWithoutDate],
    });
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.queryByText('Task Without Date')).not.toBeInTheDocument();
    expect(screen.getByText('1 item')).toBeInTheDocument();
  });

  it('renders proper icons for tasks and events', () => {
    renderUpcomingItems({
      ...defaultMockState,
      upcomingTasks: [mockTask],
      upcomingEvents: [mockEvent],
    });
    
    // Check for task and event icons (SVG elements)
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThanOrEqual(2); // At least one for task, one for event
  });

  it('handles mixed tasks and events correctly', () => {
    renderUpcomingItems({
      ...defaultMockState,
      upcomingTasks: [mockTask],
      upcomingEvents: [mockEvent],
    });
    
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });
});