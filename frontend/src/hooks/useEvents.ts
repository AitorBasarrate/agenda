import { useState, useCallback } from 'react';
import { apiClient, ApiError } from '../api/client';
import type { Event, CreateEventRequest, UpdateEventRequest, EventListQuery } from '../types/api';

export interface EventFilters {
  search?: string;
  start_after?: string;
  start_before?: string;
  end_after?: string;
  end_before?: string;
  year?: number;
  month?: number;
}

export interface EventState {
  events: Event[];
  loading: boolean;
  error: string | null;
  filters: EventFilters;
  currentMonth: Date;
  selectedDate: Date | null;
  pagination: {
    page: number;
    page_size: number;
    total: number;
    total_pages: number;
  };
}

const initialState: EventState = {
  events: [],
  loading: false,
  error: null,
  filters: {},
  currentMonth: new Date(),
  selectedDate: null,
  pagination: {
    page: 1,
    page_size: 10,
    total: 0,
    total_pages: 0,
  },
};

export function useEvents() {
  const [state, setState] = useState<EventState>(initialState);

  // Helper to update state
  const updateState = useCallback((updates: Partial<EventState>) => {
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

  // Load events with current filters
  const loadEvents = useCallback(async (query?: EventListQuery) => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = { ...state.filters, ...query };
      const response = await apiClient.listEvents(queryParams);
      
      updateState({
        events: response.data,
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
        : 'Failed to load events';
      setError(errorMessage);
      setLoading(false);
    }
  }, [state.filters, setLoading, setError, updateState]);

  // Load events for a specific month
  const loadEventsForMonth = useCallback(async (year: number, month: number) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getEventsByMonth(year, month);
      
      updateState({
        events: response.events,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to load events for month';
      setError(errorMessage);
      setLoading(false);
    }
  }, [setLoading, setError, updateState]);

  // Load events for a specific day
  const loadEventsForDay = useCallback(async (day: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getEventsByDay(day);
      const [y, m, d] = day.split('-').map(Number);
      const selected = new Date(y, m-1, d);

      updateState({
        events: response.events,
        selectedDate: selected,
        loading: false,
      });
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to load events for day';
      setError(errorMessage);
      setLoading(false);
    }
  }, [setLoading, setError, updateState]);

  // Create a new event
  const createEvent = useCallback(async (eventData: CreateEventRequest): Promise<Event | null> => {
    setLoading(true);
    setError(null);

    try {
      const newEvent = await apiClient.createEvent(eventData);
      
      // Add the new event to the current list
      setState(prev => ({
        ...prev,
        events: [newEvent, ...state.events],
        loading: false,
      }));
      
      return newEvent;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to create event';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [state.events, setLoading, setError, updateState]);

  // Update an existing event
  const updateEvent = useCallback(async (id: number, eventData: UpdateEventRequest): Promise<Event | null> => {
    setLoading(true);
    setError(null);

    try {
      const updatedEvent = await apiClient.updateEvent(id, eventData);
      
      // Update the event in the current list
      setState(prev => ({
        ...prev,
        events: state.events.map(event => 
          event.id === id ? updatedEvent : event
        ),
        loading: false,
      }));
      
      return updatedEvent;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to update event';
      setError(errorMessage);
      setLoading(false);
      return null;
    }
  }, [state.events, setLoading, setError, updateState]);

  // Delete an event
  const deleteEvent = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      await apiClient.deleteEvent(id);
      
      // Remove the event from the current list
      setState(prev => ({
        ...prev,
        events: state.events.filter(event => event.id !== id),
        loading: false,
      }));
      
      return true;
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Failed to delete event';
      setError(errorMessage);
      setLoading(false);
      return false;
    }
  }, [state.events, setLoading, setError, updateState]);

  // Update filters
  const setFilters = useCallback((filters: EventFilters) => {
    updateState({ filters });
  }, [updateState]);

  // Clear filters
  const clearFilters = useCallback(() => {
    updateState({ filters: {} });
  }, [updateState]);

  // Set current month for calendar view
  const setCurrentMonth = useCallback((month: Date) => {
    updateState({ currentMonth: month });
  }, [updateState]);

  // Set selected date
  const setSelectedDate = useCallback((date: Date | null) => {
    updateState({ selectedDate: date });
  }, [updateState]);

  // Navigate to next month
  const nextMonth = useCallback(() => {
    const nextMonth = new Date(state.currentMonth);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setCurrentMonth(nextMonth);
  }, [state.currentMonth, setCurrentMonth]);

  // Navigate to previous month
  const previousMonth = useCallback(() => {
    const prevMonth = new Date(state.currentMonth);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentMonth(prevMonth);
  }, [state.currentMonth, setCurrentMonth]);

  // Refresh events (reload with current filters)
  const refreshEvents = useCallback(() => {
    loadEvents();
  }, [loadEvents]);

  return {
    // State
    events: state.events,
    loading: state.loading,
    error: state.error,
    filters: state.filters,
    currentMonth: state.currentMonth,
    selectedDate: state.selectedDate,
    pagination: state.pagination,
    
    // Actions
    loadEvents,
    loadEventsForMonth,
    loadEventsForDay,
    createEvent,
    updateEvent,
    deleteEvent,
    setFilters,
    clearFilters,
    setCurrentMonth,
    setSelectedDate,
    nextMonth,
    previousMonth,
    refreshEvents,
    setError,
  };
}