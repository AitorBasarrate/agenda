import { describe, it, expect, vi, beforeEach } from "vitest";
import * as api from "../../api";
import { Task } from "../../types";

const API_BASE_URL = "http://localhost:8080/api";

describe("API Service", () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.restoreAllMocks();
    global.fetch = vi.fn();
  });

  // --- Event API Tests ---

  describe("Events API", () => {
    it("getEvents should fetch events successfully", async () => {
      const mockEvents = [{ id: 1, title: "Event 1" }];
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEvents),
      });

      const events = await api.getEvents();
      expect(events).toEqual(mockEvents);
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/events`);
    });

    it("getEvents should throw an error if fetching fails", async () => {
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(api.getEvents()).rejects.toThrow("Failed to fetch events");
    });

    it("getEventsByMonth should fetch events by month successfully", async () => {
      const mockEvents = [{ id: 1, title: "Monthly Event" }];
      const year = 2026;
      const month = 4; // April
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockEvents),
      });

      const events = await api.getEventsByMonth(year, month);
      expect(events).toEqual(mockEvents);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/events?year=${year}&month=${month}`,
      );
    });

    it("getEventsByMonth should throw an error if fetching fails", async () => {
      const year = 2026;
      const month = 4;
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(api.getEventsByMonth(year, month)).rejects.toThrow(
        "Failed to fetch this month's events",
      );
    });

    it("saveEvent should save an event successfully", async () => {
      const newEvent = {
        title: "New Event",
        description: "Desc",
        start_time: "2026-04-25T10:00:00Z",
        end_time: "2026-04-25T11:00:00Z",
      };
      const savedEvent = { id: 2, ...newEvent };
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(savedEvent),
      });

      const result = await api.saveEvent(newEvent);
      expect(result).toEqual(savedEvent);
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newEvent),
      });
    });

    it("saveEvent should throw an error if saving fails", async () => {
      const newEvent = {
        title: "New Event",
        description: "Desc",
        start_time: "2026-04-25T10:00:00Z",
        end_time: "2026-04-25T11:00:00Z",
      };
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(api.saveEvent(newEvent)).rejects.toThrow(
        "Failed to save event",
      );
    });

    it("deleteEvent should delete an event successfully", async () => {
      const eventId = 1;
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const response = await api.deleteEvent(eventId);
      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/events/${eventId}`,
        {
          method: "DELETE",
        },
      );
    });

    it("deleteEvent should throw an error if deleting fails", async () => {
      const eventId = 1;
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(api.deleteEvent(eventId)).rejects.toThrow(
        "Failed to delete event",
      );
    });
  });

  // --- Task API Tests ---

  describe("Tasks API", () => {
    it("getTasksForMonth should fetch tasks successfully", async () => {
      const mockTasks = [{ id: 1, title: "Task 1" }];
      const year = 2026;
      const month = 4; // April
      const due_after = new Date(Date.UTC(year, month - 1)).toISOString();
      const due_before = new Date(Date.UTC(year, month)).toISOString();
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockTasks),
      });

      const tasks = await api.getTasksForMonth(year, month);
      expect(tasks).toEqual(mockTasks);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/tasks?due_after=${due_after}&due_before=${due_before}`,
      );
    });

    it("getTasksForMonth should throw an error if fetching fails", async () => {
      const year = 2026;
      const month = 4;
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(api.getTasksForMonth(year, month)).rejects.toThrow(
        `Failed to fetch tasks of ${month}/${year}`,
      );
    });

    it("saveTask should save a task successfully", async () => {
      const newTask = {
        title: "New Task",
        description: "Desc",
        due_date: "2026-04-25T10:00:00Z",
        status: "pending",
      };
      const savedTask = { id: 1, ...newTask };
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(savedTask),
      });

      const result = await api.saveTask(newTask);
      expect(result).toEqual(savedTask);
      expect(global.fetch).toHaveBeenCalledWith(`${API_BASE_URL}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newTask),
      });
    });

    it("saveTask should throw an error if saving fails", async () => {
      const newTask = {
        title: "New Task",
        description: "Desc",
        due_date: "2026-04-25T10:00:00Z",
        status: "pending",
      };
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(api.saveTask(newTask)).rejects.toThrow(
        "Failed to save task",
      );
    });

    it("updateTask should update a task successfully", async () => {
      const taskId = 1;
      const updatedTask: Task = {
        id: taskId,
        title: "Updated Task",
        description: "Updated Desc",
        due_date: "2026-04-26T10:00:00Z",
        status: "completed",
        created_at: "2026-04-25T10:00:00Z",
        updated_at: "2026-04-25T11:00:00Z",
      };
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(updatedTask),
      });

      const result = await api.updateTask(taskId, updatedTask);
      expect(result).toEqual(updatedTask);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/tasks/${taskId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTask),
        },
      );
    });

    it("updateTask should throw an error if updating fails", async () => {
      const taskId = 1;
      const updatedTask: Task = {
        id: taskId,
        title: "Updated Task",
        description: "Updated Desc",
        due_date: "2026-04-26T10:00:00Z",
        status: "completed",
        created_at: "2026-04-25T10:00:00Z",
        updated_at: "2026-04-25T11:00:00Z",
      };
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(api.updateTask(taskId, updatedTask)).rejects.toThrow(
        "Failed to update task",
      );
    });

    it("deleteTask should delete a task successfully", async () => {
      const taskId = 1;
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      const response = await api.deleteTask(taskId);
      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        `${API_BASE_URL}/tasks/${taskId}`,
        {
          method: "DELETE",
        },
      );
    });

    it("deleteTask should throw an error if deleting fails", async () => {
      const taskId = 1;
      // @ts-expect-error Mocking fetch
      global.fetch.mockResolvedValueOnce({
        ok: false,
      });

      await expect(api.deleteTask(taskId)).rejects.toThrow(
        "Failed to delete task",
      );
    });
  });
});
