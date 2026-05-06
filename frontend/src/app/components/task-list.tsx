import { useState } from "react";
import { Trash2, Plus, CheckCircle2, Circle } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

import { type Task } from "../../types";

interface TaskListProps {
  tasks: Task[];
  onAddTask: () => void;
  onToggleTask: (id: number, checked: boolean) => void;
  onDeleteTask: (id: number) => void;
}

export function TaskList({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setNewTaskTitle("");
  };

  const pendingTasks = Array.from(tasks).filter((t) => t.status === "pending");
  const completedTasks = Array.from(tasks).filter(
    (t) => t.status === "completed",
  );

  return (
    <div>
      <h2 className="text-2xl font-medium text-gray-800 mb-6">Tareas</h2>

      {/* Formulario para agregar tarea */}
      <form onSubmit={handleSubmit} className="mb-6">
        <div className="flex gap-3">
          <Input
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Agregar nueva tarea..."
            className="flex-1 h-10 focus:ring-green-500 focus:border-green-500"
          />
          <Button
            type="submit"
            size="icon"
            className="h-10 w-10 bg-green-600 hover:bg-green-700 focus:ring-green-500"
            onClick={onAddTask}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </form>

      {/* Tareas pendientes */}
      <div className="space-y-4">
        {pendingTasks.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-600 mb-4 flex items-center gap-2">
              <Circle className="h-4 w-4 text-blue-500" />
              Pendientes ({pendingTasks.length})
            </h3>
            <div className="space-y-3">
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
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-600 mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Completadas ({completedTasks.length})
            </h3>
            <div className="space-y-3">
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
          <div className="text-center py-16 text-gray-500">
            <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Circle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-lg font-medium mb-2">No hay tareas aún</p>
            <p className="text-sm text-gray-400">
              Agrega tu primera tarea para comenzar
            </p>
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
  onToggle: (id: number, checked: boolean) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 group">
      <button
        onClick={() => onToggle(task.id, task.status !== "completed")}
        className="flex-shrink-0 hover:scale-110 transition-transform duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1 rounded-full"
      >
        {task.status === "completed" ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <Circle className="h-5 w-5 text-gray-400 hover:text-green-400" />
        )}
      </button>

      <span
        className={`flex-1 transition-all duration-200 ${
          task.status === "completed"
            ? "line-through text-gray-400"
            : "text-gray-700"
        }`}
      >
        {task.title}
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-100 transition-all duration-200 h-8 w-8 hover:bg-red-50 hover:text-red-600 focus:ring-red-500"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
