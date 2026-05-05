import { useState } from 'react';
import { Trash2, Check, Plus } from 'lucide-react';

export interface DayListTask {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

interface Event {
  id: string;
  title: string;
  time: string;
  description: string;
  color: string;
  date: string;
}

interface DayListProps {
  selectedDate: Date | null;
  events: Event[];
  tasks: DayListTask[];
  onDeleteEvent: (id: string) => void;
  onAddTask: (title: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  isDark: boolean;
}

export function DayList({
  selectedDate,
  events,
  tasks,
  onDeleteEvent,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  isDark,
}: DayListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle);
      setNewTaskTitle('');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Selecciona un día';

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return 'Hoy';
    }

    if (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    ) {
      return 'Mañana';
    }

    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
    ];

    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const sortedEvents = [...events].sort((a, b) => a.time.localeCompare(b.time));
  const incompleteTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {formatDate(selectedDate)}
          </h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {sortedEvents.length} eventos · {incompleteTasks.length} tareas pendientes
          </p>
        </div>

        {/* Events section */}
        {sortedEvents.length > 0 && (
          <div className="space-y-2">
            <h3
              className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-gray-500' : 'text-gray-600'
              }`}
            >
              Eventos
            </h3>
            {sortedEvents.map((event) => (
              <div
                key={event.id}
                className={`p-4 rounded-2xl border-l-4 ${
                  isDark ? 'bg-gray-800/50' : 'bg-white'
                } shadow-sm transition-all hover:shadow-md`}
                style={{ borderLeftColor: event.color }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {event.time}
                      </span>
                    </div>
                    <h4 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {event.title}
                    </h4>
                    {event.description && (
                      <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {event.description}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => onDeleteEvent(event.id)}
                    className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                      isDark
                        ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400'
                        : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'
                    }`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tasks section */}
        <div className="space-y-2">
          <h3
            className={`text-xs font-semibold uppercase tracking-wider ${
              isDark ? 'text-gray-500' : 'text-gray-600'
            }`}
          >
            Tareas
          </h3>

          {/* Add task form */}
          <form onSubmit={handleAddTask} className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              placeholder="Nueva tarea..."
              className={`flex-1 px-4 py-3 rounded-xl border transition-colors ${
                isDark
                  ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-[#80BF41]'
                  : 'bg-white border-gray-200 text-gray-800 placeholder-gray-400 focus:border-[#80BF41]'
              } focus:outline-none focus:ring-2 focus:ring-[#80BF41]/20`}
            />
            <button
              type="submit"
              className="h-12 w-12 rounded-xl bg-[#80BF41] hover:bg-[#B1D923] text-white flex items-center justify-center transition-colors"
            >
              <Plus className="h-5 w-5" />
            </button>
          </form>

          {/* Incomplete tasks */}
          {incompleteTasks.length > 0 && (
            <div className="space-y-2 mt-3">
              {incompleteTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl ${
                    isDark ? 'bg-gray-800/50' : 'bg-white'
                  } shadow-sm transition-all hover:shadow-md`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className={`flex-shrink-0 w-5 h-5 rounded-md border-2 transition-all ${
                        isDark
                          ? 'border-gray-600 hover:border-[#80BF41]'
                          : 'border-gray-300 hover:border-[#80BF41]'
                      }`}
                    />
                    <span className={`flex-1 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {task.title}
                    </span>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-gray-700 text-gray-400 hover:text-red-400'
                          : 'hover:bg-gray-100 text-gray-500 hover:text-red-500'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <div className="space-y-2 mt-4">
              <h4
                className={`text-xs font-medium uppercase tracking-wider ${
                  isDark ? 'text-gray-600' : 'text-gray-500'
                }`}
              >
                Completadas
              </h4>
              {completedTasks.map((task) => (
                <div
                  key={task.id}
                  className={`p-4 rounded-2xl ${
                    isDark ? 'bg-gray-800/30' : 'bg-gray-50'
                  } shadow-sm transition-all`}
                >
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onToggleTask(task.id)}
                      className="flex-shrink-0 w-5 h-5 rounded-md bg-[#80BF41] flex items-center justify-center transition-all"
                    >
                      <Check className="h-3 w-3 text-white" />
                    </button>
                    <span className={`flex-1 line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {task.title}
                    </span>
                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className={`flex-shrink-0 p-2 rounded-lg transition-colors ${
                        isDark
                          ? 'hover:bg-gray-700 text-gray-500 hover:text-red-400'
                          : 'hover:bg-gray-100 text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {tasks.length === 0 && (
            <div className={`text-center py-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <p className="text-sm">No hay tareas para hoy</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
