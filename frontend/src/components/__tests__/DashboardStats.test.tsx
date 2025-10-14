import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { DashboardStats } from '../DashboardStats';
import { DashboardProvider } from '../../contexts/DashboardContext';
import type { DashboardStats as DashboardStatsType } from '../../types/api';

// Mock the dashboard hook
const mockUseDashboard = vi.fn();
vi.mock('../../hooks/useDashboard', () => ({
  useDashboard: () => mockUseDashboard(),
}));

const mockStats: DashboardStatsType = {
  total_tasks: 10,
  completed_tasks: 6,
  pending_tasks: 4,
  total_events: 8,
  upcoming_events: 5,
  overdue_tasks: 2,
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
  getSummary: vi.fn(() => ({
    totalItems: 18,
    completionRate: 60,
    overdueCount: 2,
    upcomingCount: 5,
    pendingTasksCount: 4,
  })),
  isDataStale: vi.fn(),
};

function renderDashboardStats(mockState = defaultMockState) {
  mockUseDashboard.mockReturnValue(mockState);
  
  return render(
    <DashboardProvider>
      <DashboardStats />
    </DashboardProvider>
  );
}

describe('DashboardStats', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders overview heading', () => {
    renderDashboardStats();
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
  });

  it('shows loading skeleton when loading is true', () => {
    renderDashboardStats({
      ...defaultMockState,
      loading: true,
    });
    
    // Check for loading skeleton elements
    const skeletons = screen.getAllByRole('generic');
    const loadingElements = skeletons.filter(el => el.classList.contains('animate-pulse'));
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  it('renders main stats cards with correct values', () => {
    renderDashboardStats({
      ...defaultMockState,
      stats: mockStats,
    });
    
    expect(screen.getByText('Total Items')).toBeInTheDocument();
    expect(screen.getByText('18')).toBeInTheDocument();
    expect(screen.getByText('Tasks and events')).toBeInTheDocument();
    
    expect(screen.getByText('Completion Rate')).toBeInTheDocument();
    const completionRateCard = screen.getByText('Completion Rate').closest('.bg-white');
    expect(completionRateCard).toHaveTextContent('60%');
    expect(screen.getByText('Tasks completed')).toBeInTheDocument();
    
    expect(screen.getByText('Pending Tasks')).toBeInTheDocument();
    const pendingTasksCard = screen.getByText('Pending Tasks').closest('.bg-white');
    expect(pendingTasksCard).toHaveTextContent('4');
    expect(screen.getByText('Need attention')).toBeInTheDocument();
    
    expect(screen.getByText('Overdue Tasks')).toBeInTheDocument();
    const overdueTasksCard = screen.getByText('Overdue Tasks').closest('.bg-white');
    expect(overdueTasksCard).toHaveTextContent('2');
    expect(screen.getByText('Past due date')).toBeInTheDocument();
  });

  it('renders detailed stats when stats are available', () => {
    renderDashboardStats({
      ...defaultMockState,
      stats: mockStats,
    });
    
    // Task Breakdown section
    expect(screen.getByText('Task Breakdown')).toBeInTheDocument();
    const taskBreakdownSection = screen.getByText('Task Breakdown').closest('.bg-white');
    expect(taskBreakdownSection).toHaveTextContent('Total Tasks');
    expect(taskBreakdownSection).toHaveTextContent('10');
    expect(taskBreakdownSection).toHaveTextContent('Completed');
    expect(taskBreakdownSection).toHaveTextContent('6');
    expect(taskBreakdownSection).toHaveTextContent('Pending');
    expect(taskBreakdownSection).toHaveTextContent('4');
    expect(taskBreakdownSection).toHaveTextContent('Overdue');
    expect(taskBreakdownSection).toHaveTextContent('2');
    
    // Events Overview section
    expect(screen.getByText('Events Overview')).toBeInTheDocument();
    const eventsSection = screen.getByText('Events Overview').closest('.bg-white');
    expect(eventsSection).toHaveTextContent('Total Events');
    expect(eventsSection).toHaveTextContent('8');
    expect(eventsSection).toHaveTextContent('Upcoming');
    expect(eventsSection).toHaveTextContent('5');
    
    // Progress section
    expect(screen.getByText('Progress')).toBeInTheDocument();
    expect(screen.getByText('Task Completion')).toBeInTheDocument();
    expect(screen.getByText('6 of 10 tasks completed')).toBeInTheDocument();
  });

  it('does not render detailed stats when stats are null', () => {
    renderDashboardStats({
      ...defaultMockState,
      stats: null,
    });
    
    expect(screen.queryByText('Task Breakdown')).not.toBeInTheDocument();
    expect(screen.queryByText('Events Overview')).not.toBeInTheDocument();
    expect(screen.queryByText('Progress')).not.toBeInTheDocument();
  });

  it('renders progress bar with correct width', () => {
    renderDashboardStats({
      ...defaultMockState,
      stats: mockStats,
    });
    
    const progressBar = document.querySelector('.bg-green-600');
    expect(progressBar).toHaveStyle({ width: '60%' });
  });

  it('handles zero completion rate correctly', () => {
    const zeroCompletionMockState = {
      ...defaultMockState,
      stats: {
        ...mockStats,
        completed_tasks: 0,
      },
      getSummary: vi.fn(() => ({
        totalItems: 18,
        completionRate: 0,
        overdueCount: 2,
        upcomingCount: 5,
        pendingTasksCount: 10,
      })),
    };
    
    renderDashboardStats(zeroCompletionMockState);
    
    // Find the specific 0% in the completion rate card
    const completionRateCard = screen.getByText('Completion Rate').closest('.bg-white');
    expect(completionRateCard).toHaveTextContent('0%');
    const progressBar = document.querySelector('.bg-green-600');
    expect(progressBar).toHaveStyle({ width: '0%' });
  });

  it('handles 100% completion rate correctly', () => {
    const fullCompletionMockState = {
      ...defaultMockState,
      stats: {
        ...mockStats,
        completed_tasks: 10,
        pending_tasks: 0,
      },
      getSummary: vi.fn(() => ({
        totalItems: 18,
        completionRate: 100,
        overdueCount: 0,
        upcomingCount: 5,
        pendingTasksCount: 0,
      })),
    };
    
    renderDashboardStats(fullCompletionMockState);
    
    // Find the specific 100% in the completion rate card
    const completionRateCard = screen.getByText('Completion Rate').closest('.bg-white');
    expect(completionRateCard).toHaveTextContent('100%');
    const progressBar = document.querySelector('.bg-green-600');
    expect(progressBar).toHaveStyle({ width: '100%' });
  });

  it('handles zero tasks correctly', () => {
    const noTasksMockState = {
      ...defaultMockState,
      stats: {
        ...mockStats,
        total_tasks: 0,
        completed_tasks: 0,
        pending_tasks: 0,
        overdue_tasks: 0,
      },
      getSummary: vi.fn(() => ({
        totalItems: 8,
        completionRate: 0,
        overdueCount: 0,
        upcomingCount: 5,
        pendingTasksCount: 0,
      })),
    };
    
    renderDashboardStats(noTasksMockState);
    
    // Find the specific 0% in the completion rate card
    const completionRateCard = screen.getByText('Completion Rate').closest('.bg-white');
    expect(completionRateCard).toHaveTextContent('0%');
    expect(screen.queryByText(/of 0 tasks completed/)).not.toBeInTheDocument();
  });

  it('renders proper color coding for different stat types', () => {
    renderDashboardStats({
      ...defaultMockState,
      stats: mockStats,
    });
    
    // Check for color-coded elements in the detailed breakdown section
    const taskBreakdownSection = screen.getByText('Task Breakdown').closest('.bg-white');
    
    // Find the completed tasks text within the task breakdown
    const completedRow = taskBreakdownSection?.querySelector('.text-green-600');
    expect(completedRow).toHaveTextContent('6');
    
    const pendingRow = taskBreakdownSection?.querySelector('.text-yellow-600');
    expect(pendingRow).toHaveTextContent('4');
    
    const overdueRow = taskBreakdownSection?.querySelector('.text-red-600');
    expect(overdueRow).toHaveTextContent('2');
    
    // Check upcoming events in events section
    const eventsSection = screen.getByText('Events Overview').closest('.bg-white');
    const upcomingRow = eventsSection?.querySelector('.text-blue-600');
    expect(upcomingRow).toHaveTextContent('5');
  });

  it('has proper responsive grid layout', () => {
    renderDashboardStats({
      ...defaultMockState,
      stats: mockStats,
    });
    
    // Check for responsive grid classes on main stats
    const mainStatsGrid = screen.getByText('Total Items').closest('.grid');
    expect(mainStatsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-2', 'lg:grid-cols-4');
    
    // Check for responsive grid classes on detailed stats
    const detailedStatsGrid = screen.getByText('Task Breakdown').closest('.grid');
    expect(detailedStatsGrid).toHaveClass('grid-cols-1', 'md:grid-cols-3');
  });

  it('renders all required icons', () => {
    renderDashboardStats({
      ...defaultMockState,
      stats: mockStats,
    });
    
    // Check that SVG icons are present
    const svgElements = document.querySelectorAll('svg');
    expect(svgElements.length).toBeGreaterThanOrEqual(4); // At least 4 icons for the main stats
  });
});