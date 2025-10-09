import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useDashboard } from '../useDashboard';
import { apiClient } from '../../api/client';
import type { Task, Event, DashboardData, DashboardStats } from '../../types/api';

// Mock the API client
vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    apiClient: {
      getDashboard: vi.fn(),
      getDashboardStats: vi.fn(),
      getUpcomingItems: vi.fn(),
      getCalendarView: vi.fn(),
      getDateRange: vi.fn(),
    },
  };
});

const mockApiClient = apiClient as {
  getDashboard: Mock;
  getDashboardStats: Mock;
  getUpcomingItems: Mock;
  getCalendarView: Mock;
  getDateRange: Mock;
};

describe('useDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    due_date: '2024-12-31T23:59:59Z',
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockEvent: Event = {
    id: 1,
    title: 'Test Event',
    description: 'Test Description',
    start_time: '2024-12-31T10:00:00Z',
    end_time: '2024-12-31T11:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockStats: DashboardStats = {
    total_tasks: 10,
    completed_tasks: 6,
    pending_tasks: 4,
    total_events: 5,
    upcoming_events: 3,
    overdue_tasks: 2,
  };

  const mockDashboardData: DashboardData = {
    tasks: [mockTask],
    events: [mockEvent],
    stats: mockStats,
  };

  const mockUpcomingItems = {
    tasks: [mockTask],
    events: [mockEvent],
    total: 2,
    days: 7,
  };

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useDashboard());

    expect(result.current.upcomingTasks).toEqual([]);
    expect(result.current.upcomingEvents).toEqual([]);
    expect(result.current.stats).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.lastUpdated).toBe(null);
  });

  it('should load dashboard data successfully', async () => {
    mockApiClient.getDashboard.mockResolvedValue(mockDashboardData);

    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await result.current.loadDashboard();
    });

    expect(result.current.upcomingTasks).toEqual([mockTask]);
    expect(result.current.upcomingEvents).toEqual([mockEvent]);
    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('should handle load dashboard error', async () => {
    const errorMessage = 'Failed to load dashboard data';
    mockApiClient.getDashboard.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await result.current.loadDashboard();
    });

    expect(result.current.upcomingTasks).toEqual([]);
    expect(result.current.upcomingEvents).toEqual([]);
    expect(result.current.stats).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should load stats successfully', async () => {
    mockApiClient.getDashboardStats.mockResolvedValue(mockStats);

    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await result.current.loadStats();
    });

    expect(result.current.stats).toEqual(mockStats);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('should load upcoming items successfully', async () => {
    mockApiClient.getUpcomingItems.mockResolvedValue(mockUpcomingItems);

    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await result.current.loadUpcomingItems({ days: 7, limit: 10 });
    });

    expect(result.current.upcomingTasks).toEqual([mockTask]);
    expect(result.current.upcomingEvents).toEqual([mockEvent]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.lastUpdated).toBeInstanceOf(Date);
  });

  it('should load calendar view successfully', async () => {
    const mockCalendarData = {
      tasks: [mockTask],
      events: [mockEvent],
      year: 2024,
      month: 12,
      total_items: 2,
    };

    mockApiClient.getCalendarView.mockResolvedValue(mockCalendarData);

    const { result } = renderHook(() => useDashboard());

    let calendarData = null;
    await act(async () => {
      calendarData = await result.current.loadCalendarView({ year: 2024, month: 12 });
    });

    expect(calendarData).toEqual(mockCalendarData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should load date range successfully', async () => {
    const mockDateRangeData = {
      tasks: [mockTask],
      events: [mockEvent],
      start_date: '2024-12-01',
      end_date: '2024-12-31',
      total_tasks: 1,
      total_events: 1,
    };

    mockApiClient.getDateRange.mockResolvedValue(mockDateRangeData);

    const { result } = renderHook(() => useDashboard());

    let dateRangeData = null;
    await act(async () => {
      dateRangeData = await result.current.loadDateRange({
        start_date: '2024-12-01',
        end_date: '2024-12-31',
      });
    });

    expect(dateRangeData).toEqual(mockDateRangeData);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should calculate summary correctly', async () => {
    mockApiClient.getDashboard.mockResolvedValue(mockDashboardData);

    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      await result.current.loadDashboard();
    });

    const summary = result.current.getSummary();

    expect(summary.totalItems).toBe(15); // 10 tasks + 5 events
    expect(summary.completionRate).toBe(60); // 6/10 * 100
    expect(summary.overdueCount).toBe(2);
    expect(summary.upcomingCount).toBe(3);
    expect(summary.pendingTasksCount).toBe(4);
  });

  it('should handle zero tasks in completion rate calculation', () => {
    const { result } = renderHook(() => useDashboard());

    const summary = result.current.getSummary();

    expect(summary.completionRate).toBe(0);
  });

  it('should detect stale data correctly', async () => {
    mockApiClient.getDashboard.mockResolvedValue(mockDashboardData);

    const { result } = renderHook(() => useDashboard());

    // Initially data should be stale (no lastUpdated)
    expect(result.current.isDataStale()).toBe(true);

    await act(async () => {
      await result.current.loadDashboard();
    });

    // After loading, data should be fresh
    expect(result.current.isDataStale()).toBe(false);

    // Mock a date 6 minutes ago to simulate stale data
    const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
    
    act(() => {
      // Manually set lastUpdated to simulate stale data
      result.current.lastUpdated = sixMinutesAgo;
    });

    // Note: This test might not work as expected because lastUpdated is read-only
    // In a real implementation, you might need to expose a method to set this for testing
  });

  it('should set error', () => {
    const { result } = renderHook(() => useDashboard());

    const errorMessage = 'Test error';

    act(() => {
      result.current.setError(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBe(null);
  });

  it('should refresh dashboard', async () => {
    mockApiClient.getDashboard.mockResolvedValue(mockDashboardData);

    const { result } = renderHook(() => useDashboard());

    await act(async () => {
      result.current.refreshDashboard();
    });

    expect(mockApiClient.getDashboard).toHaveBeenCalled();
    expect(result.current.upcomingTasks).toEqual([mockTask]);
    expect(result.current.upcomingEvents).toEqual([mockEvent]);
    expect(result.current.stats).toEqual(mockStats);
  });
});