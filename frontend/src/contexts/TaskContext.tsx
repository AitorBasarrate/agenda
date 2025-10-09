import { createContext, useContext, type ReactNode } from 'react';
import { useTasks, type TaskState, type TaskFilters } from '../hooks/useTasks';
import type { Task, CreateTaskRequest, UpdateTaskRequest, TaskListQuery } from '../types/api';

// Context type definition
interface TaskContextType {
  // State
  tasks: Task[];
  loading: boolean;
  error: string | null;
  filters: TaskFilters;
  pagination: TaskState['pagination'];
  
  // Actions
  loadTasks: (query?: TaskListQuery) => Promise<void>;
  createTask: (taskData: CreateTaskRequest) => Promise<Task | null>;
  updateTask: (id: number, taskData: UpdateTaskRequest) => Promise<Task | null>;
  deleteTask: (id: number) => Promise<boolean>;
  toggleTaskStatus: (id: number) => Promise<Task | null>;
  setFilters: (filters: TaskFilters) => void;
  clearFilters: () => void;
  refreshTasks: () => void;
  setError: (error: string | null) => void;
}

// Create the context
const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Provider props
interface TaskProviderProps {
  children: ReactNode;
}

// Provider component
export function TaskProvider({ children }: TaskProviderProps) {
  const taskHook = useTasks();

  const contextValue: TaskContextType = {
    // State
    tasks: taskHook.tasks,
    loading: taskHook.loading,
    error: taskHook.error,
    filters: taskHook.filters,
    pagination: taskHook.pagination,
    
    // Actions
    loadTasks: taskHook.loadTasks,
    createTask: taskHook.createTask,
    updateTask: taskHook.updateTask,
    deleteTask: taskHook.deleteTask,
    toggleTaskStatus: taskHook.toggleTaskStatus,
    setFilters: taskHook.setFilters,
    clearFilters: taskHook.clearFilters,
    refreshTasks: taskHook.refreshTasks,
    setError: taskHook.setError,
  };

  return (
    <TaskContext.Provider value={contextValue}>
      {children}
    </TaskContext.Provider>
  );
}

// Custom hook to use the task context
export function useTaskContext(): TaskContextType {
  const context = useContext(TaskContext);
  
  if (context === undefined) {
    throw new Error('useTaskContext must be used within a TaskProvider');
  }
  
  return context;
}

// Export the context for testing purposes
export { TaskContext };