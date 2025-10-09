import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskCard } from '../TaskCard';
import type { Task } from '../../types/api';

// Mock task data
const mockTask: Task = {
  id: 1,
  title: 'Test Task',
  description: 'This is a test task description',
  due_date: '2024-12-31T23:59:59Z',
  status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockCompletedTask: Task = {
  ...mockTask,
  id: 2,
  status: 'completed',
};

const mockOverdueTask: Task = {
  ...mockTask,
  id: 3,
  due_date: '2023-12-31T23:59:59Z', // Past date
};

describe('TaskCard', () => {
  const mockOnToggleStatus = vi.fn();
  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders task information correctly', () => {
    render(
      <TaskCard
        task={mockTask}
        onToggleStatus={mockOnToggleStatus}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText('This is a test task description')).toBeInTheDocument();
    expect(screen.getByText(/Due: 1\/1\/2025/)).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders completed task with proper styling', () => {
    render(
      <TaskCard
        task={mockCompletedTask}
        onToggleStatus={mockOnToggleStatus}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const title = screen.getByText('Test Task');
    expect(title).toHaveClass('line-through');
    expect(screen.getByText('Completed')).toBeInTheDocument();
    
    // Check if checkbox is checked
    const checkbox = screen.getByRole('button', { name: /mark as pending/i });
    expect(checkbox).toHaveClass('bg-green-500');
  });

  it('shows overdue status for past due dates', () => {
    render(
      <TaskCard
        task={mockOverdueTask}
        onToggleStatus={mockOnToggleStatus}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/\(Overdue\)/)).toBeInTheDocument();
  });

  it('handles task without description', () => {
    const taskWithoutDescription = { ...mockTask, description: '' };
    render(
      <TaskCard
        task={taskWithoutDescription}
        onToggleStatus={mockOnToggleStatus}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.queryByText('This is a test task description')).not.toBeInTheDocument();
  });

  it('handles task without due date', () => {
    const taskWithoutDueDate = { ...mockTask, due_date: null };
    render(
      <TaskCard
        task={taskWithoutDueDate}
        onToggleStatus={mockOnToggleStatus}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
  });

  it('calls onToggleStatus when checkbox is clicked', () => {
    render(
      <TaskCard
        task={mockTask}
        onToggleStatus={mockOnToggleStatus}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const checkbox = screen.getByRole('button', { name: /mark as completed/i });
    fireEvent.click(checkbox);

    expect(mockOnToggleStatus).toHaveBeenCalledWith(1);
  });

  it('calls onEdit when edit button is clicked', () => {
    render(
      <TaskCard
        task={mockTask}
        onToggleStatus={mockOnToggleStatus}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const editButton = screen.getByRole('button', { name: /edit task/i });
    fireEvent.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(mockTask);
  });

  it('calls onDelete when delete button is clicked and confirmed', async () => {
    // Mock window.confirm
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => true);

    render(
      <TaskCard
        task={mockTask}
        onToggleStatus={mockOnToggleStatus}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete task/i });
    fireEvent.click(deleteButton);

    await waitFor(() => {
      expect(mockOnDelete).toHaveBeenCalledWith(1);
    });

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('does not call onDelete when delete is cancelled', () => {
    // Mock window.confirm to return false
    const originalConfirm = window.confirm;
    window.confirm = vi.fn(() => false);

    render(
      <TaskCard
        task={mockTask}
        onToggleStatus={mockOnToggleStatus}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    const deleteButton = screen.getByRole('button', { name: /delete task/i });
    fireEvent.click(deleteButton);

    expect(mockOnDelete).not.toHaveBeenCalled();

    // Restore original confirm
    window.confirm = originalConfirm;
  });

  it('renders without action buttons when callbacks are not provided', () => {
    render(<TaskCard task={mockTask} />);

    expect(screen.queryByRole('button', { name: /edit task/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /delete task/i })).not.toBeInTheDocument();
    
    // Toggle status button should still be present
    expect(screen.getByRole('button', { name: /mark as completed/i })).toBeInTheDocument();
  });

  it('shows due soon indicator for tasks due within 24 hours', () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dueSoonTask = {
      ...mockTask,
      due_date: tomorrow.toISOString(),
    };

    render(
      <TaskCard
        task={dueSoonTask}
        onToggleStatus={mockOnToggleStatus}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByText(/\(Due Soon\)/)).toBeInTheDocument();
  });

  it('applies correct accessibility attributes', () => {
    render(
      <TaskCard
        task={mockTask}
        onToggleStatus={mockOnToggleStatus}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
      />
    );

    expect(screen.getByRole('button', { name: /mark as completed/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit task/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /delete task/i })).toBeInTheDocument();
  });
});