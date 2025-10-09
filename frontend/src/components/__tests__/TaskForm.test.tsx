import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskForm } from '../TaskForm';
import type { Task } from '../../types/api';

// Mock task data
const mockTask: Task = {
  id: 1,
  title: 'Test Task',
  description: 'This is a test task description',
  due_date: '2025-12-31',
  status: 'pending',
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

describe('TaskForm', () => {
  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Create Mode', () => {
    it('renders create form correctly', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Create New Task')).toBeInTheDocument();
      expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
      
      // Status field should not be present in create mode
      expect(screen.queryByLabelText(/status/i)).not.toBeInTheDocument();
    });

    it('submits create form with valid data', async () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const dueDateInput = screen.getByLabelText(/due date/i);
      const submitButton = screen.getByRole('button', { name: /create task/i });

      fireEvent.change(titleInput, { target: { value: 'New Task' } });
      fireEvent.change(descriptionInput, { target: { value: 'New task description' } });
      fireEvent.change(dueDateInput, { target: { value: '2025-12-31' } }); // Use future date

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'New Task',
          description: 'New task description',
          due_date: '2025-12-31',
        });
      });
    });

    it('submits create form with minimal data', async () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const submitButton = screen.getByRole('button', { name: /create task/i });

      fireEvent.change(titleInput, { target: { value: 'Minimal Task' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Minimal Task',
          description: undefined,
          due_date: null,
        });
      });
    });
  });

  describe('Edit Mode', () => {
    it('renders edit form with task data', () => {
      render(
        <TaskForm
          task={mockTask}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('This is a test task description')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-12-31')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /status/i })).toHaveValue('pending');
      expect(screen.getByRole('button', { name: /update task/i })).toBeInTheDocument();
      
      // Status field should be present in edit mode
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
    });

    it('submits edit form with updated data', async () => {
      render(
        <TaskForm
          task={mockTask}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByDisplayValue('Test Task');
      const statusSelect = screen.getByRole('combobox', { name: /status/i });
      const submitButton = screen.getByRole('button', { name: /update task/i });

      fireEvent.change(titleInput, { target: { value: 'Updated Task' } });
      fireEvent.change(statusSelect, { target: { value: 'completed' } });

      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: 'Updated Task',
          description: 'This is a test task description',
          due_date: '2025-12-31',
          status: 'completed',
        });
      });
    });

    it('handles task with null due_date', () => {
      const taskWithoutDueDate = { ...mockTask, due_date: null };
      render(
        <TaskForm
          task={taskWithoutDueDate}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const dueDateInput = screen.getByLabelText(/due date/i) as HTMLInputElement;
      expect(dueDateInput.value).toBe('');
    });

    it('handles task with empty description', () => {
      const taskWithoutDescription = { ...mockTask, description: '' };
      render(
        <TaskForm
          task={taskWithoutDescription}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const descriptionInput = screen.getByLabelText(/description/i) as HTMLTextAreaElement;
      expect(descriptionInput.value).toBe('');
    });
  });

  describe('Validation', () => {
    it('shows error for empty title', async () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const submitButton = screen.getByRole('button', { name: /create task/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error for title too long', async () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const longTitle = 'a'.repeat(201);
      
      fireEvent.change(titleInput, { target: { value: longTitle } });
      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(screen.getByText('Title must be less than 200 characters')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error for description too long', async () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const descriptionInput = screen.getByLabelText(/description/i);
      const longDescription = 'a'.repeat(1001);
      
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } });
      fireEvent.change(descriptionInput, { target: { value: longDescription } });
      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(screen.getByText('Description must be less than 1000 characters')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('shows error for past due date', async () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText(/title/i);
      const dueDateInput = screen.getByLabelText(/due date/i);
      
      fireEvent.change(titleInput, { target: { value: 'Valid Title' } });
      fireEvent.change(dueDateInput, { target: { value: '2020-01-01' } });
      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(screen.getByText('Due date cannot be in the past')).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('clears errors when user starts typing', async () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Trigger validation error
      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
      });

      // Start typing to clear error
      const titleInput = screen.getByLabelText(/title/i);
      fireEvent.change(titleInput, { target: { value: 'New Title' } });

      expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
    });
  });

  describe('Character Counter', () => {
    it('shows character counter for description', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByText('0/1000 characters')).toBeInTheDocument();

      const descriptionInput = screen.getByLabelText(/description/i);
      fireEvent.change(descriptionInput, { target: { value: 'Hello' } });

      expect(screen.getByText('5/1000 characters')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('disables form when loading', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      expect(screen.getByLabelText(/title/i)).toBeDisabled();
      expect(screen.getByLabelText(/description/i)).toBeDisabled();
      expect(screen.getByLabelText(/due date/i)).toBeDisabled();
      expect(screen.getByRole('button', { name: /creating.../i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    });

    it('shows loading text on submit button', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      expect(screen.getByText(/creating.../i)).toBeInTheDocument();
    });

    it('shows updating text for edit mode', () => {
      render(
        <TaskForm
          task={mockTask}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isLoading={true}
        />
      );

      expect(screen.getByText(/updating.../i)).toBeInTheDocument();
    });
  });

  describe('Form Actions', () => {
    it('calls onCancel when cancel button is clicked', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(mockOnCancel).toHaveBeenCalled();
    });

    it('calls onCancel when close button is clicked', () => {
      render(
        <TaskForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /close/i }));
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });

  describe('Form Reset', () => {
    it('resets form when task prop changes from edit to create', () => {
      const { rerender } = render(
        <TaskForm
          task={mockTask}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      expect(screen.getByDisplayValue('Test Task')).toBeInTheDocument();

      rerender(
        <TaskForm
          task={null}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const titleInput = screen.getByLabelText(/title/i) as HTMLInputElement;
      expect(titleInput.value).toBe('');
    });
  });
});