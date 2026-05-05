import "../../global.css";
import { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { CollapsibleCalendar } from "../components/collapsible-calendar";
import { DayList } from "../components/day-list";
import { EventModal } from "../components/event-modal";
import { Colors } from "../constants/theme";
import { useSettings } from "@/contexts/settings-context";

import {
  getEventsByMonth,
  saveEvent,
  deleteEvent,
  getTasksForMonth,
  saveTask,
  updateTask,
  deleteTask,
} from "../api";
import { type Event, type Task } from "../types";

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [isEventModalOpen, setEventIsModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const { settings, updateSettings } = useSettings();
  const isDarkMode = settings.theme === "dark";

  const fetchEvents = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
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
    Promise.all([fetchEvents(), fetchTasks()]).catch((error) =>
      console.error("Failed to fetch data:", error)
    );
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
    [events, selectedDate]
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
    [tasks, selectedDate]
  );

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    );
  };

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
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
      fetchEvents();
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleDeleteEvent = async (id: number) => {
    try {
      const response = await deleteEvent(id);
      if (response.ok) {
        setEvents(events.filter((event) => event.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleAddTask = async (title: string) => {
    if (!selectedDate) return;

    const newTask = {
      title,
      description: "",
      due_date: selectedDate.toISOString(),
      status: "pending",
    };
    try {
      await saveTask(newTask);
      fetchTasks();
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  const handleToggleTask = async (id: number) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    const newStatus = task.status === "completed" ? "pending" : "completed";
    setTasks(
      tasks.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
    );

    try {
      await updateTask(id, { status: newStatus });
    } catch (error) {
      console.error("Failed to toggle task:", error);
      setTasks(tasks);
    }
  };

  const handleDeleteTask = async (id: number) => {
    setTasks(tasks.filter((task) => task.id !== id));
    try {
      await deleteTask(id);
    } catch (error) {
      console.error("Failed to delete task:", error);
      fetchTasks();
    }
  };

  const toggleTheme = () => {
    updateSettings({ theme: isDarkMode ? "light" : "dark" });
  };

  return (
    <SafeAreaView
      className={`flex-1 pt-2 pb-4 ${
        isDarkMode ? "bg-gray-900" : "bg-lima"
      }`}
      edges={["top", "bottom"]}
    >
      {/* Theme toggle button - fixed top right */}
      <View className="absolute top-14 right-4 z-50">
        <TouchableOpacity
          onPress={toggleTheme}
          className={`h-10 w-10 rounded-full items-center justify-center shadow-lg ${
            isDarkMode ? "bg-gray-800" : "bg-white"
          }`}
        >
          <MaterialCommunityIcons
            name={isDarkMode ? "white-balance-sunny" : "moon-waning-crescent"}
            size={20}
            color={isDarkMode ? "#B1D923" : "#4B5563"}
          />
        </TouchableOpacity>
      </View>

      {/* Collapsible Calendar */}
      <CollapsibleCalendar
        currentDate={currentDate}
        selectedDate={selectedDate}
        events={events}
        onPrevMonth={handlePrevMonth}
        onNextMonth={handleNextMonth}
        onDateClick={handleDateClick}
        onSelectedDateChange={setSelectedDate}
        isDark={isDarkMode}
      />

      {/* Day list (events and tasks) */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <DayList
          selectedDate={selectedDate}
          events={selectedDayEvents}
          tasks={selectedDayTasks}
          onDeleteEvent={handleDeleteEvent}
          onAddTask={handleAddTask}
          onToggleTask={handleToggleTask}
          onDeleteTask={handleDeleteTask}
          isDark={isDarkMode}
        />
      </ScrollView>

      {/* Floating action button */}
      <TouchableOpacity
        onPress={() => {
          if (!selectedDate) setSelectedDate(new Date());
          setEventIsModalOpen(true);
        }}
        className="absolute bottom-6 right-6 h-14 w-14 rounded-full bg-verde items-center justify-center shadow-xl z-40"
      >
        <MaterialCommunityIcons name="plus" size={28} color="white" />
      </TouchableOpacity>

      {/* Event Modal */}
      <EventModal
        isOpen={isEventModalOpen}
        selectedDate={selectedDate}
        onClose={() => setEventIsModalOpen(false)}
        onSave={handleSaveEvent}
      />
    </SafeAreaView>
  );
}
