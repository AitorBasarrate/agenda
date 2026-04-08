import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, useColorScheme } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { useThemeColor } from '@/hooks/use-theme-color';
import { Colors } from '@/constants/theme';

interface TaskModalProps {
  isOpen: boolean;
  selectedDate: Date | null;
  onClose: () => void;
  onSave: (task: {
    title: string;
    due_date: string;
    description: string;
  }) => void;
}

export function TaskModal({
  isOpen,
  selectedDate,
  onClose,
  onSave,
}: TaskModalProps) {
  const [title, setTitle] = useState("");
  const [due_date, setDueDate] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setTitle("");
      setDescription("");
      // Set default time if selectedDate is available
      if (selectedDate) {
        const defaultTime = selectedDate.toTimeString().slice(0, 5);
        setDueDate(defaultTime);
      } else {
        setDueDate("");
      }
    }
  }, [isOpen, selectedDate]);


  const handleSubmit = () => {
    if (!title || !due_date) {
      return;
    }

    if (selectedDate) {
      const newDueDate = new Date(selectedDate);
      const [hours, minutes] = due_date.split(":").map(Number);
      newDueDate.setHours(hours, minutes, 0, 0);

      onSave({
        title,
        due_date: newDueDate.toISOString(),
        description,
      });

      // Limpiar formulario y cerrar modal
      setTitle("");
      setDueDate("");
      setDescription("");
      onClose();
    }
  };

  const dateStr = selectedDate
    ? selectedDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const isDarkMode = useColorScheme() === 'dark';
  const themeColors = isDarkMode ? Colors.dark : Colors.light;
  const backgroundColor = themeColors.surface;
  const textColor = themeColors.text;
  const textMuted = themeColors.textMuted;
  const borderColor = themeColors.border;
  const primary = themeColors.primary;

  const styles = StyleSheet.create({
    centeredView: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: 'rgba(0,0,0,0.5)', // bg-black bg-opacity-50
      padding: 16, // p-4
    },
    modalView: {
      backgroundColor: backgroundColor, // bg-white
      borderRadius: 8, // rounded-lg
      shadowColor: "#000", // shadow-xl
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.30,
      shadowRadius: 4.65,
      elevation: 8,
      maxWidth: 400, // max-w-md
      width: "100%",
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: 24, // p-6
      borderBottomWidth: 1,
      borderBottomColor: borderColor, // border-b
    },
    modalTitle: {
      fontSize: 20, // text-xl
      color: textColor,
    },
    closeButton: {
      padding: 4, // for easier touch
    },
    closeButtonIcon: {
      color: textMuted, // text-gray-400
    },
    formContent: {
      padding: 24, // p-6
      gap: 16, // space-y-4
    },
    dateText: {
      fontSize: 14, // text-sm
      color: textMuted, // text-gray-600
      marginBottom: 16, // mb-4
      textTransform: 'capitalize',
    },
    formField: {
      gap: 8, // space-y-2
    },
    buttonContainer: {
      flexDirection: 'row',
      gap: 12, // gap-3
      paddingTop: 16, // pt-4
    },
    cancelButton: {
      flex: 1, // flex-1
      borderColor: borderColor, // Assuming outline variant
    },
    saveButton: {
      flex: 1, // flex-1
      backgroundColor: primary,
    },
  });

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View style={styles.centeredView}>
        <View style={styles.modalView}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Agregar Tarea</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton} accessibilityLabel="Close">
              <MaterialCommunityIcons name="close" size={24} style={styles.closeButtonIcon} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.formContent}>
            <View>
              <Text style={styles.dateText}>{dateStr}</Text>
            </View>

            <View style={styles.formField}>
              <Label htmlFor="title">Título de la tarea</Label>
              <Input
                id="title"
                value={title}
                onChangeText={setTitle}
                placeholder="Ej: Comprar el pan"
                required
              />
            </View>

            <View style={styles.formField}>
              <Label htmlFor="dueDate">Hora</Label>
              <Input
                id="dueDate"
                value={due_date}
                onChangeText={setDueDate}
                placeholder="HH:mm"
                required
              />
            </View>

            <View style={styles.formField}>
              <Label htmlFor="description">Descripción (opcional)</Label>
              <Textarea
                id="description"
                value={description}
                onChangeText={setDescription}
                placeholder="Detalles de la tarea..."
                rows={3}
              />
            </View>

            <View style={styles.buttonContainer}>
              <Button type="button" variant="outline" onPress={onClose} style={styles.cancelButton}>
                Cancelar
              </Button>
              <Button type="submit" onPress={handleSubmit} style={styles.saveButton}>
                Guardar Tarea
              </Button>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
