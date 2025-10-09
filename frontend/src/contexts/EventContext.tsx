import { createContext, useContext, type ReactNode } from 'react';
import { useEvents, type EventState, type EventFilters } from '../hooks/useEvents';
import type { Event, CreateEventRequest, UpdateEventRequest, EventListQuery } from '../types/api';

// Context type definition
interface EventContextType {
    // State
    events: Event[];
    loading: boolean;
    error: string | null;
    filters: EventFilters;
    currentMonth: Date;
    selectedDate: Date | null;
    pagination: EventState['pagination'];

    // Actions
    loadEvents: (query?: EventListQuery) => Promise<void>;
    loadEventsForMonth: (year: number, month: number) => Promise<void>;
    loadEventsForDay: (day: string) => Promise<void>;
    createEvent: (eventData: CreateEventRequest) => Promise<Event | null>;
    updateEvent: (id: number, eventData: UpdateEventRequest) => Promise<Event | null>;
    deleteEvent: (id: number) => Promise<boolean>;
    setFilters: (filters: EventFilters) => void;
    clearFilters: () => void;
    setCurrentMonth: (month: Date) => void;
    setSelectedDate: (date: Date | null) => void;
    nextMonth: () => void;
    previousMonth: () => void;
    refreshEvents: () => void;
    setError: (error: string | null) => void;
}

// Create the context
const EventContext = createContext<EventContextType | undefined>(undefined);

// Provider props
interface EventProviderProps {
    children: ReactNode;
}

// Provider component
export function EventProvider({ children }: EventProviderProps) {
    const eventHook = useEvents();

    const contextValue: EventContextType = {
        // State
        events: eventHook.events,
        loading: eventHook.loading,
        error: eventHook.error,
        filters: eventHook.filters,
        currentMonth: eventHook.currentMonth,
        selectedDate: eventHook.selectedDate,
        pagination: eventHook.pagination,

        // Actions
        loadEvents: eventHook.loadEvents,
        loadEventsForMonth: eventHook.loadEventsForMonth,
        loadEventsForDay: eventHook.loadEventsForDay,
        createEvent: eventHook.createEvent,
        updateEvent: eventHook.updateEvent,
        deleteEvent: eventHook.deleteEvent,
        setFilters: eventHook.setFilters,
        clearFilters: eventHook.clearFilters,
        setCurrentMonth: eventHook.setCurrentMonth,
        setSelectedDate: eventHook.setSelectedDate,
        nextMonth: eventHook.nextMonth,
        previousMonth: eventHook.previousMonth,
        refreshEvents: eventHook.refreshEvents,
        setError: eventHook.setError,
    };

    return (
        <EventContext.Provider value={contextValue}>
            {children}
        </EventContext.Provider>
    );
}

// Custom hook to use the event context
export function useEventContext(): EventContextType {
    const context = useContext(EventContext);

    if (context === undefined) {
        throw new Error('useEventContext must be used within an EventProvider');
    }

    return context;
}

// Export the context for testing purposes
export { EventContext };