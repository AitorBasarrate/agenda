import { useState, useCallback } from 'react';
import { apiClient, ApiError } from '../api/client';
import type { 
  Task, 
  Event, 
  DashboardStats, 
  CalendarViewData,
  DateRangeData,
  DashboardQuery,
  UpcomingQuery,
  CalendarViewQuery,
  DateRangeQuery
} from '../types/api';

export interface DashboardState {
  upcomingTasks: Task[];
  upcomingEvents: Event[];
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const initialStats: DashboardStats = {
  total_tasks: 0,
  completed_tasks: 0,
  pending_tasks: 0,
  total_events: 0,
  upcoming_events: 0,
  overdue_tasks: 0,
};

const initialState: DashboardState = {
  upcomingTasks: [],
  upcomingEvents: [],
  stats: null,
  loading: false,
  error: null,
  lastUpdated: null,
};

export function useDashboard() {
  const [state, setState] = useState<DashboardState>(initialState);

  // Helper to update state
  const updateState = useCallback((updates: Partial<DashboardState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    updateState({ loading });
  }, [updateState]);

  // Set error state
  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  // Load dashboard data
  const loadDashboard = useCallback(async (query?: DashboardQuery) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getDashboard(query);
      
      updateState({
        upcomingTasks: data.tasks,
        upcomingEvents: data.events,
        stats: data.stats,
        loading: false,
        lastUpdated: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to load dashboard data';
      setError(errorMessage);
      setLoading(false);
    }
  }, [setLoading, setError, updateState]);

  // Load dashboard stats only
  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const stats = await apiClient.getDashboardStats();
      
      updateState({
        stats,
        loading: false,
        lastUpdated: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to load dashboard stats';
      setError(errorMessage);
      setLoading(false);
    }
  }, [setLoading, setError, updateState]);

  // Load upcoming items
  const loadUpcomingItems = useCallback(async (query?: UpcomingQuery) => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getUpcomingItems(query);
      
      updateState({
        upcomingTasks: data.tasks,
        upcomingEvents: data.events,
        loading: false,
        lastUpdated: new Date(),
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to load upcoming items';
      setError(errorMessage);
      setLoading(false);
    }
  }, [setLoading, setError, updateState]);

  // Load calendar view data
  const loadCalendarView = useCallback(async (query: CalendarViewQuery): Promise<CalendarViewData | null> => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getCalendarView(query);
      setLoading(false);
      return data;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to load calendar view';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [setLoading, setError]);

  // Load date range data
  const loadDateRange = useCallback(async (query: DateRangeQuery): Promise<DateRangeData | null> => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiClient.getDateRange(query);
      setLoading(false);
      return data;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to load date range data';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [setLoading, setError]);

  // Refresh all dashboard data
  const refreshDashboard = useCallback(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Get summary statistics
  const getSummary = useCallback(() => {
    const stats = state.stats || initialStats;
    
    return {
      totalItems: stats.total_tasks + stats.total_events,
      completionRate: stats.total_tasks > 0 
        ? Math.round((stats.completed_tasks / stats.total_tasks) * 100) 
        : 0,
      overdueCount: stats.overdue_tasks,
      upcomingCount: stats.upcoming_events,
      pendingTasksCount: stats.pending_tasks,
    };
  }, [state.stats]);

  // Check if data is stale (older than 5 minutes)
  const isDataStale = useCallback(() => {
    if (!state.lastUpdated) return true;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return state.lastUpdated < fiveMinutesAgo;
  }, [state.lastUpdated]);

  return {
    // State
    upcomingTasks: state.upcomingTasks,
    upcomingEvents: state.upcomingEvents,
    stats: state.stats,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // Actions
    loadDashboard,
    loadStats,
    loadUpcomingItems,
    loadCalendarView,
    loadDateRange,
    refreshDashboard,
    setError,
    
    // Computed values
    getSummary,
    isDataStale,
  };
}