const API_BASE_URL = "http://localhost:8080/api";

// Events
export const getEvents = async () => {
  const response = await fetch(`${API_BASE_URL}/events`);
  if (!response.ok) {
    throw new Error("Failed to fetch events");
  }
  return response.json();
};

export const getEventsByMonth = async (year: number, month: number) => {
  const response = await fetch(
    `${API_BASE_URL}/events?year=${year}&month=${month}`,
  );
  if (!response.ok) {
    throw new Error("Failed to fetch this month's events");
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
    throw new Error("Failed to save event");
  }

  return response.json();
};

export const deleteEvent = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/events/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete event");
  }
  return response;
};

// Tasks
export const getTasks = async () => {
  const response = await fetch(`${API_BASE_URL}/tasks`);
  if (!response.ok) {
    throw new Error("Failed to fetch tasks");
  }
  return response.json();
};

export const getTasksForMonth = async (year: number, month: number) => {
  const response = await fetch(
    `${API_BASE_URL}/tasks?year=${year}&month=${month}`,
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch tasks of ${month}/${year}`);
  }
  return response.json();
};

export const saveTask = async (task: {
  title: string;
  description: string;
  dueDate: string;
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
    throw new Error("Failed to save task");
  }

  return response.json();
};

export const deleteTask = async (id: number) => {
  const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    throw new Error("Failed to delete task");
  }
  return response;
};
