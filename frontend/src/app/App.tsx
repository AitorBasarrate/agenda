import { useState, useEffect } from "react";
import { CalendarView } from "./components/calendar-view";
import { EventModal } from "./components/event-modal";
import { TaskList, type Task } from "./components/task-list";
import { CalendarDays } from "lucide-react";

interface Event {
  id: string;
  title: string;
  time: string;
  description: string;
  color: string;
  date: string;
}

function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  // Cargar datos del localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem("calendar-events");
    const savedTasks = localStorage.getItem("calendar-tasks");

    if (savedEvents) {
      setEvents(JSON.parse(savedEvents));
    }
    if (savedTasks) {
      setTasks(JSON.parse(savedTasks));
    }
  }, []);

  // Guardar eventos en localStorage
  useEffect(() => {
    localStorage.setItem("calendar-events", JSON.stringify(events));
  }, [events]);

  // Guardar tareas en localStorage
  useEffect(() => {
    localStorage.setItem("calendar-tasks", JSON.stringify(tasks));
  }, [tasks]);

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const groupedEvents = events.reduce((acc, event) => {
    if (!acc[event.date]) {
      acc[event.date] = [];
    }
    acc[event.date].push(event);
    return acc;
  }, {} as Record<string, typeof events>);

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

  const handleSaveEvent = (eventData: {
    title: string;
    time: string;
    description: string;
    color: string;
  }) => {
    if (!selectedDate) return;

    const newEvent: Event = {
      id: Date.now().toString(),
      ...eventData,
      date: getDateKey(selectedDate),
    };

    setEvents([...events, newEvent]);
  };

  const handleAddTask = (title: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    setTasks([...tasks, newTask]);
  };

  const handleToggleTask = (id: string) => {
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter((task) => task.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <CalendarDays className="h-8 w-8 text-green-700" />
            <h1 className="text-4xl text-gray-800">Mi Calendario</h1>
          </div>
          <p className="text-gray-600">
            Organiza tus eventos y tareas en un solo lugar
          </p>
        </div>

        {/* Layout principal */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Calendario - 2 columnas */}
          <div className="lg:col-span-2">
            <CalendarView
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={groupedEvents}
              onPrevMonth={handlePrevMonth}
              onNextMonth={handleNextMonth}
              onDateClick={handleDateClick}
            />
          </div>

          {/* Lista de tareas - 1 columna */}
          <div className="lg:col-span-1">
            <TaskList
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        </div>
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