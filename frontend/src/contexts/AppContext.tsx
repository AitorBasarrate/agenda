import type { ReactNode } from 'react';
import { TaskProvider } from './TaskContext';
import { EventProvider } from './EventContext';
import { DashboardProvider } from './DashboardContext';

// Combined provider props
interface AppProviderProps {
  children: ReactNode;
}

// Combined provider component that wraps all context providers
export function AppProvider({ children }: AppProviderProps) {
  return (
    <TaskProvider>
      <EventProvider>
        <DashboardProvider>
          {children}
        </DashboardProvider>
      </EventProvider>
    </TaskProvider>
  );
}

// Re-export all context hooks for convenience
export { useTaskContext } from './TaskContext';
export { useEventContext } from './EventContext';
export { useDashboardContext } from './DashboardContext';

// Re-export individual providers for selective usage
export { TaskProvider } from './TaskContext';
export { EventProvider } from './EventContext';
export { DashboardProvider } from './DashboardContext';