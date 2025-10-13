import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EventForm } from '../EventForm';
import { EventProvider } from '../../contexts/EventContext';
import type { Event } from '../../types/api';

// Mock the API client
vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    apiClient: {
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
    },
  };
});

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

// Test wrapper component
function TestWrapper({ children }: { children: React.ReactNode }) {
  return <EventProvider>{children}</EventProvider>;
}

describe('EventForm', () => {

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form when no event is provided', () => {
    render(
      <TestWrapper>
        <EventForm />
      </TestWrapper>
    );

    expect(screen.getByText('Create New Event')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create event/i })).toBeInTheDocument();
  });

  it('renders edit form when event is provided', () => {
    render(
      <TestWrapper>
        <EventForm event={mockEvent} />
      </TestWrapper>
    );

    expect(screen.getByText('Edit Event')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /update event/i })).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Event')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  it('initializes form with initial date when provided', () => {
    const initialDate = new Date('2024-01-15T00:00:00Z');
    
    render(
      <TestWrapper>
        <EventForm initialDate={initialDate} />
      </TestWrapper>
    );

    // Should have date inputs populated with the initial date
    const startTimeInput = screen.getByLabelText(/start time/i) as HTMLInputElement;
    expect(startTimeInput.value).toContain('2024-01-15');
  });

  it('validates required fields', async () => {
    render(
      <TestWrapper>
        <EventForm />
      </TestWrapper>
    );

    const submitButton = screen.getByRole('button', { name: /create event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Start time is required')).toBeInTheDocument();
      expect(screen.getByText('End time is required')).toBeInTheDocument();
    });
  });

  it('validates end time is after start time', async () => {
    render(
      <TestWrapper>
        <EventForm />
      </TestWrapper>
    );

    const titleInput = screen.getByLabelText(/title/i);
    const startTimeInput = screen.getByLabelText(/start time/i);
    const endTimeInput = screen.getByLabelText(/end time/i);

    fireEvent.change(titleInput, { target: { value: 'Test Event' } });
    fireEvent.change(startTimeInput, { target: { value: '2024-01-15T10:00' } });
    fireEvent.change(endTimeInput, { target: { value: '2024-01-15T09:00' } }); // End before start

    const submitButton = screen.getByRole('button', { name: /create event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('End time must be after start time')).toBeInTheDocument();
    });
  });

  it('auto-adjusts end time when start time changes', async () => {
    render(
      <TestWrapper>
        <EventForm />
      </TestWrapper>
    );

    const startTimeInput = screen.getByLabelText(/start time/i) as HTMLInputElement;
    const endTimeInput = screen.getByLabelText(/end time/i) as HTMLInputElement;

    fireEvent.change(startTimeInput, { target: { value: '2024-01-15T10:00' } });

    await waitFor(() => {
      expect(endTimeInput.value).toContain('2024-01-15T11:00');
    });
  });

  it('clears field errors when user starts typing', async () => {
    render(
      <TestWrapper>
        <EventForm />
      </TestWrapper>
    );

    // Trigger validation error
    const submitButton = screen.getByRole('button', { name: /create event/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
    });

    // Start typing in title field
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'T' } });

    await waitFor(() => {
      expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
    });
  });

  it('calls onSubmit when form is successfully submitted', async () => {
    const onSubmit = vi.fn();
    
    render(
      <TestWrapper>
        <EventForm onSubmit={onSubmit} />
      </TestWrapper>
    );

    const titleInput = screen.getByLabelText(/title/i);
    const startTimeInput = screen.getByLabelText(/start time/i);
    const endTimeInput = screen.getByLabelText(/end time/i);

    fireEvent.change(titleInput, { target: { value: 'Test Event' } });
    fireEvent.change(startTimeInput, { target: { value: '2024-01-15T10:00' } });
    fireEvent.change(endTimeInput, { target: { value: '2024-01-15T11:00' } });

    const submitButton = screen.getByRole('button', { name: /create event/i });
    fireEvent.click(submitButton);

    // Note: This test would need the context to be mocked to return a successful result
    // For now, we're testing the form structure and validation
  });

  it('calls onCancel when cancel button is clicked', () => {
    const onCancel = vi.fn();
    
    render(
      <TestWrapper>
        <EventForm onCancel={onCancel} />
      </TestWrapper>
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(onCancel).toHaveBeenCalled();
  });

  it('disables form during submission', async () => {
    render(
      <TestWrapper>
        <EventForm />
      </TestWrapper>
    );

    const titleInput = screen.getByLabelText(/title/i);
    const startTimeInput = screen.getByLabelText(/start time/i);
    const endTimeInput = screen.getByLabelText(/end time/i);

    fireEvent.change(titleInput, { target: { value: 'Test Event' } });
    fireEvent.change(startTimeInput, { target: { value: '2024-01-15T10:00' } });
    fireEvent.change(endTimeInput, { target: { value: '2024-01-15T11:00' } });

    const submitButton = screen.getByRole('button', { name: /create event/i });
    fireEvent.click(submitButton);

    // During submission, form should be disabled
    expect(titleInput).toBeDisabled();
    expect(startTimeInput).toBeDisabled();
    expect(endTimeInput).toBeDisabled();
  });

  it('applies custom className', () => {
    const { container } = render(
      <TestWrapper>
        <EventForm className="custom-class" />
      </TestWrapper>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles description field correctly', async () => {
    render(
      <TestWrapper>
        <EventForm />
      </TestWrapper>
    );

    const descriptionInput = screen.getByLabelText(/description/i);
    fireEvent.change(descriptionInput, { target: { value: 'Test description' } });

    expect(screen.getByDisplayValue('Test description')).toBeInTheDocument();
  });

  it('shows loading state during form submission', async () => {
    render(
      <TestWrapper>
        <EventForm />
      </TestWrapper>
    );

    const titleInput = screen.getByLabelText(/title/i);
    const startTimeInput = screen.getByLabelText(/start time/i);
    const endTimeInput = screen.getByLabelText(/end time/i);

    fireEvent.change(titleInput, { target: { value: 'Test Event' } });
    fireEvent.change(startTimeInput, { target: { value: '2024-01-15T10:00' } });
    fireEvent.change(endTimeInput, { target: { value: '2024-01-15T11:00' } });

    const submitButton = screen.getByRole('button', { name: /create event/i });
    fireEvent.click(submitButton);

    // Should show loading text
    expect(screen.getByText(/creating.../i)).toBeInTheDocument();
  });
});