import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { type Task } from '../../src/types';
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';

interface TaskListProps {
  tasks: Task[];
  onAddTask: () => void;
  onToggleTask: (id: number) => void;
  onDeleteTask: (id: number) => void;
}

export function TaskList({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask,
}: TaskListProps) {
  const [newTaskTitle, setNewTaskTitle] = useState("");

  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const themeColors = isDarkMode ? Colors.dark : Colors.light;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setNewTaskTitle("");
  };

  const pendingTasks = Array.from(tasks).filter((t) => t.status === "pending");
  const completedTasks = Array.from(tasks).filter(
    (t) => t.status === "completed",
  );

  const textColor = themeColors.text;
  const textMuted = themeColors.textMuted;
  const primary = themeColors.primary;
  const error = themeColors.error;
  const success = themeColors.success;
  const border = themeColors.border;
  const background = themeColors.background;

  const styles = StyleSheet.create({
    header: {
      fontSize: 22, // text-2xl
      fontWeight: '500', // font-medium
      color: textColor, // text-gray-800
      marginBottom: 24, // mb-6
    },
    form: {
      marginBottom: 24, // mb-6
    },
    formRow: {
      flexDirection: 'row',
      gap: 12, // gap-3
    },
    input: {
      flex: 1, // flex-1
      height: 40, // h-10
      // focus:ring-green-500 focus:border-green-500 handled by TextInput default focus or custom styling
    },
    addButton: {
      height: 40, // h-10 w-10
      width: 40,
      backgroundColor: primary,
      borderRadius: 6,
    },
    tasksContainer: {
      // space-y-4
    },
    taskSection: {
      marginBottom: 16, // space-y-3 between sections
    },
    taskSectionHeader: {
      fontSize: 12, // text-sm
      fontWeight: '500', // font-medium
      color: textMuted, // text-gray-600
      marginBottom: 16, // mb-4
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8, // gap-2
    },
    pendingIcon: {
      color: primary, // text-blue-500
    },
    completedIcon: {
      color: success, // text-green-500
    },
    completedSectionDivider: {
      paddingTop: 24, // pt-6
      borderTopWidth: 1,
      borderTopColor: border, // border-t border-gray-200
    },
    emptyState: {
      textAlign: 'center',
      paddingVertical: 64, // py-16
      color: textMuted, // text-gray-500
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateIconCircle: {
      backgroundColor: themeColors.backgroundAlt, // bg-gray-100
      borderRadius: 9999, // rounded-full
      padding: 16, // p-4
      width: 64, // w-16 h-16
      height: 64,
      marginHorizontal: 'auto',
      marginBottom: 16, // mb-4
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyStateIcon: {
      color: textMuted, // text-gray-400
    },
    emptyStateTitle: {
      fontSize: 18, // text-lg
      fontWeight: '500', // font-medium
      marginBottom: 8, // mb-2
      color: textMuted,
    },
    emptyStateText: {
      fontSize: 14, // text-sm
      color: textMuted, // text-gray-400
    },
  });

  return (
    <View>
      <Text style={styles.header}>Tareas</Text>

      {/* Formulario para agregar tarea */}
      <View style={styles.form}>
        <View style={styles.formRow}>
          <Input
            value={newTaskTitle}
            onChangeText={setNewTaskTitle}
            placeholder="Agregar nueva tarea..."
            style={styles.input}
          />
          <Button
            size="icon"
            style={styles.addButton}
            onPress={onAddTask}
          >
            <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
          </Button>
        </View>
      </View>

      {/* Tareas pendientes */}
      <View style={styles.tasksContainer}>
        {pendingTasks.length > 0 && (
          <View style={styles.taskSection}>
            <Text style={styles.taskSectionHeader}>
              <MaterialCommunityIcons name="circle-slice-8" size={16} style={styles.pendingIcon} />
              Pendientes ({pendingTasks.length})
            </Text>
            <View>
              {pendingTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </View>
          </View>
        )}

        {/* Tareas completadas */}
        {completedTasks.length > 0 && (
          <View style={[styles.taskSection, styles.completedSectionDivider]}>
            <Text style={styles.taskSectionHeader}>
              <MaterialCommunityIcons name="check-circle-outline" size={16} style={styles.completedIcon} />
              Completadas ({completedTasks.length})
            </Text>
            <View>
              {completedTasks.map((task) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  onToggle={onToggleTask}
                  onDelete={onDeleteTask}
                />
              ))}
            </View>
          </View>
        )}

        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIconCircle}>
              <MaterialCommunityIcons name="circle-outline" size={32} style={styles.emptyStateIcon} />
            </View>
            <Text style={styles.emptyStateTitle}>No hay tareas aún</Text>
            <Text style={styles.emptyStateText}>
              Agrega tu primera tarea para comenzar
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

interface TaskItemProps {
  task: Task;
  onToggle: (id: number) => void;
  onDelete: (id: number) => void;
}

function TaskItem({
  task,
  onToggle,
  onDelete,
}: TaskItemProps) {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const textColor = themeColors.text;
  const textMuted = themeColors.textMuted;
  const success = themeColors.success;
  const error = themeColors.error;
  const border = themeColors.border;

  const itemStyles = StyleSheet.create({
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12, // gap-3
      padding: 16, // p-4
      borderRadius: 8, // rounded-lg
      borderWidth: 1,
      borderColor: border, // border border-gray-200
      marginBottom: 12, // For space-y-3 replication
    },
    toggleButton: {
      // flex-shrink-0
      // hover:scale-110 handled by TouchableOpacity default feedback
      padding: 4, // Added padding for easier press
    },
    pendingCheckIcon: {
      color: textMuted, // text-gray-400
    },
    completedCheckIcon: {
      color: success, // text-green-500
    },
    taskTitle: {
      flex: 1, // flex-1
      // transition-all duration-200
      color: textColor, // text-gray-700
    },
    completedTaskTitle: {
      textDecorationLine: 'line-through',
      color: textMuted, // text-gray-400
    },
    deleteButton: {
      // opacity-0 group-hover:opacity-100 transition-all duration-200
      height: 32, // h-8 w-8
      width: 32,
      borderRadius: 6,
      justifyContent: 'center',
      alignItems: 'center',
      // hover:bg-red-50 hover:text-red-600 handled by TouchableOpacity feedback
    },
    deleteIcon: {
      color: textMuted, // Default color, will change on hover/active in web
    },
  });

  return (
    <View style={itemStyles.taskItem}>
      <TouchableOpacity
        onPress={() => onToggle(task.id)}
        style={itemStyles.toggleButton}
      >
        {task.status === "completed" ? (
          <MaterialCommunityIcons name="check-circle" size={20} style={itemStyles.completedCheckIcon} />
        ) : (
          <MaterialCommunityIcons name="circle-outline" size={20} style={itemStyles.pendingCheckIcon} />
        )}
      </TouchableOpacity>

      <Text
        style={[
          itemStyles.taskTitle,
          task.status === "completed" && itemStyles.completedTaskTitle,
        ]}
      >
        {task.title}
      </Text>

      <TouchableOpacity
        onPress={() => onDelete(task.id)}
        style={itemStyles.deleteButton}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={16} style={itemStyles.deleteIcon} />
      </TouchableOpacity>
    </View>
  );
}
