// Basic tests for API client functionality

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ApiClient, ApiError } from '../client';

// Mock fetch globally
const mockFetch = vi.fn();
(globalThis as any).fetch = mockFetch;

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('http://localhost:8080');
    mockFetch.mockClear();
  });

  describe('request handling', () => {
    it('should make GET requests with correct URL and headers', async () => {
      const mockResponse = { id: 1, title: 'Test Task' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      });

      const result = await client.get('/tasks/1');

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks/1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should make POST requests with JSON body', async () => {
      const requestData = { title: 'New Task', description: 'Test description' };
      const mockResponse = { id: 1, ...requestData };
      
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockResponse,
      });

      const result = await client.post('/tasks', requestData);

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(requestData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle query parameters correctly', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], total: 0 }),
      });

      await client.get('/tasks', { status: 'pending', page: 1, page_size: 20 });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks?status=pending&page=1&page_size=20',
        expect.any(Object)
      );
    });

    it('should filter out undefined query parameters', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ data: [], total: 0 }),
      });

      await client.get('/tasks', { status: 'pending', search: undefined, page: 1 });

      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:8080/api/tasks?status=pending&page=1',
        expect.any(Object)
      );
    });
  });

  describe('error handling', () => {
    it('should throw ApiError for HTTP error responses', async () => {
      const errorResponse = {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid input',
          details: { title: 'Title is required' },
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => errorResponse,
      });

      try {
        await client.get('/tasks/invalid');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).status).toBe(400);
        expect((error as ApiError).code).toBe('VALIDATION_ERROR');
        expect((error as ApiError).message).toBe('Invalid input');
        expect((error as ApiError).details).toEqual({ title: 'Title is required' });
      }
    });

    it('should throw ApiError for network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.get('/tasks')).rejects.toThrow(ApiError);
      
      try {
        await client.get('/tasks');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('NETWORK_ERROR');
      }
    });

    it('should handle 204 No Content responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const result = await client.delete('/tasks/1');
      expect(result).toBeUndefined();
    });

    it('should throw ApiError for invalid JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      try {
        await client.get('/tasks');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).toBeInstanceOf(ApiError);
        expect((error as ApiError).code).toBe('PARSE_ERROR');
      }
    });
  });

  describe('API methods', () => {
    it('should call correct endpoints for task operations', async () => {
      const mockTask = { id: 1, title: 'Test Task', status: 'pending' };
      
      // Mock successful responses
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockTask,
      });

      // Test createTask
      await client.createTask({ title: 'New Task' });
      expect(mockFetch).toHaveBeenLastCalledWith(
        'http://localhost:8080/api/tasks',
        expect.objectContaining({ method: 'POST' })
      );

      // Test getTask
      await client.getTask(1);
      expect(mockFetch).toHaveBeenLastCalledWith(
        'http://localhost:8080/api/tasks/1',
        expect.objectContaining({ method: 'GET' })
      );

      // Test updateTask
      await client.updateTask(1, { title: 'Updated Task' });
      expect(mockFetch).toHaveBeenLastCalledWith(
        'http://localhost:8080/api/tasks/1',
        expect.objectContaining({ method: 'PUT' })
      );

      // Test completeTask
      await client.completeTask(1);
      expect(mockFetch).toHaveBeenLastCalledWith(
        'http://localhost:8080/api/tasks/1/complete',
        expect.objectContaining({ method: 'POST' })
      );
    });

    it('should call correct endpoints for event operations', async () => {
      const mockEvent = { 
        id: 1, 
        title: 'Test Event', 
        start_time: '2023-01-01T10:00:00Z',
        end_time: '2023-01-01T11:00:00Z'
      };
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockEvent,
      });

      // Test createEvent
      await client.createEvent({
        title: 'New Event',
        start_time: '2023-01-01T10:00:00Z',
        end_time: '2023-01-01T11:00:00Z'
      });
      expect(mockFetch).toHaveBeenLastCalledWith(
        'http://localhost:8080/api/events',
        expect.objectContaining({ method: 'POST' })
      );

      // Test getEventsByMonth
      await client.getEventsByMonth(2023, 1);
      expect(mockFetch).toHaveBeenLastCalledWith(
        'http://localhost:8080/api/events?year=2023&month=1',
        expect.objectContaining({ method: 'GET' })
      );
    });

    it('should call correct endpoints for dashboard operations', async () => {
      const mockDashboard = { tasks: [], events: [], stats: {} };
      
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockDashboard,
      });

      // Test getDashboard
      await client.getDashboard();
      expect(mockFetch).toHaveBeenLastCalledWith(
        'http://localhost:8080/api/dashboard',
        expect.objectContaining({ method: 'GET' })
      );

      // Test getCalendarView
      await client.getCalendarView({ year: 2023, month: 1 });
      expect(mockFetch).toHaveBeenLastCalledWith(
        'http://localhost:8080/api/dashboard/calendar?year=2023&month=1',
        expect.objectContaining({ method: 'GET' })
      );
    });
  });
});