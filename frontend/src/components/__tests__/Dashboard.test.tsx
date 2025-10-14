import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { Dashboard } from '../Dashboard';
import { DashboardProvider } from '../../contexts/DashboardContext';
import * as dashboardHook from '../../hooks/useDashboard';

// Mock the dashboard hook
const mockUseDashboard = vi.fn();
vi.mock('../../hooks/useDashboard', () => ({
  useDashboard: () => mockUseDashboard(),
}));

// Mock child components
vi.mock('../UpcomingItems', () => ({
  UpcomingItems: () => <div data-testid="upcoming-items">Upcoming Items Component</div>,
}));

vi.mock('../DashboardStats', () => ({
  DashboardStats: () => <div data-testid="dashboard-stats">Dashboard Stats Component</div>,
}));

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
  getSummary: vi.fn(() => ({
    totalItems: 0,
    completionRate: 0,
    overdueCount: 0,
    upcomingCount: 0,
    pendingTasksCount: 0,
  })),
  isDataStale: vi.fn(() => false),
};

function renderDashboard(mockState = defaultMockState) {
  mockUseDashboard.mockReturnValue(mockState);
  
  return render(
    <DashboardProvider>
      <Dashboard />
    </DashboardProvider>
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders dashboard header correctly', () => {
    renderDashboard();
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Overview of your tasks and calendar events')).toBeInTheDocument();
  });

  it('shows loading state when loading is true', () => {
    renderDashboard({
      ...defaultMockState,
      loading: true,
    });
    
    expect(screen.getByText('Loading dashboard...')).toBeInTheDocument();
    expect(screen.getByText('Loading dashboard...').previousElementSibling).toHaveClass('animate-spin');
  });

  it('shows error state when there is an error', () => {
    const errorMessage = 'Failed to load dashboard data';
    renderDashboard({
      ...defaultMockState,
      error: errorMessage,
    });
    
    expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('calls refreshDashboard when refresh button is clicked in error state', () => {
    const mockRefreshDashboard = vi.fn();
    renderDashboard({
      ...defaultMockState,
      error: 'Some error',
      refreshDashboard: mockRefreshDashboard,
    });
    
    fireEvent.click(screen.getByText('Try Again'));
    expect(mockRefreshDashboard).toHaveBeenCalledTimes(1);
  });

  it('renders main dashboard content when not loading and no error', () => {
    const lastUpdated = new Date('2023-01-01T12:00:00Z');
    renderDashboard({
      ...defaultMockState,
      lastUpdated,
    });
    
    expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument();
    expect(screen.getByTestId('upcoming-items')).toBeInTheDocument();
    expect(screen.getByText('Quick Actions')).toBeInTheDocument();
  });

  it('shows last updated time when available', () => {
    const lastUpdated = new Date('2023-01-01T12:00:00Z');
    renderDashboard({
      ...defaultMockState,
      lastUpdated,
    });
    
    expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
  });

  it('calls refreshDashboard when refresh button is clicked', () => {
    const mockRefreshDashboard = vi.fn();
    renderDashboard({
      ...defaultMockState,
      refreshDashboard: mockRefreshDashboard,
    });
    
    fireEvent.click(screen.getByText('Refresh'));
    expect(mockRefreshDashboard).toHaveBeenCalledTimes(1);
  });

  it('renders quick action buttons', () => {
    renderDashboard();
    
    expect(screen.getByText('New Task')).toBeInTheDocument();
    expect(screen.getByText('New Event')).toBeInTheDocument();
    expect(screen.getByText('View Calendar')).toBeInTheDocument();
  });

  it('calls loadDashboard on mount when no data exists', async () => {
    const mockLoadDashboard = vi.fn();
    renderDashboard({
      ...defaultMockState,
      loadDashboard: mockLoadDashboard,
      lastUpdated: null,
    });
    
    await waitFor(() => {
      expect(mockLoadDashboard).toHaveBeenCalledTimes(1);
    });
  });

  it('calls loadDashboard on mount when data is stale', async () => {
    const mockLoadDashboard = vi.fn();
    const mockIsDataStale = vi.fn(() => true);
    renderDashboard({
      ...defaultMockState,
      loadDashboard: mockLoadDashboard,
      isDataStale: mockIsDataStale,
      lastUpdated: new Date(),
    });
    
    await waitFor(() => {
      expect(mockLoadDashboard).toHaveBeenCalledTimes(1);
    });
  });

  it('does not call loadDashboard when data is fresh', () => {
    const mockLoadDashboard = vi.fn();
    const mockIsDataStale = vi.fn(() => false);
    renderDashboard({
      ...defaultMockState,
      loadDashboard: mockLoadDashboard,
      isDataStale: mockIsDataStale,
      lastUpdated: new Date(),
    });
    
    expect(mockLoadDashboard).not.toHaveBeenCalled();
  });

  it('has proper responsive layout classes', () => {
    renderDashboard();
    
    // Check for responsive grid classes
    const mainGrid = screen.getByTestId('dashboard-stats').closest('.grid');
    expect(mainGrid).toHaveClass('grid-cols-1', 'lg:grid-cols-3');
  });

  it('renders with proper accessibility attributes', () => {
    renderDashboard();
    
    // Check for proper heading hierarchy
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3, name: 'Quick Actions' })).toBeInTheDocument();
  });
});