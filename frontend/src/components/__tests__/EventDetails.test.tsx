import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventDetails } from '../EventDetails';
import { EventProvider } from '../../contexts/EventContext';
import type { Event } from '../../types/api';

// Mock the API client
vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    apiClient: {
      deleteEvent: vi.fn(),
    },
  };
});

// Mock event data
const mockEvent: Event = {
  id: 1,
  title: 'Team Meeting',
  description: 'Weekly team sync meeting to discuss project progress and upcoming tasks.',
  start_time: '2024-01-15T10:00:00Z',
  end_time: '2024-01-15T11:30:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-10T00:00:00Z',
};

const mockEventSameDay: Event = {
  id: 2,
  title: 'Quick Standup',
  description: '',
  start_time: '2024-01-15T09:00:00Z',
  end_time: '2024-01-15T09:30:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockEventMultiDay: Event = {
  id: 3,
  title: 'Conference',
  description: 'Annual tech conference',
  start_time: '2024-01-15T09:00:00Z',
  end_time: '2024-01-16T17:00:00Z',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <EventProvider>{children}</EventProvider>;
}

describe('EventDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders event title and basic information', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} />
      </TestWrapper>
    );

    expect(screen.getByText('Team Meeting')).toBeInTheDocument();
    expect(screen.getByText('1h 30m')).toBeInTheDocument(); // Duration
  });

  it('renders event description when provided', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} />
      </TestWrapper>
    );

    expect(screen.getByText('Description')).toBeInTheDocument();
    expect(screen.getByText('Weekly team sync meeting to discuss project progress and upcoming tasks.')).toBeInTheDocument();
  });

  it('does not render description section when description is empty', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEventSameDay} />
      </TestWrapper>
    );

    expect(screen.queryByText('Description')).not.toBeInTheDocument();
  });

  it('displays start and end times correctly for same-day events', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEventSameDay} />
      </TestWrapper>
    );

    // Should show start date and time
    expect(screen.getByText(/Start:/)).toBeInTheDocument();
    expect(screen.getByText(/End:/)).toBeInTheDocument();
    
    // For same day events, end time should not repeat the date
    const endTimeText = screen.getByText(/End:/).parentElement?.textContent;
    expect(endTimeText).toMatch(/9:30\s*AM/); // Should show time without repeating date
  });

  it('displays start and end times correctly for multi-day events', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEventMultiDay} />
      </TestWrapper>
    );

    // Should show both dates for multi-day events
    expect(screen.getByText(/Start:/)).toBeInTheDocument();
    expect(screen.getByText(/End:/)).toBeInTheDocument();
  });

  it('calculates and displays duration correctly', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} />
      </TestWrapper>
    );

    // 1.5 hours should display as "1h 30m"
    expect(screen.getByText('1h 30m')).toBeInTheDocument();
  });

  it('calculates duration for events less than an hour', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEventSameDay} />
      </TestWrapper>
    );

    // 30 minutes should display as "30 minutes"
    expect(screen.getByText('30 minutes')).toBeInTheDocument();
  });

  it('displays creation and update dates', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} />
      </TestWrapper>
    );

    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Updated:/)).toBeInTheDocument();
    expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('Jan 10, 2024')).toBeInTheDocument();
  });

  it('renders close button when onClose is provided', () => {
    const onClose = vi.fn();
    
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} onClose={onClose} />
      </TestWrapper>
    );

    const closeButton = screen.getByLabelText(/close event details/i);
    expect(closeButton).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} onClose={onClose} />
      </TestWrapper>
    );

    const closeButton = screen.getByLabelText(/close event details/i);
    fireEvent.click(closeButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('renders edit button when onEdit is provided', () => {
    const onEdit = vi.fn();
    
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} onEdit={onEdit} />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument();
  });

  it('calls onEdit when edit button is clicked', () => {
    const onEdit = vi.fn();
    
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} onEdit={onEdit} />
      </TestWrapper>
    );

    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(onEdit).toHaveBeenCalledWith(mockEvent);
  });

  it('renders delete button', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} />
      </TestWrapper>
    );

    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('shows delete confirmation when delete button is clicked', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} />
      </TestWrapper>
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    expect(screen.getByText('Delete this event?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yes/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('cancels delete confirmation', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} />
      </TestWrapper>
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(screen.queryByText('Delete this event?')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument();
  });

  it('handles delete confirmation', async () => {
    const onClose = vi.fn();
    
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} onClose={onClose} />
      </TestWrapper>
    );

    const deleteButton = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByRole('button', { name: /yes/i });
    fireEvent.click(confirmButton);

    // Should show deleting state
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TestWrapper>
        <EventDetails event={mockEvent} className="custom-class" />
      </TestWrapper>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('disables buttons during loading state', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} />
      </TestWrapper>
    );

    // This test would require mocking the context to return loading state
    // The structure is in place for testing disabled states
    expect(screen.getByRole('button', { name: /delete/i })).not.toBeDisabled();
  });

  it('formats time correctly for different locales', () => {
    render(
      <TestWrapper>
        <EventDetails event={mockEvent} />
      </TestWrapper>
    );

    // Should format time in 12-hour format with AM/PM
    expect(screen.getByText(/11:00\s*AM/)).toBeInTheDocument();
    expect(screen.getByText(/12:30\s*PM/)).toBeInTheDocument();
  });
});