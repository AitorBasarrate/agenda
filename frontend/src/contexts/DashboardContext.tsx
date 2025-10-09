import { createContext, useContext, type ReactNode } from 'react';
import { useDashboard } from '../hooks/useDashboard';
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

// Context type definition
interface DashboardContextType {
  // State
  upcomingTasks: Task[];
  upcomingEvents: Event[];
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  
  // Actions
  loadDashboard: (query?: DashboardQuery) => Promise<void>;
  loadStats: () => Promise<void>;
  loadUpcomingItems: (query?: UpcomingQuery) => Promise<void>;
  loadCalendarView: (query: CalendarViewQuery) => Promise<CalendarViewData | null>;
  loadDateRange: (query: DateRangeQuery) => Promise<DateRangeData | null>;
  refreshDashboard: () => void;
  setError: (error: string | null) => void;
  
  // Computed values
  getSummary: () => {
    totalItems: number;
    completionRate: number;
    overdueCount: number;
    upcomingCount: number;
    pendingTasksCount: number;
  };
  isDataStale: () => boolean;
}

// Create the context
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// Provider props
interface DashboardProviderProps {
  children: ReactNode;
}

// Provider component
export function DashboardProvider({ children }: DashboardProviderProps) {
  const dashboardHook = useDashboard();

  const contextValue: DashboardContextType = {
    // State
    upcomingTasks: dashboardHook.upcomingTasks,
    upcomingEvents: dashboardHook.upcomingEvents,
    stats: dashboardHook.stats,
    loading: dashboardHook.loading,
    error: dashboardHook.error,
    lastUpdated: dashboardHook.lastUpdated,
    
    // Actions
    loadDashboard: dashboardHook.loadDashboard,
    loadStats: dashboardHook.loadStats,
    loadUpcomingItems: dashboardHook.loadUpcomingItems,
    loadCalendarView: dashboardHook.loadCalendarView,
    loadDateRange: dashboardHook.loadDateRange,
    refreshDashboard: dashboardHook.refreshDashboard,
    setError: dashboardHook.setError,
    
    // Computed values
    getSummary: dashboardHook.getSummary,
    isDataStale: dashboardHook.isDataStale,
  };

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
}

// Custom hook to use the dashboard context
export function useDashboardContext(): DashboardContextType {
  const context = useContext(DashboardContext);
  
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  
  return context;
}

// Export the context for testing purposes
export { DashboardContext };