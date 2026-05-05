import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { type Event, type Task } from "../types";

interface DayListProps {
  selectedDate: Date | null;
  events: Event[];
  tasks: Task[];
  onDeleteEvent: (id: number) => void;
  onAddTask: (title: string) => void;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
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
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const themeColors = isDark ? Colors.dark : Colors.light;

  const handleAddTask = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim());
      setNewTaskTitle("");
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return "Selecciona un día";

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    ) {
      return "Hoy";
    }

    if (
      date.getDate() === tomorrow.getDate() &&
      date.getMonth() === tomorrow.getMonth() &&
      date.getFullYear() === tomorrow.getFullYear()
    ) {
      return "Mañana";
    }

    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
    ];

    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const sortedEvents = [...events].sort((a, b) =>
    a.start_time.localeCompare(b.start_time)
  );
  const incompleteTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const eventColors = ["#80BF41", "#B1D923", "#F27405", "#4A90D9", "#9B59B6"];

  return (
    <View className="flex-1 p-4">
      {/* Header */}
      <View className="mb-4">
        <Text
          className={`text-xl font-semibold ${
            isDark ? "text-white" : "text-gray-800"
          }`}
        >
          {formatDate(selectedDate)}
        </Text>
        <Text
          className={`text-sm mt-1 ${isDark ? "text-gray-400" : "text-gray-600"}`}
        >
          {sortedEvents.length} eventos · {incompleteTasks.length} tareas pendientes
        </Text>
      </View>

      {/* Events section */}
      {sortedEvents.length > 0 && (
        <View className="mb-4">
          <Text
            className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
              isDark ? "text-gray-500" : "text-gray-600"
            }`}
          >
            Eventos
          </Text>
          {sortedEvents.map((event, index) => (
            <View
              key={event.id}
              className={`p-4 rounded-2xl mb-2 shadow-sm ${
                isDark ? "bg-gray-800/50" : "bg-white"
              }`}
              style={{ borderLeftWidth: 4, borderLeftColor: eventColors[index % eventColors.length] }}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-1 mr-3">
                  <View className="flex-row items-center gap-2 mb-1">
                    <View
                      className={`px-2 py-0.5 rounded-full ${
                        isDark ? "bg-gray-700" : "bg-gray-100"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          isDark ? "text-gray-300" : "text-gray-600"
                        }`}
                      >
                        {new Date(event.start_time).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  </View>
                  <Text
                    className={`font-semibold ${
                      isDark ? "text-white" : "text-gray-800"
                    }`}
                    numberOfLines={1}
                  >
                    {event.title}
                  </Text>
                  {event.description ? (
                    <Text
                      className={`text-sm mt-1 ${
                        isDark ? "text-gray-400" : "text-gray-600"
                      }`}
                      numberOfLines={2}
                    >
                      {event.description}
                    </Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => onDeleteEvent(event.id)}
                  className={`p-2 rounded-lg ${
                    isDark ? "bg-gray-700" : "bg-gray-100"
                  }`}
                >
                  <MaterialCommunityIcons
                    name="trash-can-outline"
                    size={16}
                    color={isDark ? "#9CA3AF" : "#6B7280"}
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Tasks section */}
      <View>
        <Text
          className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
            isDark ? "text-gray-500" : "text-gray-600"
          }`}
        >
          Tareas
        </Text>

        {/* Add task form */}
        <View className="flex-row gap-2 mb-3">
          <TextInput
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            onSubmitEditing={handleAddTask}
            placeholder="Nueva tarea..."
            placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
            className={`flex-1 px-4 py-3 rounded-xl border ${
              isDark
                ? "bg-gray-800/50 border-gray-700 text-white"
                : "bg-white border-gray-200 text-gray-800"
            }`}
          />
          <TouchableOpacity
            onPress={handleAddTask}
            className="h-12 w-12 rounded-xl bg-verde items-center justify-center"
          >
            <MaterialCommunityIcons name="plus" size={20} color="white" />
          </TouchableOpacity>
        </View>

        {/* Incomplete tasks */}
        {incompleteTasks.length > 0 && (
          <View className="mb-3">
            {incompleteTasks.map((task) => (
              <View
                key={task.id}
                className={`p-4 rounded-2xl mb-2 shadow-sm ${
                  isDark ? "bg-gray-800/50" : "bg-white"
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={() => onToggleTask(task.id)}
                    className={`w-5 h-5 rounded-md border-2 items-center justify-center ${
                      isDark ? "border-gray-600" : "border-gray-300"
                    }`}
                  />
                  <Text
                    className={`flex-1 ${isDark ? "text-white" : "text-gray-800"}`}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onDeleteTask(task.id)}
                    className="p-2 rounded-lg"
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={16}
                      color={isDark ? "#6B7280" : "#9CA3AF"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Completed tasks */}
        {completedTasks.length > 0 && (
          <View className="mt-4">
            <Text
              className={`text-xs font-medium uppercase tracking-wider mb-2 ${
                isDark ? "text-gray-600" : "text-gray-500"
              }`}
            >
              Completadas
            </Text>
            {completedTasks.map((task) => (
              <View
                key={task.id}
                className={`p-4 rounded-2xl mb-2 ${
                  isDark ? "bg-gray-800/30" : "bg-gray-50"
                }`}
              >
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    onPress={() => onToggleTask(task.id)}
                    className="w-5 h-5 rounded-md bg-verde items-center justify-center"
                  >
                    <MaterialCommunityIcons
                      name="check"
                      size={12}
                      color="white"
                    />
                  </TouchableOpacity>
                  <Text
                    className={`flex-1 line-through ${
                      isDark ? "text-gray-500" : "text-gray-400"
                    }`}
                    numberOfLines={1}
                  >
                    {task.title}
                  </Text>
                  <TouchableOpacity
                    onPress={() => onDeleteTask(task.id)}
                    className="p-2 rounded-lg"
                  >
                    <MaterialCommunityIcons
                      name="trash-can-outline"
                      size={16}
                      color={isDark ? "#4B5563" : "#9CA3AF"}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Empty state */}
        {tasks.length === 0 && sortedEvents.length === 0 && (
          <View className="items-center py-8">
            <Text
              className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}
            >
              No hay tareas ni eventos para este día
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}
