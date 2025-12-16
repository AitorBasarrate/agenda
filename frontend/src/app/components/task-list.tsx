import { useState } from "react";
import { Trash2, Plus, CheckCircle2, Circle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdAt: string;
}

interface TaskListProps {
  tasks: Task[];
  onAddTask: (title: string) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
}

export function TaskList({ tasks, onAddTask, onToggleTask, onDeleteTask }: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    onAddTask(newTaskTitle);
    setNewTaskTitle("");
  };

  const pendingTasks = tasks.filter((t) => !t.completed);
  const completedTasks = tasks.filter((t) => t.completed);

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-2xl mb-6">Tareas</h2>

      {/* Formulario para agregar tarea */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-2">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Nueva tarea..."
            className="flex-1"
          />
          <Button type="submit" size="icon">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Tareas pendientes */}
      <div className="space-y-4">
        {pendingTasks.length > 0 && (
          <div>
            <h3 className="text-sm text-gray-500 mb-3">
              Pendientes ({pendingTasks.length})
            </h3>
            <div className="space-y-2">
              {pendingTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tareas completadas */}
        {completedTasks.length > 0 && (
          <div className="pt-4 border-t">
            <h3 className="text-sm text-gray-500 mb-3">
              Completadas ({completedTasks.length})
            </h3>
            <div className="space-y-2">
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </div>
          </div>
        )}

        {tasks.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Circle className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No hay tareas aún</p>
            <p className="text-sm">Agrega tu primera tarea arriba</p>
          </div>
        )}
      </div>
    </div>
  );
}

function TaskItem({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors group">
      <button
        onClick={() => onToggle(task.id)}
        className="flex-shrink-0"
      >
        {task.completed ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-gray-400" />
        )}
      </button>

      <span
        className={`flex-1 ${
          task.completed ? "line-through text-gray-400" : ""
        }`}
      >
        {task.title}
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Trash2 className="h-4 w-4 text-red-500" />
      </Button>
    </div>
  );
}
