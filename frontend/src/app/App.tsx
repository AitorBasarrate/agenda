import { useState, useEffect } from "react";
import { CalendarView } from "./components/calendar-view";
import { EventModal } from "./components/event-modal";
import { TaskList } from "./components/task-list";
import { type Event, type Task } from "../types";
import { CalendarDays } from "lucide-react";

import { getEvents, getTasks, saveEvent } from "../api";
import { EventList } from "./components/event-list";



function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const fetchEvents = async () => {
    try {
      const eventsData = await getEvents();
      setEvents(eventsData);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    }
  };

  useEffect(() => {
    const fetch_data = async () => {
      try {
        await Promise.all([
          fetchEvents(),
          (async () => {
            const tasksData = await getTasks();
            setTasks(tasksData);
          })(),
        ]);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetch_data();
  }, []);

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  let groupedEvents = null
  if (events) {
    groupedEvents = Array.from(events).reduce((acc, event) => {
      const date = new Date(event.start_time).toDateString();
      if (!acc[date]) {
        acc[date] = [] as Event[];
      }
      acc[date].push(event);
      return acc;
    }, {} as Record<string, Event[]>);
  }


  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (eventData: {
    title: string;
    startTime: string;
    endTime: string;
    description: string;
  }) => {
    if (!selectedDate) return;

    const [startHours, startMinutes] = eventData.startTime.split(':').map(Number);
    const startDate = new Date(selectedDate);
    startDate.setHours(startHours);
    startDate.setMinutes(startMinutes);

    const [endHours, endMinutes] = eventData.endTime.split(':').map(Number);
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
      console.error('Failed to save event:', error);
    }
  };

  const handleDeleteEvent = (id: number) => {
    setEvents(events.filter((event) => event.id !== id));
  };

  const handleAddTask = (title: string) => {
    const newTask: Task = {
      id: Date.now(),
      title,
      description: "",
      due_date: null,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setTasks([...tasks, newTask]);
  };

  const selectedDayEvents = selectedDate
  ? events.filter((event) => event.date === getDateKey(selectedDate))
  : [];

  const handleToggleTask = (id: number) => {
    setTasks(
      tasks.map((task) =>
        task.id === id
          ? {
              ...task,
              status: task.status === "completed" ? "pending" : "completed",
            }
          : task
      )
    );
  };

  const handleDeleteTask = (id: number) => {
    setTasks(Array.from(tasks).filter((task) => task.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <CalendarDays className="h-8 w-8 text-green-700" />
            </div>
            <div>
              <h1 className="text-4xl font-medium text-gray-800">Mi Calendario</h1>
              <p className="text-gray-600 mt-1">
                Organiza tus eventos y tareas en un solo lugar
              </p>
            </div>
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
              />
            </div>
          </section>

          {/* Tasks Section - 1 column */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <TaskList
                tasks={tasks}
                onAddTask={handleAddTask}
                onToggleTask={handleToggleTask}
                onDeleteTask={handleDeleteTask}
              />
            </div>
            <div className="my-5 shadow-sm">
              <EventList
                selectedDate={selectedDate}
                events={selectedDayEvents}
                onDeleteEvent={handleDeleteEvent}
                onDateClick={handleDateClick}
              />
            </div>
          </aside>
        </main>
      </div>

      {/* Modal para eventos */}
      <EventModal
        isOpen={isModalOpen}
        selectedDate={selectedDate}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveEvent}
      />
    </div>
  );
}

export default App;
