import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CalendarView } from '../CalendarView';
import { EventForm } from '../EventForm';
import { EventDetails } from '../EventDetails';
import { EventProvider } from '../../contexts/EventContext';
import type { Event } from '../../types/api';

// Mock the API client completely
vi.mock('../../api/client', () => ({
  apiClient: {
    getEventsByMonth: vi.fn().mockResolvedValue({ events: [], year: 2024, month: 1, total: 0 }),
    createEvent: vi.fn().mockResolvedValue({ id: 1, title: 'Test', description: '', start_time: '2024-01-01T10:00:00Z', end_time: '2024-01-01T11:00:00Z', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }),
    updateEvent: vi.fn().mockResolvedValue({ id: 1, title: 'Test', description: '', start_time: '2024-01-01T10:00:00Z', end_time: '2024-01-01T11:00:00Z', created_at: '2024-01-01T00:00:00Z', updated_at: '2024-01-01T00:00:00Z' }),
    deleteEvent: vi.fn().mockResolvedValue(undefined),
  },
  ApiError: class ApiError extends Error {
    constructor(public status: number, public code: string, message: string) {
      super(message);
    }
  },
}));

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <EventProvider>{children}</EventProvider>;
}

// Mock event data
const mockEvent: Event = {
  id: 1,
  title: 'Test Event',
  description: 'Test description',
  start_time: '2024-01-15T10:00:00Z',
  end_time: '2024-01-15T11:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('Calendar Components Integration', () => {
  it('renders CalendarView component', () => {
    render(
      <TestWrapper>
        <CalendarView />
      </TestWrapper>
    );

    // Should render calendar structure
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
    expect(screen.getByText('Tue')).toBeInTheDocument();
  });

  it('renders EventForm component for creating events', () => {
    render(
      <TestWrapper>
        <EventForm />
      </TestWrapper>
    );

    expect(screen.getByText('Create New Event')).toBeInTheDocument();
    expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/start time/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/end time/i)).toBeInTheDocument();
  });

  it('renders EventForm component for editing events', () => {
    render(
      <TestWrapper>
        <EventForm event={mockEvent} />
      </TestWrapper>
    );

    expect(screen.getByText('Edit Event')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();
  });

  it('renders EventDetails component', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} />
      </TestWrapper>
    );

    expect(screen.getByText('Test Event')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText(/Date & Time/)).toBeInTheDocument();
  });

  it('EventDetails shows edit and delete buttons when handlers provided', () => {
    const onEdit = vi.fn();
    const onClose = vi.fn();

    render(
      <TestWrapper>
        <EventDetails event={mockEvent} onEdit={onEdit} onClose={onClose} />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/close event details/i)).toBeInTheDocument();
  });

  it('components accept custom className prop', () => {
    const { container: calendarContainer } = render(
      <TestWrapper>
        <CalendarView className="custom-calendar" />
      </TestWrapper>
    );

    const { container: formContainer } = render(
      <TestWrapper>
        <EventForm className="custom-form" />
      </TestWrapper>
    );

    const { container: detailsContainer } = render(
      <TestWrapper>
        <EventDetails event={mockEvent} className="custom-details" />
      </TestWrapper>
    );

    expect(calendarContainer.firstChild).toHaveClass('custom-calendar');
    expect(formContainer.firstChild).toHaveClass('custom-form');
    expect(detailsContainer.firstChild).toHaveClass('custom-details');
  });
});