import { Plus, Trash2, Check } from 'lucide-react';
import { useState } from 'react';

interface Task {
  id: string;
  text: string;
  completed: boolean;
}

interface TaskListProps {
  tasks: Task[];
  onAddTask: (text: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  isDark: boolean;
  isMobile: boolean;
}

export function TaskList({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
  isDark,
  isMobile,
}: TaskListProps) {
  const [newTaskText, setNewTaskText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    onAddTask(newTaskText.trim());
    setNewTaskText('');
  };

  const pendingTasks = tasks.filter(task => !task.completed);
  const completedTasks = tasks.filter(task => task.completed);

  return (
    <div className={`${isDark ? 'bg-gray-900 text-white' : 'bg-white'} rounded-2xl ${isMobile ? 'p-4' : 'p-6'} shadow-lg h-full overflow-y-auto`}>
      <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold mb-4 text-[#80BF41]`}>
        Mis Tareas
      </h2>

      {/* Add task form */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskText}
            onChange={(e) => setNewTaskText(e.target.value)}
            placeholder="Nueva tarea..."
            className={`
              flex-1 px-4 py-2 rounded-lg border
              ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400' : 'bg-white border-gray-300'}
              focus:outline-none focus:ring-2 focus:ring-[#80BF41]
            `}
          />
          <button
            type="submit"
            disabled={!newTaskText.trim()}
            className={`
              p-2 bg-[#80BF41] text-white rounded-lg hover:bg-[#B1D923] transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
              ${isMobile ? 'px-4' : 'px-6'}
            `}
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </form>

      {/* Pending tasks */}
      <div className="mb-6">
        <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>
          Pendientes ({pendingTasks.length})
        </h3>
        <div className="space-y-2">
          {pendingTasks.length === 0 ? (
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'} italic`}>
              No hay tareas pendientes
            </p>
          ) : (
            pendingTasks.map((task) => (
              <div
                key={task.id}
                className={`
                  flex items-center gap-3 p-4 rounded-2xl
                  ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}
                  transition-all hover:shadow-md group
                `}
              >
                <button
                  onClick={() => onToggleTask(task.id)}
                  className={`
                    flex-shrink-0 w-5 h-5 rounded-md border-2 border-[#80BF41]
                    hover:bg-[#80BF41] transition-colors flex items-center justify-center
                  `}
                >
                  {task.completed && <Check className="w-4 h-4 text-white" />}
                </button>
                <p className={`flex-1 text-sm ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {task.text}
                </p>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Completed tasks */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'} uppercase tracking-wide`}>
            Completadas ({completedTasks.length})
          </h3>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <div
                key={task.id}
                className={`
                  flex items-center gap-3 p-4 rounded-2xl
                  ${isDark ? 'bg-gray-800/30' : 'bg-gray-50'}
                  transition-all hover:shadow-md group
                `}
              >
                <button
                  onClick={() => onToggleTask(task.id)}
                  className="flex-shrink-0 w-5 h-5 rounded-md bg-[#80BF41] hover:bg-[#B1D923] transition-colors flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" />
                </button>
                <p className={`flex-1 text-sm line-through ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {task.text}
                </p>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 rounded-lg"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
