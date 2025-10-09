import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { TaskList } from '../TaskList';
import { TaskProvider } from '../../contexts/TaskContext';
import type { Task } from '../../types/api';

// Mock the task context hook
const mockTaskContext = {
  tasks: [] as Task[],
  loading: false,
  error: null,
  filters: {},
  loadTasks: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: vi.fn(),
  toggleTaskStatus: vi.fn(),
  setFilters: vi.fn(),
  clearFilters: vi.fn(),
  setError: vi.fn(),
};

// Mock the useTaskContext hook
vi.mock('../../contexts/TaskContext', async () => {
  const actual = await vi.importActual('../../contexts/TaskContext');
  return {
    ...actual,
    useTaskContext: () => mockTaskContext,
  };
});

// Mock task data
const mockTasks: Task[] = [
  {
    id: 1,
    title: 'First Task',
    description: 'First task description',
    due_date: '2024-12-31T23:59:59Z',
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 2,
    title: 'Second Task',
    description: 'Second task description',
    due_date: null,
    status: 'completed',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
  {
    id: 3,
    title: 'Third Task',
    description: 'Third task description',
    due_date: '2023-12-31T23:59:59Z', // Overdue
    status: 'pending',
    created_at: '2024-01-03T00:00:00Z',
    updated_at: '2024-01-03T00:00:00Z',
  },
];

describe('TaskList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockTaskContext.tasks = mockTasks;
    mockTaskContext.loading = false;
    mockTaskContext.error = null;
  });

  const renderTaskList = () => {
    return render(<TaskList />);
  };

  describe('Rendering', () => {
    it('renders task list header correctly', () => {
      renderTaskList();

      expect(screen.getByText('Tasks')).toBeInTheDocument();
      expect(screen.getByText('3 of 3 tasks')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new task/i })).toBeInTheDocument();
    });

    it('renders all tasks', () => {
      renderTaskList();

      expect(screen.getByText('First Task')).toBeInTheDocument();
      expect(screen.getByText('Second Task')).toBeInTheDocument();
      expect(screen.getByText('Third Task')).toBeInTheDocument();
    });

    it('renders filter controls', () => {
      renderTaskList();

      expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
    });

    it('renders sort controls', () => {
      renderTaskList();

      expect(screen.getByText('Sort by:')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /created/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /title/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /due date/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /status/i })).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('shows loading spinner when loading', () => {
      mockTaskContext.loading = true;
      renderTaskList();

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('animate-spin');
    });

    it('calls loadTasks on mount', () => {
      renderTaskList();
      expect(mockTaskContext.loadTasks).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('displays error message when error exists', () => {
      mockTaskContext.error = 'Failed to load tasks';
      renderTaskList();

      expect(screen.getByText('Failed to load tasks')).toBeInTheDocument();
    });

    it('allows dismissing error message', () => {
      mockTaskContext.error = 'Failed to load tasks';
      renderTaskList();

      const dismissButton = screen.getByRole('button', { name: '' }); // Close button
      fireEvent.click(dismissButton);

      expect(mockTaskContext.setError).toHaveBeenCalledWith(null);
    });
  });

  describe('Empty State', () => {
    it('shows empty state when no tasks', () => {
      mockTaskContext.tasks = [];
      renderTaskList();

      expect(screen.getByText('No tasks found')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first task.')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /create task/i })).toBeInTheDocument();
    });

    it('shows filtered empty state when filters are active', () => {
      mockTaskContext.tasks = [];
      renderTaskList();

      // Apply a filter
      const searchInput = screen.getByLabelText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

      expect(screen.getByText('No tasks found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or search terms.')).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('filters tasks by search term', async () => {
      renderTaskList();

      const searchInput = screen.getByLabelText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'First' } });

      // Should show only the first task
      expect(screen.getByText('First Task')).toBeInTheDocument();
      expect(screen.queryByText('Second Task')).not.toBeInTheDocument();
      expect(screen.queryByText('Third Task')).not.toBeInTheDocument();
    });

    it('filters tasks by status', async () => {
      renderTaskList();

      const statusSelect = screen.getByLabelText(/status/i);
      fireEvent.change(statusSelect, { target: { value: 'completed' } });

      // Wait for debounced API call
      await waitFor(() => {
        expect(mockTaskContext.setFilters).toHaveBeenCalledWith({ status: 'completed' });
      }, { timeout: 500 });
    });

    it('filters tasks by due date', async () => {
      renderTaskList();

      const dueDateSelect = screen.getByLabelText(/due date/i);
      fireEvent.change(dueDateSelect, { target: { value: 'overdue' } });

      // Wait for debounced API call
      await waitFor(() => {
        expect(mockTaskContext.setFilters).toHaveBeenCalledWith(
          expect.objectContaining({
            due_before: expect.any(String),
            status: 'pending',
          })
        );
      }, { timeout: 500 });
    });

    it('shows clear filters button when filters are active', () => {
      renderTaskList();

      const searchInput = screen.getByLabelText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
    });

    it('clears all filters when clear button is clicked', () => {
      renderTaskList();

      const searchInput = screen.getByLabelText(/search/i);
      fireEvent.change(searchInput, { target: { value: 'test' } });

      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      fireEvent.click(clearButton);

      expect(mockTaskContext.clearFilters).toHaveBeenCalled();
    });
  });

  describe('Sorting', () => {
    it('sorts tasks by title', () => {
      renderTaskList();

      const titleSortButton = screen.getByRole('button', { name: /title/i });
      fireEvent.click(titleSortButton);

      // Check if tasks are sorted alphabetically - exclude "New Task" button text
      const taskElements = screen.getAllByText(/^(First|Second|Third) Task$/);
      const taskTitles = taskElements.map(el => el.textContent);
      expect(taskTitles).toEqual(['First Task', 'Second Task', 'Third Task']);
    });

    it('toggles sort direction when clicking same field', () => {
      renderTaskList();

      const titleSortButton = screen.getByRole('button', { name: /title/i });
      
      // First click - ascending
      fireEvent.click(titleSortButton);
      
      // Second click - descending
      fireEvent.click(titleSortButton);

      // Check if tasks are sorted in reverse order - exclude "New Task" button text
      const taskElements = screen.getAllByText(/^(First|Second|Third) Task$/);
      const taskTitles = taskElements.map(el => el.textContent);
      expect(taskTitles).toEqual(['Third Task', 'Second Task', 'First Task']);
    });

    it('sorts by due date with null dates handled correctly', () => {
      renderTaskList();

      const dueDateSortButton = screen.getByRole('button', { name: /due date/i });
      fireEvent.click(dueDateSortButton);

      // Tasks with null due dates should be sorted to the beginning (0 timestamp)
      const taskElements = screen.getAllByText(/^(First|Second|Third) Task$/);
      const taskTitles = taskElements.map(el => el.textContent);
      expect(taskTitles[0]).toBe('Second Task'); // null due_date should be first
    });
  });

  describe('Task Actions', () => {
    it('opens create form when new task button is clicked', () => {
      renderTaskList();

      const newTaskButton = screen.getByRole('button', { name: /new task/i });
      fireEvent.click(newTaskButton);

      expect(screen.getByText('Create New Task')).toBeInTheDocument();
    });

    it('calls toggleTaskStatus when task status is toggled', () => {
      renderTaskList();

      // Find the first task (by default sorted by created_at desc, so Third Task is first)
      const toggleButtons = screen.getAllByRole('button', { name: /mark as/i });
      fireEvent.click(toggleButtons[0]);

      // Should call with the ID of the first task in the sorted list (Third Task = id 3)
      expect(mockTaskContext.toggleTaskStatus).toHaveBeenCalledWith(3);
    });

    it('opens edit form when task edit button is clicked', () => {
      renderTaskList();

      const editButtons = screen.getAllByRole('button', { name: /edit task/i });
      fireEvent.click(editButtons[0]);

      expect(screen.getByText('Edit Task')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Third Task')).toBeInTheDocument();
    });

    it('calls deleteTask when task delete button is clicked and confirmed', async () => {
      // Mock window.confirm
      const originalConfirm = window.confirm;
      window.confirm = vi.fn(() => true);

      renderTaskList();

      const deleteButtons = screen.getAllByRole('button', { name: /delete task/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockTaskContext.deleteTask).toHaveBeenCalledWith(3);
      });

      // Restore original confirm
      window.confirm = originalConfirm;
    });
  });

  describe('Form Handling', () => {
    it('creates task when form is submitted', async () => {
      mockTaskContext.createTask.mockResolvedValue({
        id: 4,
        title: 'New Task',
        description: '',
        due_date: null,
        status: 'pending',
        created_at: '2024-01-04T00:00:00Z',
        updated_at: '2024-01-04T00:00:00Z',
      });

      renderTaskList();

      // Open create form
      fireEvent.click(screen.getByRole('button', { name: /new task/i }));

      // Fill and submit form
      fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'New Task' } });
      fireEvent.click(screen.getByRole('button', { name: /create task/i }));

      await waitFor(() => {
        expect(mockTaskContext.createTask).toHaveBeenCalledWith({
          title: 'New Task',
          description: undefined,
          due_date: null,
        });
      });

      // Form should close
      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });

    it('opens edit form with correct task data', async () => {
      mockTaskContext.loading = false; // Ensure not loading

      renderTaskList();

      // Wait for tasks to render
      await waitFor(() => {
        expect(screen.getByText('Third Task')).toBeInTheDocument();
      });

      // Open edit form (first task in sorted list is Third Task)
      const editButtons = screen.getAllByRole('button', { name: /edit task/i });
      fireEvent.click(editButtons[0]);

      // Wait for form to appear and verify it's the edit form with correct data
      await waitFor(() => {
        expect(screen.getByText('Edit Task')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Third Task')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Third task description')).toBeInTheDocument();
      });
    });

    it('closes form when cancel is clicked', () => {
      renderTaskList();

      // Open create form
      fireEvent.click(screen.getByRole('button', { name: /new task/i }));
      expect(screen.getByText('Create New Task')).toBeInTheDocument();

      // Cancel form
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
      expect(screen.queryByText('Create New Task')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels and roles', () => {
      renderTaskList();

      expect(screen.getByLabelText(/search/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/status/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/due date/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /new task/i })).toBeInTheDocument();
    });
  });
});