import { useState, useCallback } from 'react';
import { apiClient, ApiError } from '../api/client';
import type { Task, CreateTaskRequest, UpdateTaskRequest, TaskListQuery } from '../types/api';

export interface TaskFilters {
  status?: 'pending' | 'completed';
  search?: string;
  due_after?: string;
  due_before?: string;
}

export interface TaskState {
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: TaskFilters;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

const initialState: TaskState = {
  tasks: [],
  loading: false,
  error: null,
  filters: {},
  pagination: {
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0,
  },
};

export function useTasks() {
  const [state, setState] = useState<TaskState>(initialState);

  // Helper to update state
  const updateState = useCallback((updates: Partial<TaskState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Set loading state
  const setLoading = useCallback((loading: boolean) => {
    updateState({ loading });
  }, [updateState]);

  // Set error state
  const setError = useCallback((error: string | null) => {
    updateState({ error });
  }, [updateState]);

  // Load tasks with current filters
  const loadTasks = useCallback(async (query?: TaskListQuery) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = { ...state.filters, ...query };
      const response = await apiClient.listTasks(queryParams);
      
      updateState({
        tasks: response.data,
        pagination: {
          page: response.page,
          page_size: response.page_size,
          total: response.total,
          total_pages: response.total_pages,
        },
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to load tasks';
      setError(errorMessage);
      setLoading(false);
    }
  }, [state.filters, setLoading, setError, updateState]);

  // Create a new task
  const createTask = useCallback(async (taskData: CreateTaskRequest): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    try {
      const newTask = await apiClient.createTask(taskData);
      
      setState(prev => ({
        ...prev,
        tasks: [newTask, ...prev.tasks],
        loading: false,
      }))
      
      return newTask;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to create task';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [state.tasks, setLoading, setError, updateState]);

  // Update an existing task
  const updateTask = useCallback(async (id: number, taskData: UpdateTaskRequest): Promise<Task | null> => {
    setLoading(true);
    setError(null);

    try {
      const updatedTask = await apiClient.updateTask(id, taskData);
      
      // Update the task in the current list
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.map(task =>
          task.id === id ? updatedTask : task
        ),
        loading: false,
      }));
      
      return updatedTask;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to update task';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [state.tasks, setLoading, setError, updateState]);

  // Delete a task
  const deleteTask = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.deleteTask(id);
      
      // Remove the task from the current list
      setState(prev => ({
        ...prev,
        tasks: prev.tasks.filter(task => task.id !== id),
        loading: false,
      }))
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to delete task';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  }, [state.tasks, setLoading, setError, updateState]);

  // Toggle task completion status
  const toggleTaskStatus = useCallback(async (id: number): Promise<Task | null> => {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return null;

    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    return updateTask(id, { status: newStatus });
  }, [state.tasks, updateTask]);

  // Update filters
  const setFilters = useCallback((filters: TaskFilters) => {
    updateState({ filters });
  }, [updateState]);

  // Clear filters
  const clearFilters = useCallback(() => {
    updateState({ filters: {} });
  }, [updateState]);

  // Refresh tasks (reload with current filters)
  const refreshTasks = useCallback(() => {
    loadTasks();
  }, [loadTasks]);

  return {
    // State
    tasks: state.tasks,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    pagination: state.pagination,
    
    // Actions
    loadTasks,
    createTask,
    updateTask,
    deleteTask,
    toggleTaskStatus,
    setFilters,
    clearFilters,
    refreshTasks,
    setError,
  };
}