import { useState, useEffect, useMemo, useCallback } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { CalendarView } from "../components/calendar-view";
import { EventModal } from "../components/event-modal";
import { TaskList } from "../components/task-list";
import { EventList } from "../components/event-list";
import { TaskModal } from "../components/task-modal";
import { MaterialCommunityIcons } from "@expo/vector-icons"; // Using MaterialCommunityIcons for CalendarDays
import { useThemeColor } from "@/hooks/use-theme-color";

import {
  getEventsByMonth,
  saveEvent,
  deleteEvent,
  getTasksForMonth,
  saveTask,
} from "../api";
import { type Event, type Task } from "../types";

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setEventIsModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskIsModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchEvents = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // JS months are 0-indexed
      const eventsData = await getEventsByMonth(year, month);
      if (eventsData && Array.isArray(eventsData.events)) {
        setEvents(eventsData.events);
      } else {
        setEvents([]);
      }
    } catch (error) {
      console.error("Failed to fetch events:", error);
      setEvents([]);
    }
  }, [currentDate]);

  const deletedEvent = async (id: number) => {
    try {
      if (id) {
        const eventDeleted = await deleteEvent(id);
        if (eventDeleted.ok) {
          setEvents(events.filter((event) => event.id !== id));
        }
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const fetchTasks = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const tasksData = await getTasksForMonth(year, month);
      if (tasksData && Array.isArray(tasksData.data)) {
        setTasks(tasksData.data);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTasks([]);
    }
  }, [currentDate]);

  useEffect(() => {
    const fetch_data = async () => {
      try {
        await Promise.all([fetchEvents(), fetchTasks()]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetch_data();
  }, [currentDate, fetchEvents, fetchTasks]);

  const selectedDayEvents = useMemo(
    () =>
      selectedDate
        ? events.filter((event) => {
            const eventDate = new Date(event.start_time);
            return (
              eventDate.getFullYear() === selectedDate.getFullYear() &&
              eventDate.getMonth() === selectedDate.getMonth() &&
              eventDate.getDate() === selectedDate.getDate()
            );
          })
        : [],
    [events, selectedDate],
  );

  const selectedDayTasks = useMemo(
    () =>
      selectedDate
        ? tasks.filter((task) => {
            const taskDate = new Date(task.due_date);
            return (
              taskDate.getFullYear() === selectedDate.getFullYear() &&
              taskDate.getMonth() === selectedDate.getMonth() &&
              taskDate.getDate() === selectedDate.getDate()
            );
          })
        : [],
    [tasks, selectedDate],
  );

  const groupedEvents = useMemo(
    () =>
      events.reduce(
        (acc, event) => {
          const date = new Date(event.start_time).toDateString();
          if (!acc[date]) {
            acc[date] = [] as Event[];
          }
          acc[date].push(event);
          return acc;
        },
        {} as Record<string, Event[]>,
      ),
    [events],
  );

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1),
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1),
    );
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleSaveEvent = async (eventData: {
    title: string;
    startTime: string;
    endTime: string;
    description: string;
  }) => {
    if (!selectedDate) return;

    const [startHours, startMinutes] = eventData.startTime
      .split(":")
      .map(Number);
    const startDate = new Date(selectedDate);
    startDate.setHours(startHours);
    startDate.setMinutes(startMinutes);

    const [endHours, endMinutes] = eventData.endTime.split(":").map(Number);
    const endDate = new Date(selectedDate);
    endDate.setHours(endHours);
    endDate.setMinutes(endMinutes);
    const newEvent = {
      title: eventData.title,
      description: eventData.description,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
    };
    try {
      await saveEvent(newEvent);
      fetchEvents(); // Refrescar eventos
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleDeleteEvent = (id: number) => {
    deletedEvent(id);
  };

  const handleSaveTask = async (tasksData: {
    title: string;
    description: string;
    due_date: string;
  }) => {
    if (!selectedDate) return;

    const [dueHours, dueMinutes] = tasksData.due_date.split(":").map(Number);
    const startDate = new Date(selectedDate);
    startDate.setHours(dueHours);
    startDate.setMinutes(dueMinutes);

    const newTask = {
      title: tasksData.title,
      description: tasksData.description,
      due_date: startDate.toISOString(),
      status: "pending",
    };
    try {
      await saveTask(newTask);
      fetchTasks(); // Refrescar eventos
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  const handleToggleTask = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === "completed" ? "pending" : "completed",
            }
          : task,
      ),
    );
  };

  const handleDeleteTask = (id: number) => {
    setTasks(Array.from(tasks).filter((task) => task.id !== id));
  };

  const handleOpenEventModal = () => {
    if (!selectedDate) {
      setSelectedDate(currentDate);
    }
    setEventIsModalOpen(true);
  };

  const handleOpenTaskModal = () => {
    if (!selectedDate) {
      setSelectedDate(currentDate);
    }
    setTaskIsModalOpen(true);
  };

  const background = useThemeColor({}, "background");
  const textPrimary = "#11181C"; // Example color, adjust based on theme or constants
  const textSecondary = "#6B7280"; // Example color, adjust based on theme or constants
  const greenPrimary = "#22C55E"; // Example color, adjust based on theme or constants

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: background,
      padding: 16, // p-4 md:p-8
    },
    maxWidthWrapper: {
      maxWidth: 768, // max-w-7xl (80rem / 16 = 5 * 16 = 80rem, 16rem = 256px, 80rem = 1280px. For mobile, maybe smaller or dynamic)
      width: "100%",
      marginHorizontal: "auto", // mx-auto
    },
    header: {
      marginBottom: 32, // mb-8
    },
    headerContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12, // gap-3
      marginBottom: 12, // mb-3
    },
    iconWrapper: {
      padding: 8, // p-2
      backgroundColor: "#D1FAE5", // green-100
      borderRadius: 8, // rounded-lg
    },
    headerTitle: {
      fontSize: 30, // text-4xl (scaled down for mobile)
      fontWeight: "600", // font-medium
      color: textPrimary, // gray-800
    },
    headerSubtitle: {
      color: textSecondary, // gray-600
      marginTop: 4, // mt-1
    },
    mainLayout: {
      flexDirection: "column", // grid lg:grid-cols-3 changed to column for mobile
      gap: 32, // gap-8
    },
    calendarSection: {
      // lg:col-span-2, full width for mobile
    },
    calendarContainer: {
      backgroundColor: "#FFFFFF", // bg-white
      borderRadius: 8, // rounded-lg
      shadowColor: "#000", // shadow-sm
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
      borderWidth: 1,
      borderColor: "#E2E8F0", // border border-gray-200
      padding: 24, // p-6
    },
    asideSection: {
      // lg:col-span-1, full width for mobile
    },
    taskListContainer: {
      backgroundColor: "#FFFFFF", // bg-white
      borderRadius: 8, // rounded-lg
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
      borderWidth: 1,
      borderColor: "#E2E8F0",
      padding: 24, // p-6
    },
    eventListMargin: {
      marginTop: 20, // my-5
      shadowColor: "#000", // shadow-sm
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.2,
      shadowRadius: 1.41,
      elevation: 2,
    },
  });

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={styles.maxWidthWrapper}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons
                name="calendar-range"
                size={32}
                color={greenPrimary}
              />
            </View>
            <View>
              <Text style={styles.headerTitle}>Mi Calendario</Text>
              <Text style={styles.headerSubtitle}>
                Organiza tus eventos y tareas en un solo lugar
              </Text>
            </View>
          </View>
        </View>

        {/* Main Layout */}
        <View style={styles.mainLayout}>
          {/* Calendar Section */}
          <View style={styles.calendarSection}>
            <View style={styles.calendarContainer}>
              <CalendarView
                currentDate={currentDate}
                selectedDate={selectedDate}
                events={groupedEvents}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onDateClick={handleDateClick}
              />
            </View>
          </View>

          {/* Tasks Section */}
          <View style={styles.asideSection}>
            <View style={styles.taskListContainer}>
              <TaskList
                tasks={selectedDayTasks}
                onAddTask={handleOpenTaskModal}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
              />
            </View>
            <View style={styles.eventListMargin}>
              <EventList
                selectedDate={selectedDate}
                events={selectedDayEvents}
                onDeleteEvent={handleDeleteEvent}
                onAddEvent={handleOpenEventModal}
              />
            </View>
          </View>
        </View>
      </View>

      {/* Modal para eventos */}
      <EventModal
        isOpen={isEventModalOpen}
        selectedDate={selectedDate}
        onClose={() => setEventIsModalOpen(false)}
        onSave={handleSaveEvent}
      />

      <TaskModal
        isOpen={isTaskModalOpen}
        selectedDate={selectedDate}
        onClose={() => setTaskIsModalOpen(false)}
        onSave={handleSaveTask}
      ></TaskModal>
    </ScrollView>
  );
}
