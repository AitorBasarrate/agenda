import Constants from "expo-constants";
import { Platform } from "react-native";

const stripTrailingSlashes = (url: string) => url.replace(/\/+$/, "");

const getExpoHost = () => {
  const hostUri = Constants.expoConfig?.hostUri;
  if (!hostUri) {
    return null;
  }

  return hostUri.split(":")[0];
};

const resolveApiBaseUrl = () => {
  const explicitBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  if (explicitBaseUrl) {
    return stripTrailingSlashes(explicitBaseUrl);
  }

  // Keep compatibility with previous config while preferring Expo public vars.
  const explicitHost = process.env.EXPO_PUBLIC_APP_URL ?? process.env.APP_URL;
  if (explicitHost) {
    return `http://${explicitHost}:8080/api`;
  }

  const expoHost = getExpoHost();
  if (expoHost) {
    return `http://${expoHost}:8080/api`;
  }

  // Android emulators map host machine localhost to 10.0.2.2.
  if (Platform.OS === "android") {
    return "http://10.0.2.2:8080/api";
  }

  return "http://localhost:8080/api";
};

const API_BASE_URL = resolveApiBaseUrl();

const buildFetchError = async (response: Response, message: string) => {
  const body = await response.text();
  throw new Error(
    `${message} (${response.status} ${response.statusText}) url=${response.url} body=${body}`,
  );
};

// Events
export const getEvents = async () => {
  const response = await fetch(`${API_BASE_URL}/events`);
  if (!response.ok) {
    await buildFetchError(response, "Failed to fetch events");
  }
  return response.json();
};

export const getEventsByMonth = async (year: number, month: number) => {
  const response = await fetch(
    `${API_BASE_URL}/events?year=${year}&month=${month}`,
  );
  if (!response.ok) {
    await buildFetchError(response, "Failed to fetch this month's events");
  }
  return response.json();
};

export const saveEvent = async (event: {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(event),
  });

  if (!response.ok) {
    await buildFetchError(response, "Failed to save event");
  }

  return response.json();
};

export const deleteEvent = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    await buildFetchError(response, "Failed to delete event");
  }
  return response;
};

// Tasks
export const getTasksForMonth = async (year: number, month: number) => {
  const due_after = new Date(Date.UTC(year, month - 1)).toISOString();
  const due_before = new Date(Date.UTC(year, month)).toISOString();

  const response = await fetch(
    `${API_BASE_URL}/tasks?due_after=${due_after}&due_before=${due_before}`,
  );
  if (!response.ok) {
    await buildFetchError(response, `Failed to fetch tasks of ${month}/${year}`);
  }
  return response.json();
};

export const saveTask = async (task: {
  title: string;
  description: string;
  due_date: string;
  status: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    await buildFetchError(response, "Failed to save task");
  }

  return response.json();
};

export const deleteTask = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    await buildFetchError(response, "Failed to delete task");
  }
  return response;
};

export const updateTask = async (
  id: number,
  task: Partial<{ title: string; description: string; due_date: string; status: string }>
) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(task),
  });

  if (!response.ok) {
    await buildFetchError(response, "Failed to update task");
  }

  return response.json();
};
