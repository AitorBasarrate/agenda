// Demo component showing API client usage

import React, { useState, useEffect } from 'react';
import {
  TaskService,
  EventService,
  DashboardService,
  ApiErrorHandler,
} from '../api';
import type { Task, Event, DashboardStats } from '../api';

export const ApiDemo: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load data in parallel
      const [tasksResponse, eventsResponse, statsResponse] = await Promise.all([
        TaskService.getTasks({ page: 1, page_size: 5 }),
        EventService.getEvents({ page: 1, page_size: 5 }),
        DashboardService.getDashboardStats(),
      ]);

      setTasks(tasksResponse.data);
      setEvents(eventsResponse.data);
      setStats(statsResponse);
    } catch (err) {
      setError(ApiErrorHandler.getUserFriendlyMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createSampleTask = async () => {
    setLoading(true);
    setError(null);

    try {
      const newTask = await TaskService.createTask({
        title: `Sample Task ${Date.now()}`,
        description: 'This is a sample task created from the demo',
        due_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
      });

      setTasks(prev => [newTask, ...prev.slice(0, 4)]); // Keep only 5 tasks
    } catch (err) {
      setError(ApiErrorHandler.getUserFriendlyMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createSampleEvent = async () => {
    setLoading(true);
    setError(null);

    try {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const startTime = new Date(tomorrow.setHours(10, 0, 0, 0));
      const endTime = new Date(tomorrow.setHours(11, 0, 0, 0));

      const newEvent = await EventService.createEvent({
        title: `Sample Event ${Date.now()}`,
        description: 'This is a sample event created from the demo',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
      });

      setEvents(prev => [newEvent, ...prev.slice(0, 4)]); // Keep only 5 events
    } catch (err) {
      setError(ApiErrorHandler.getUserFriendlyMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const toggleTaskStatus = async (task: Task) => {
    setLoading(true);
    setError(null);

    try {
      const updatedTask = await TaskService.toggleTaskStatus(task);
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
    } catch (err) {
      setError(ApiErrorHandler.getUserFriendlyMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (loading && !tasks.length && !events.length) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">API Client Demo</h1>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-800">{error}</p>
          <button
            onClick={loadData}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Stats Section */}
      {stats && (
        <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900">Tasks</h3>
            <p className="text-2xl font-bold text-blue-600">{stats.total_tasks}</p>
            <p className="text-sm text-blue-700">
              {stats.completed_tasks} completed, {stats.pending_tasks} pending
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900">Events</h3>
            <p className="text-2xl font-bold text-green-600">{stats.total_events}</p>
            <p className="text-sm text-green-700">
              {stats.upcoming_events} upcoming
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-red-900">Overdue</h3>
            <p className="text-2xl font-bold text-red-600">{stats.overdue_tasks}</p>
            <p className="text-sm text-red-700">tasks overdue</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tasks Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Tasks</h2>
            <button
              onClick={createSampleTask}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Task'}
            </button>
          </div>

          <div className="space-y-3">
            {tasks.map(task => (
              <div
                key={task.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className={`font-medium ${task.status === 'completed' ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {task.title}
                    </h3>
                    {task.description && (
                      <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                    )}
                    {task.due_date && (
                      <p className="text-xs text-gray-500 mt-2">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleTaskStatus(task)}
                    disabled={loading}
                    className={`ml-4 px-3 py-1 text-xs rounded-full ${
                      task.status === 'completed'
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    } disabled:opacity-50`}
                  >
                    {task.status === 'completed' ? 'Reopen' : 'Complete'}
                  </button>
                </div>
              </div>
            ))}

            {tasks.length === 0 && (
              <p className="text-gray-500 text-center py-8">No tasks found</p>
            )}
          </div>
        </div>

        {/* Events Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Events</h2>
            <button
              onClick={createSampleEvent}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Event'}
            </button>
          </div>

          <div className="space-y-3">
            {events.map(event => (
              <div
                key={event.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                <h3 className="font-medium text-gray-900">{event.title}</h3>
                {event.description && (
                  <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                )}
                <div className="text-xs text-gray-500 mt-2">
                  <p>Start: {new Date(event.start_time).toLocaleString()}</p>
                  <p>End: {new Date(event.end_time).toLocaleString()}</p>
                </div>
              </div>
            ))}

            {events.length === 0 && (
              <p className="text-gray-500 text-center py-8">No events found</p>
            )}
          </div>
        </div>
      </div>

      {/* Refresh Button */}
      <div className="mt-8 text-center">
        <button
          onClick={loadData}
          disabled={loading}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50"
        >
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
    </div>
  );
};