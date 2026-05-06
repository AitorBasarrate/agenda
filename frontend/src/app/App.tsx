<<<<<<< Updated upstream
import { useState, useEffect, useMemo, useCallback } from "react";
import { CalendarView } from "./components/calendar-view";
import { EventModal } from "./components/event-modal";
import { TaskList } from "./components/task-list";
import { type Event, type Task } from "../types";
import { CalendarDays } from "lucide-react";

import {
  getEventsByMonth,
  saveEvent,
  deleteEvent,
  getTasksForMonth,
  saveTask,
  deleteTask,
  updateTask,
} from "../api";
import { EventList } from "./components/event-list";
import { TaskModal } from "./components/task-modal";

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventModalOpen, setEventIsModalOpen] = useState(false);
  const [isTaskModalOpen, setTaskIsModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
=======
import { useState, useEffect, useCallback, useMemo } from 'react';
import { Calendar as CalendarIcon, Plus, Moon, Sun } from 'lucide-react';
import { CalendarView } from './components/calendar-view';
import { CollapsibleCalendar } from './components/collapsible-calendar';
import { DayList, type DayListTask } from './components/day-list';
import { EventModal } from './components/event-modal';
import { TaskList } from './components/task-list';
import { EventList } from './components/event-list';
import { 
  deleteEvent, 
  getEventsByMonth, 
  getTasksForMonth, 
  saveEvent, 
  saveTask, 
  updateTask, 
  deleteTask as apiDeleteTask 
} from '../api';

interface AppEvent {
  id: number;
  title: string;
  time: string;
  description: string;
  color: string;
  date: string;
}

interface AppTask {
  id: number;
  text: string;
  completed: boolean;
}

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<AppEvent[]>([]);
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState<AppEvent | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
>>>>>>> Stashed changes

  const fetchEvents = useCallback(async () => {
    try {
      const year = currentDate.getFullYear();
<<<<<<< Updated upstream
      const month = currentDate.getMonth() + 1; // JS months are 0-indexed
      const eventsData = await getEventsByMonth(year, month);
      if (eventsData && Array.isArray(eventsData.events)) {
        setEvents(eventsData.events);
=======
      const month = currentDate.getMonth() + 1;
      const eventsData = await getEventsByMonth(year, month);
      
      if (eventsData && Array.isArray(eventsData.events)) {
        // Map backend events to frontend AppEvent format
        const mappedEvents: AppEvent[] = eventsData.events.map((e: any) => {
          const startTime = new Date(e.start_time);
          return {
            id: e.id,
            title: e.title,
            description: e.description,
            time: startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
            color: 'bg-[#80BF41]', // Default color as it's not in backend
            date: `${startTime.getFullYear()}-${startTime.getMonth() + 1}-${startTime.getDate()}`
          };
        });
        setEvents(mappedEvents);
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
        const mappedTasks: AppTask[] = tasksData.data.map((t: any) => ({
          id: t.id,
          text: t.title,
          completed: t.status === 'completed'
        }));
        setTasks(mappedTasks);
      } else {
        setTasks([]);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
      setTasks([]);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchEvents();
    fetchTasks();
  }, [fetchEvents, fetchTasks]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    if (!isMobile) {
      setIsModalOpen(true);
    }
  };

  const handleSaveEvent = async (eventData: Omit<AppEvent, 'id'>) => {
    if (!selectedDate) return;

    try {
      const [hours, minutes] = eventData.time.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(startTime.getHours() + 1);

      await saveEvent({
        title: eventData.title,
        description: eventData.description,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString()
      });

      await fetchEvents();
      setIsModalOpen(false);
      setViewEvent(null);
    } catch (error) {
      console.error("Failed to save event:", error);
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      const response = await deleteEvent(eventId);
      if (response.ok) {
        setEvents(prev => prev.filter(e => e.id !== eventId));
      }
      setViewEvent(null);
    } catch (error) {
      console.error("Failed to delete event:", error);
    }
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
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
=======
  const handleAddTask = async (text: string) => {
    if (!selectedDate) return;

    try {
      await saveTask({
        title: text,
        description: "",
        due_date: selectedDate.toISOString(),
        status: "pending"
      });
      await fetchTasks();
    } catch (error) {
      console.error("Failed to add task:", error);
    }
  };

  const handleToggleTask = async (id: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    try {
      const newCompleted = !task.completed;
      // Optimistic update
      setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: newCompleted } : t));
      
      await updateTask(id, {
        id,
        title: task.text,
        description: "",
        due_date: new Date().toISOString(), // This should ideally be the original due date
        status: newCompleted ? 'completed' : 'pending',
        created_at: "",
        updated_at: ""
      });
    } catch (error) {
      console.error("Failed to toggle task:", error);
      fetchTasks(); // Revert on error
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await apiDeleteTask(id);
      setTasks(prev => prev.filter(task => task.id !== id));
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  };

  const handleEventClick = (event: AppEvent) => {
    setViewEvent(event);
    setIsModalOpen(true);
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
  const handleSaveTask = async (tasksData: {
    title: string;
    description: string;
    due_date: string;
  }) => {
    if (!selectedDate) return;
    const date = new Date(tasksData.due_date);
    const newTask = {
      title: tasksData.title,
      description: tasksData.description,
      due_date: date.toISOString(),
      status: "pending",
    };
=======
  // Memoized grouped events for CalendarView
  const groupedEvents = useMemo(() => {
    const grouped: Record<string, AppEvent[]> = {};
    events.forEach(event => {
      if (!grouped[event.date]) {
        grouped[event.date] = [];
      }
      grouped[event.date].push(event);
    });
    return grouped;
  }, [events]);

  const selectedDateEvents = selectedDate 
    ? events.filter(e => e.date === getDateKey(selectedDate))
    : [];
>>>>>>> Stashed changes

    try {
      await saveTask(newTask);
      fetchTasks(); // Refrescar eventos
    } catch (error) {
      console.error("Failed to save task:", error);
    }
  };

  const handleToggleTask = async (id: number, checked: boolean) => {
    const task = tasks.find(t => t.id === id);
    if (!task) {
      console.error(`Task ${id} not found`);
      return;
    }

    try {
      const updatedTask = { ...task, status: checked ? "completed" : "pending" };
      const response = await updateTask(id, updatedTask);
      setTasks(prev => prev.map(t => (t.id === id ? response : t)));
    } catch (error) {
      console.error("Failed to update task: ", error);
    }
  };

  const handleDeleteTask = async (id: number) => {
    try {
      await deleteTask(id);
      setTasks((prev) => prev.filter((task) => task.id !== id));
    } catch (error) {
      console.error("Failed to delete task: ", error)
    }
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

  return (
<<<<<<< Updated upstream
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CalendarDays className="h-8 w-8 text-green-700" />
=======
    <div className={isDark ? 'dark' : ''}>
      <div
        className={`min-h-screen transition-colors ${
          isDark
            ? 'bg-gradient-to-b from-gray-950 to-gray-900'
            : 'bg-gradient-to-b from-[#E7F2E4] to-[#F2F2F2]'
        }`}
      >
        {/* Desktop Layout */}
        {!isMobile && (
          <>
            {/* Desktop Header */}
            <header className="px-8 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    <CalendarIcon className="w-8 h-8 text-[#80BF41]" />
                    <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      Mi Calendario
                    </h1>
                  </div>
                  <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Organiza tus eventos y tareas en un solo lugar
                  </p>
                </div>
                <button
                  onClick={toggleTheme}
                  className={`h-10 w-10 rounded-full flex items-center justify-center shadow-lg transition-colors ${
                    isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-100'
                  }`}
                >
                  {isDark ? (
                    <Sun className="h-5 w-5 text-[#B1D923]" />
                  ) : (
                    <Moon className="h-5 w-5 text-gray-600" />
                  )}
                </button>
              </div>
            </header>

            {/* Desktop Content */}
            <div className="px-8 pb-8">
              <div className="grid grid-cols-3 gap-6">
                {/* Calendar - 2 columns */}
                <div className="col-span-2">
                  <CalendarView
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    events={groupedEvents}
                    onDateClick={handleDateClick}
                    onMonthChange={handleMonthChange}
                    isMobile={false}
                    isDark={isDark}
                  />
                </div>

                {/* Sidebar - 1 column */}
                <div className="space-y-6">
                  {/* Task List */}
                  <TaskList
                    tasks={tasks}
                    onAddTask={handleAddTask}
                    onToggleTask={handleToggleTask}
                    onDeleteTask={handleDeleteTask}
                    isDark={isDark}
                    isMobile={false}
                  />

                  {/* Event List */}
                  <EventList
                    events={selectedDateEvents}
                    selectedDate={selectedDate}
                    onEventClick={handleEventClick}
                    isDark={isDark}
                    isMobile={false}
                  />
                </div>
              </div>
>>>>>>> Stashed changes
            </div>
            <div>
              <h1 className="text-4xl font-medium text-gray-800">
                Mi Calendario
              </h1>
              <p className="text-gray-600 mt-1">
                Organiza tus eventos y tareas en un solo lugar
              </p>
            </div>
<<<<<<< Updated upstream
=======

            {/* Collapsible Calendar */}
            <CollapsibleCalendar
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={groupedEvents}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onDateClick={handleDateClick}
              onSelectedDateChange={setSelectedDate}
              isDark={isDark}
            />

            {/* Day list (events and tasks) */}
            <DayList
              selectedDate={selectedDate}
              events={selectedDateEvents}
              tasks={dayListTasks}
              onDeleteEvent={handleDeleteEvent}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              isDark={isDark}
            />

            {/* Floating action button */}
            <button
              onClick={() => setIsModalOpen(true)}
              className="fixed bottom-6 right-6 z-40 h-14 w-14 rounded-full bg-[#80BF41] hover:bg-[#B1D923] shadow-xl flex items-center justify-center transition-all active:scale-95 hover:shadow-2xl"
            >
              <Plus className="h-6 w-6 text-white" />
            </button>
>>>>>>> Stashed changes
          </div>
        </header>

        {/* Main Layout */}
        <main className="grid lg:grid-cols-3 gap-8">
          {/* Calendar Section - 2 columns */}
          <section className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <CalendarView
                currentDate={currentDate}
                selectedDate={selectedDate}
                events={groupedEvents}
                onPrevMonth={handlePrevMonth}
                onNextMonth={handleNextMonth}
                onDateClick={handleDateClick}
              />
            </div>
          </section>

          {/* Tasks Section - 1 column */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <TaskList
                tasks={selectedDayTasks}
                onAddTask={handleOpenTaskModal}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>
            <div className="my-5 shadow-sm">
              <EventList
                selectedDate={selectedDate}
                events={selectedDayEvents}
                onDeleteEvent={handleDeleteEvent}
                onAddEvent={handleOpenEventModal}
              />
            </div>
          </aside>
        </main>
      </div>

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
    </div>
  );
}

export default App;
