import { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, Plus, Moon, Sun } from 'lucide-react';
import { CalendarView } from './components/calendar-view';
import { CollapsibleCalendar } from './components/collapsible-calendar';
import { DayList, type DayListTask } from './components/day-list';
import { EventModal } from './components/event-modal';
import { TaskList } from './components/task-list';
import { EventList } from './components/event-list';

interface Event {
  id: string;
  title: string;
  time: string;
  description: string;
  color: string;
  date: string;
}

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [events, setEvents] = useState<Record<string, Event[]>>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewEvent, setViewEvent] = useState<Event | null>(null);
  const [isDark, setIsDark] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  // Load data from localStorage
  useEffect(() => {
    const savedEvents = localStorage.getItem('calendar-events');
    const savedTasks = localStorage.getItem('calendar-tasks');
    const savedTheme = localStorage.getItem('calendar-theme');

    if (savedEvents) {
      try {
        setEvents(JSON.parse(savedEvents));
      } catch (e) {
        console.error('Error loading events:', e);
      }
    }

    if (savedTasks) {
      try {
        setTasks(JSON.parse(savedTasks));
      } catch (e) {
        console.error('Error loading tasks:', e);
      }
    }

    if (savedTheme) {
      setIsDark(savedTheme === 'dark');
    }
  }, []);

  // Save events to localStorage
  useEffect(() => {
    localStorage.setItem('calendar-events', JSON.stringify(events));
  }, [events]);

  // Save tasks to localStorage
  useEffect(() => {
    localStorage.setItem('calendar-tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Save theme to localStorage
  useEffect(() => {
    localStorage.setItem('calendar-theme', isDark ? 'dark' : 'light');
  }, [isDark]);

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

  const handleSaveEvent = (eventData: Omit<Event, 'id'>) => {
    const newEvent: Event = {
      ...eventData,
      id: Date.now().toString(),
    };

    setEvents(prev => ({
      ...prev,
      [eventData.date]: [...(prev[eventData.date] || []), newEvent],
    }));

    setIsModalOpen(false);
    setViewEvent(null);
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => {
      const newEvents = { ...prev };
      Object.keys(newEvents).forEach(dateKey => {
        newEvents[dateKey] = newEvents[dateKey].filter(e => e.id !== eventId);
        if (newEvents[dateKey].length === 0) {
          delete newEvents[dateKey];
        }
      });
      return newEvents;
    });
    setViewEvent(null);
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1);
      } else {
        newDate.setMonth(newDate.getMonth() + 1);
      }
      return newDate;
    });
  };

  const handleAddTask = (text: string) => {
    const newTask: Task = {
      id: Date.now().toString(),
      text,
      completed: false,
    };
    setTasks(prev => [...prev, newTask]);
  };

  const handleToggleTask = (id: string) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  const handleDeleteTask = (id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  };

  const handleEventClick = (event: Event) => {
    setViewEvent(event);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setViewEvent(null), 200);
  };

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  const selectedDateEvents = selectedDate ? events[getDateKey(selectedDate)] || [] : [];

  // Convert tasks to DayListTask format for mobile view
  const dayListTasks: DayListTask[] = tasks.map(t => ({
    id: t.id,
    title: t.text,
    completed: t.completed,
    createdAt: '',
  }));

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  const handlePrevMonth = () => handleMonthChange('prev');
  const handleNextMonth = () => handleMonthChange('next');

  return (
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
                    events={events}
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
            </div>
          </>
        )}

        {/* Mobile Layout */}
        {isMobile && (
          <div className="min-h-screen flex flex-col">
            {/* Theme toggle button - fixed top right */}
            <div className="fixed top-4 right-4 z-50">
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

            {/* Collapsible Calendar */}
            <CollapsibleCalendar
              currentDate={currentDate}
              selectedDate={selectedDate}
              events={events}
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
          </div>
        )}

        {/* Event Modal */}
        <EventModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSave={handleSaveEvent}
          selectedDate={selectedDate}
          isDark={isDark}
          isMobile={isMobile}
          viewEvent={viewEvent}
          onDelete={handleDeleteEvent}
        />
      </div>
    </div>
  );
}
