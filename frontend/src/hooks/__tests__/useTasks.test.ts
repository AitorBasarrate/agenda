import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useTasks } from '../useTasks';
import { apiClient } from '../../api/client';
import type { Task, CreateTaskRequest, UpdateTaskRequest } from '../../types/api';

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

describe('useTasks', () => {
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

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useTasks());

    expect(result.current.tasks).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.filters).toEqual({});
    expect(result.current.pagination).toEqual({
      page: 1,
      page_size: 10,
      total: 0,
      total_pages: 0,
    });
  });

  it('should load tasks successfully', async () => {
    mockApiClient.listTasks.mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.loadTasks();
    });

    expect(result.current.tasks).toEqual([mockTask]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.pagination).toEqual({
      page: 1,
      page_size: 10,
      total: 1,
      total_pages: 1,
    });
  });

  it('should handle load tasks error', async () => {
    const errorMessage = 'Failed to load tasks';
    mockApiClient.listTasks.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useTasks());

    await act(async () => {
      await result.current.loadTasks();
    });

    expect(result.current.tasks).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should create task successfully', async () => {
    const newTaskData: CreateTaskRequest = {
      title: 'New Task',
      description: 'New Description',
    };

    const createdTask: Task = {
      ...mockTask,
      id: 2,
      title: newTaskData.title,
      description: newTaskData.description!,
    };

    mockApiClient.createTask.mockResolvedValue(createdTask);

    const { result } = renderHook(() => useTasks());

    // Set initial tasks
    mockApiClient.listTasks.mockResolvedValue(mockPaginatedResponse)
    await act(async () => {
      await result.current.loadTasks();
    });

    let createdTaskResult: Task | null = null;
    await act(async () => {
      createdTaskResult = await result.current.createTask(newTaskData);
    });

    expect(createdTaskResult).toEqual(createdTask);
    expect(result.current.tasks).toHaveLength(1);
    expect(result.current.tasks[0]).toEqual(createdTask);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle create task error', async () => {
    const newTaskData: CreateTaskRequest = {
      title: 'New Task',
    };

    const errorMessage = 'Failed to create task';
    mockApiClient.createTask.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useTasks());

    let createdTaskResult: Task | null = null;
    await act(async () => {
      createdTaskResult = await result.current.createTask(newTaskData);
    });

    expect(createdTaskResult).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should update task successfully', async () => {
    const updateData: UpdateTaskRequest = {
      title: 'Updated Task',
      status: 'completed',
    };

    const updatedTask: Task = {
      ...mockTask,
      title: updateData.title!,
      status: updateData.status!,
    };

    mockApiClient.listTasks.mockResolvedValue(mockPaginatedResponse);
    mockApiClient.updateTask.mockResolvedValue(updatedTask);

    const { result } = renderHook(() => useTasks());

    // Load initial tasks
    await act(async () => {
      await result.current.loadTasks();
    });

    let updatedTaskResult: Task | null = null;
    await act(async () => {
      updatedTaskResult = await result.current.updateTask(mockTask.id, updateData);
    });

    expect(updatedTaskResult).toEqual(updatedTask);
    expect(result.current.tasks[0]).toEqual(updatedTask);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should delete task successfully', async () => {
    mockApiClient.listTasks.mockResolvedValue(mockPaginatedResponse);
    mockApiClient.deleteTask.mockResolvedValue(undefined);

    const { result } = renderHook(() => useTasks());

    // Load initial tasks
    await act(async () => {
      await result.current.loadTasks();
    });

    expect(result.current.tasks).toHaveLength(1);

    let deleteResult: boolean = false;
    await act(async () => {
      deleteResult = await result.current.deleteTask(mockTask.id);
    });

    expect(deleteResult).toBe(true);
    expect(result.current.tasks).toHaveLength(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should toggle task status', async () => {
    const completedTask: Task = {
      ...mockTask,
      status: 'completed',
    };

    mockApiClient.listTasks.mockResolvedValue(mockPaginatedResponse);
    mockApiClient.updateTask.mockResolvedValue(completedTask);

    const { result } = renderHook(() => useTasks());

    // Load initial tasks
    await act(async () => {
      await result.current.loadTasks();
    });

    let toggleResult: Task | null = null;
    await act(async () => {
      toggleResult = await result.current.toggleTaskStatus(mockTask.id);
    });

    expect(toggleResult).toEqual(completedTask);
    expect(mockApiClient.updateTask).toHaveBeenCalledWith(mockTask.id, { status: 'completed' });
  });

  it('should set and clear filters', () => {
    const { result } = renderHook(() => useTasks());

    const filters = { status: 'completed' as const, search: 'test' };

    act(() => {
      result.current.setFilters(filters);
    });

    expect(result.current.filters).toEqual(filters);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
  });

  it('should set error', () => {
    const { result } = renderHook(() => useTasks());

    const errorMessage = 'Test error';

    act(() => {
      result.current.setError(errorMessage);
    });

    expect(result.current.error).toBe(errorMessage);

    act(() => {
      result.current.setError(null);
    });

    expect(result.current.error).toBe(null);
  });
});