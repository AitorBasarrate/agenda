// Export the main app provider and all context hooks
export { 
  AppProvider,
  useTaskContext,
  useEventContext,
  useDashboardContext,
  TaskProvider,
  EventProvider,
  DashboardProvider
} from './AppContext';

// Export individual contexts for testing
export { TaskContext } from './TaskContext';
export { EventContext } from './EventContext';
export { DashboardContext } from './DashboardContext';