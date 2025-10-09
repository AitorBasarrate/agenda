import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { TaskProvider, useTaskContext } from '../TaskContext';
import { apiClient } from '../../api/client';
import type { Task } from '../../types/api';

// Mock the API client
vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    apiClient: {
      listTasks: vi.fn(),
      createTask: vi.fn(),
      updateTask: vi.fn(),
      deleteTask: vi.fn(),
    },
  };
});

const mockApiClient = apiClient as {
  listTasks: Mock;
  createTask: Mock;
  updateTask: Mock;
  deleteTask: Mock;
};

// Test component that uses the context
function TestComponent() {
  const {
    tasks,
    loading,
    error,
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    setFilters,
    clearFilters,
  } = useTaskContext();

  return (
    <div>
      <div data-testid="tasks-count">{tasks.length}</div>
      <div data-testid="loading">{loading.toString()}</div>
      <div data-testid="error">{error || 'no-error'}</div>
      <button onClick={() => loadTasks()}>Load Tasks</button>
      <button onClick={() => createTask({ title: 'New Task' })}>Create Task</button>
      <button onClick={() => updateTask(1, { title: 'Updated Task' })}>Update Task</button>
      <button onClick={() => deleteTask(1)}>Delete Task</button>
      <button onClick={() => toggleTaskStatus(1)}>Toggle Status</button>
      <button onClick={() => setFilters({ status: 'completed' })}>Set Filters</button>
      <button onClick={() => clearFilters()}>Clear Filters</button>
    </div>
  );
}

describe('TaskContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockTask: Task = {
    id: 1,
    title: 'Test Task',
    description: 'Test Description',
    due_date: '2024-12-31T23:59:59Z',
    status: 'pending',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockPaginatedResponse = {
    data: [mockTask],
    total: 1,
    page: 1,
    page_size: 10,
    total_pages: 1,
  };

  it('should provide task context to children', () => {
    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    expect(screen.getByTestId('tasks-count')).toHaveTextContent('0');
    expect(screen.getByTestId('loading')).toHaveTextContent('false');
    expect(screen.getByTestId('error')).toHaveTextContent('no-error');
  });

  it('should throw error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      render(<TestComponent />);
    }).toThrow('useTaskContext must be used within a TaskProvider');

    consoleSpy.mockRestore();
  });

  it('should load tasks through context', async () => {
    mockApiClient.listTasks.mockResolvedValue(mockPaginatedResponse);

    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    const loadButton = screen.getByText('Load Tasks');

    await act(async () => {
      loadButton.click();
    });

    expect(screen.getByTestId('tasks-count')).toHaveTextContent('1');
    expect(mockApiClient.listTasks).toHaveBeenCalled();
  });

  it('should create task through context', async () => {
    const newTask: Task = {
      ...mockTask,
      id: 2,
      title: 'New Task',
    };

    mockApiClient.createTask.mockResolvedValue(newTask);

    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    const createButton = screen.getByText('Create Task');

    await act(async () => {
      createButton.click();
    });

    expect(mockApiClient.createTask).toHaveBeenCalledWith({ title: 'New Task' });
  });

  it('should update task through context', async () => {
    const updatedTask: Task = {
      ...mockTask,
      title: 'Updated Task',
    };

    mockApiClient.listTasks.mockResolvedValue(mockPaginatedResponse);
    mockApiClient.updateTask.mockResolvedValue(updatedTask);

    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    // First load tasks
    const loadButton = screen.getByText('Load Tasks');
    await act(async () => {
      loadButton.click();
    });

    // Then update
    const updateButton = screen.getByText('Update Task');
    await act(async () => {
      updateButton.click();
    });

    expect(mockApiClient.updateTask).toHaveBeenCalledWith(1, { title: 'Updated Task' });
  });

  it('should delete task through context', async () => {
    mockApiClient.listTasks.mockResolvedValue(mockPaginatedResponse);
    mockApiClient.deleteTask.mockResolvedValue(undefined);

    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    // First load tasks
    const loadButton = screen.getByText('Load Tasks');
    await act(async () => {
      loadButton.click();
    });

    expect(screen.getByTestId('tasks-count')).toHaveTextContent('1');

    // Then delete
    const deleteButton = screen.getByText('Delete Task');
    await act(async () => {
      deleteButton.click();
    });

    expect(mockApiClient.deleteTask).toHaveBeenCalledWith(1);
    expect(screen.getByTestId('tasks-count')).toHaveTextContent('0');
  });

  it('should toggle task status through context', async () => {
    const completedTask: Task = {
      ...mockTask,
      status: 'completed',
    };

    mockApiClient.listTasks.mockResolvedValue(mockPaginatedResponse);
    mockApiClient.updateTask.mockResolvedValue(completedTask);

    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    // First load tasks
    const loadButton = screen.getByText('Load Tasks');
    await act(async () => {
      loadButton.click();
    });

    // Then toggle status
    const toggleButton = screen.getByText('Toggle Status');
    await act(async () => {
      toggleButton.click();
    });

    expect(mockApiClient.updateTask).toHaveBeenCalledWith(1, { status: 'completed' });
  });

  it('should handle errors through context', async () => {
    const errorMessage = 'Failed to load tasks';
    mockApiClient.listTasks.mockRejectedValue(new Error(errorMessage));

    render(
      <TaskProvider>
        <TestComponent />
      </TaskProvider>
    );

    const loadButton = screen.getByText('Load Tasks');

    await act(async () => {
      loadButton.click();
    });

    expect(screen.getByTestId('error')).toHaveTextContent(errorMessage);
  });
});