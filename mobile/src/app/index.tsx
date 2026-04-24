import "../../global.css";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Button,
  Pressable,
  TouchableOpacity,
} from "react-native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { CalendarView } from "../components/calendar-view";
import { EventModal } from "../components/event-modal";
import { TaskList } from "../components/task-list";
import { EventList } from "../components/event-list";
import { TaskModal } from "../components/task-modal";
import { SettingsModal } from "../components/settings-modal";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/use-theme-color";

import {
  getEventsByMonth,
  saveEvent,
  deleteEvent,
  getTasksForMonth,
  saveTask,
} from "../api";
import { type Event, type Task } from "../types";
import { Colors } from "../constants/theme";
import { useSettings } from "@/contexts/settings-context";

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setEventIsModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskIsModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState<"calendar" | "tasks" | "events">(
    "calendar",
  );
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const { settings, updateSettings } = useSettings();
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === "dark";
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

  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const background = themeColors.background;
  const primary = themeColors.primary;
  const textColor = themeColors.text;
  const textMuted = themeColors.textMuted;

  return (
    <View className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
      {/* Header */}
      <View
        className={`${isDarkMode ? "bg-gray-900/95" : "bg-white/95"} border-b ${isDarkMode ? "border-gray-800" : "border-gray-200"}`}
      >
        <View className="px-4 py-3">
          <View className="flex items-start gap-2">
            <MaterialCommunityIcons
              name="calendar-range"
              size={32}
              className={`${isDarkMode ? "text-verde" : "text-verde"}`}
            />
            <Text
              className={`text-xl ${isDarkMode ? "text-white" : "text-gray-800"}`}
            >
              {activeTab === "calendar" && "Calendario"}
              {activeTab === "tasks" && "Tareas"}
              {activeTab === "events" && "Eventos"}
            </Text>
          </View>
          <View className="ml-3"></View>
          <Pressable
            onPress={() => setIsSettingsOpen(true)}
            hitSlop={12}
            accessibilityLabel="Abrir ajustes"
            accessibilityRole="button"
          >
            <MaterialCommunityIcons
              name="cog-outline"
              size={24}
              color={themeColors.text}
            />
          </Pressable>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        className={`flex-1 ${isDarkMode ? "bg-gray-900" : "bg-gradient-to-br from-lima to-blanco"}`}
      >
        <View className="p-4 pb-20">
          {activeTab === "calendar" && (
            <CalendarView
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={groupedEvents}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onDateClick={handleDateClick}
            />
          )}

          {activeTab === "tasks" && (
            <TaskList
              tasks={selectedDayTasks}
              onAddTask={handleOpenTaskModal}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
            />
          )}

          {activeTab === "events" && (
            <EventList
              selectedDate={selectedDate}
              events={selectedDayEvents}
              onDeleteEvent={handleDeleteEvent}
              onAddEvent={handleOpenEventModal}
            />
          )}
        </View>
      </ScrollView>

      {/* FAB Button */}
      {activeTab === "calendar" && (
        <TouchableOpacity
          onPress={() => {
            setSelectedDate(selectedDate || new Date());
            setEventIsModalOpen(true);
          }}
          className={`absolute bottom-20 right-4 h-14 w-14 rounded-full shadow-lg flex items-center justify-center ${
            isDarkMode
              ? "bg-verde"
              : "bg-verde"
          }`}
        >
          <MaterialCommunityIcons
            name="plus"
            size={36}
            color="white"
          ></MaterialCommunityIcons>
        </TouchableOpacity>
      )}

      {/* Bottom Navigation Bar */}
      <View
        className={`${isDarkMode ? "bg-gray-900/95 border-gray-800" : "bg-white/95 border-gray-200"} border-t`}
      >
        <View className="flex-row items-center justify-between gap-1 px-2 py-2">
          <TouchableOpacity
            onPress={() => setActiveTab("calendar")}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg
              ${
                activeTab === "calendar"
                  ? isDarkMode
                    ? "bg-verde/20"
                    : "bg-verde/10"
                  : ""
              }`}
          >
            <MaterialCommunityIcons
              name="calendar-range"
              color={activeTab === "calendar" ? themeColors.primary : themeColors.textMuted}
            />
            <Text className={`text-xs font-medium ${
              activeTab === "calendar"
                ? "text-verde"
                : isDarkMode
                  ? "text-gray-500"
                  : "text-gray-600"
            }`}>
              Calendario
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("tasks")}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg
              ${
                activeTab === "tasks"
                  ? isDarkMode
                    ? "bg-verde/20"
                    : "bg-verde/10"
                  : ""
              }`}
          >
            <MaterialCommunityIcons
              name="check-all"
              color={activeTab === "tasks" ? themeColors.primary : themeColors.textMuted}
            />
            <Text className={`text-xs font-medium ${
              activeTab === "tasks"
                ? "text-verde"
                : isDarkMode
                  ? "text-gray-500"
                  : "text-gray-600"
            }`}>
              Tareas
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab("events")}
            className={`flex-1 flex items-center justify-center py-2 px-3 rounded-lg
              ${
                activeTab === "events"
                  ? isDarkMode
                    ? "bg-verde/20"
                    : "bg-verde/10"
                  : ""
              }`}
          >
            <MaterialCommunityIcons
              name="clock-outline"
              color={activeTab === "events" ? themeColors.primary : themeColors.textMuted}
            />
            <Text className={`text-xs font-medium ${
              activeTab === "events"
                ? "text-verde"
                : isDarkMode
                  ? "text-gray-500"
                  : "text-gray-600"
            }`}>
              Eventos
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Modals */}
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
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={updateSettings}
      />
    </View>
  );
}
