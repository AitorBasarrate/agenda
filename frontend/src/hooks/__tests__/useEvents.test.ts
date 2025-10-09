import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { useEvents } from '../useEvents';
import { apiClient } from '../../api/client';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../../types/api';

// Mock the API client
vi.mock('../../api/client', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    apiClient: {
      listEvents: vi.fn(),
      createEvent: vi.fn(),
      updateEvent: vi.fn(),
      deleteEvent: vi.fn(),
      getEventsByMonth: vi.fn(),
      getEventsByDay: vi.fn(),
    },
  };
});

const mockApiClient = apiClient as {
  listEvents: Mock;
  createEvent: Mock;
  updateEvent: Mock;
  deleteEvent: Mock;
  getEventsByMonth: Mock;
  getEventsByDay: Mock;
};

describe('useEvents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockEvent: Event = {
    id: 1,
    title: 'Test Event',
    description: 'Test Description',
    start_time: '2024-12-31T10:00:00Z',
    end_time: '2024-12-31T11:00:00Z',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  };

  const mockPaginatedResponse = {
    data: [mockEvent],
    total: 1,
    page: 1,
    page_size: 10,
    total_pages: 1,
  };

  const mockMonthEventsResponse = {
    events: [mockEvent],
    year: 2024,
    month: 12,
    total: 1,
  };

  const mockDayEventsResponse = {
    events: [mockEvent],
    date: '2024-12-31',
    total: 1,
  };

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useEvents());

    expect(result.current.events).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.filters).toEqual({});
    expect(result.current.currentMonth).toBeInstanceOf(Date);
    expect(result.current.selectedDate).toBe(null);
    expect(result.current.pagination).toEqual({
      page: 1,
      page_size: 10,
      total: 0,
      total_pages: 0,
    });
  });

  it('should load events successfully', async () => {
    mockApiClient.listEvents.mockResolvedValue(mockPaginatedResponse);

    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.loadEvents();
    });

    expect(result.current.events).toEqual([mockEvent]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.pagination).toEqual({
      page: 1,
      page_size: 10,
      total: 1,
      total_pages: 1,
    });
  });

  it('should handle load events error', async () => {
    const errorMessage = 'Failed to load events';
    mockApiClient.listEvents.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.loadEvents();
    });

    expect(result.current.events).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should load events for month successfully', async () => {
    mockApiClient.getEventsByMonth.mockResolvedValue(mockMonthEventsResponse);

    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.loadEventsForMonth(2024, 12);
    });

    expect(result.current.events).toEqual([mockEvent]);
    expect(result.current.currentMonth).toEqual(new Date(2024, 11)); // 0-based month
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should load events for day successfully', async () => {
    mockApiClient.getEventsByDay.mockResolvedValue(mockDayEventsResponse);

    const { result } = renderHook(() => useEvents());

    await act(async () => {
      await result.current.loadEventsForDay('2024-12-31');
    });

    expect(result.current.events).toEqual([mockEvent]);
    expect(result.current.selectedDate).toEqual(new Date('2024-12-31'));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should create event successfully', async () => {
    const newEventData: CreateEventRequest = {
      title: 'New Event',
      description: 'New Description',
      start_time: '2024-12-31T14:00:00Z',
      end_time: '2024-12-31T15:00:00Z',
    };

    const createdEvent: Event = {
      ...mockEvent,
      id: 2,
      title: newEventData.title,
      description: newEventData.description!,
      start_time: newEventData.start_time,
      end_time: newEventData.end_time,
    };

    mockApiClient.createEvent.mockResolvedValue(createdEvent);

    const { result } = renderHook(() => useEvents());

    let createdEventResult: Event | null = null;
    await act(async () => {
      createdEventResult = await result.current.createEvent(newEventData);
    });

    expect(createdEventResult).toEqual(createdEvent);
    expect(result.current.events).toHaveLength(1);
    expect(result.current.events[0]).toEqual(createdEvent);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should handle create event error', async () => {
    const newEventData: CreateEventRequest = {
      title: 'New Event',
      start_time: '2024-12-31T14:00:00Z',
      end_time: '2024-12-31T15:00:00Z',
    };

    const errorMessage = 'Failed to create event';
    mockApiClient.createEvent.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => useEvents());

    let createdEventResult: Event | null = null;
    await act(async () => {
      createdEventResult = await result.current.createEvent(newEventData);
    });

    expect(createdEventResult).toBe(null);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should update event successfully', async () => {
    const updateData: UpdateEventRequest = {
      title: 'Updated Event',
      description: 'Updated Description',
    };

    const updatedEvent: Event = {
      ...mockEvent,
      title: updateData.title!,
      description: updateData.description!,
    };

    mockApiClient.listEvents.mockResolvedValue(mockPaginatedResponse);
    mockApiClient.updateEvent.mockResolvedValue(updatedEvent);

    const { result } = renderHook(() => useEvents());

    // Load initial events
    await act(async () => {
      await result.current.loadEvents();
    });

    let updatedEventResult: Event | null = null;
    await act(async () => {
      updatedEventResult = await result.current.updateEvent(mockEvent.id, updateData);
    });

    expect(updatedEventResult).toEqual(updatedEvent);
    expect(result.current.events[0]).toEqual(updatedEvent);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should delete event successfully', async () => {
    mockApiClient.listEvents.mockResolvedValue(mockPaginatedResponse);
    mockApiClient.deleteEvent.mockResolvedValue(undefined);

    const { result } = renderHook(() => useEvents());

    // Load initial events
    await act(async () => {
      await result.current.loadEvents();
    });

    expect(result.current.events).toHaveLength(1);

    let deleteResult: boolean = false;
    await act(async () => {
      deleteResult = await result.current.deleteEvent(mockEvent.id);
    });

    expect(deleteResult).toBe(true);
    expect(result.current.events).toHaveLength(0);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(null);
  });

  it('should navigate months', () => {
    const { result } = renderHook(() => useEvents());

    const initialMonth = result.current.currentMonth;

    act(() => {
      result.current.nextMonth();
    });

    expect(result.current.currentMonth.getMonth()).toBe((initialMonth.getMonth() + 1) % 12);

    act(() => {
      result.current.previousMonth();
    });

    expect(result.current.currentMonth.getMonth()).toBe(initialMonth.getMonth());
  });

  it('should set and clear filters', () => {
    const { result } = renderHook(() => useEvents());

    const filters = { search: 'test', year: 2024, month: 12 };

    act(() => {
      result.current.setFilters(filters);
    });

    expect(result.current.filters).toEqual(filters);

    act(() => {
      result.current.clearFilters();
    });

    expect(result.current.filters).toEqual({});
  });

  it('should set current month and selected date', () => {
    const { result } = renderHook(() => useEvents());

    const newMonth = new Date(2024, 5, 1); // June 2024
    const selectedDate = new Date(2024, 5, 15);

    act(() => {
      result.current.setCurrentMonth(newMonth);
    });

    expect(result.current.currentMonth).toEqual(newMonth);

    act(() => {
      result.current.setSelectedDate(selectedDate);
    });

    expect(result.current.selectedDate).toEqual(selectedDate);

    act(() => {
      result.current.setSelectedDate(null);
    });

    expect(result.current.selectedDate).toBe(null);
  });
});