import React, { useState, useEffect } from "react";
import { View, Text, Modal, TouchableOpacity, ScrollView, TextInput } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { useSettings } from "@/contexts/settings-context";

interface EventModalProps {
  isOpen: boolean;
  selectedDate: Date | null;
  onClose: () => void;
  onSave: (event: {
    title: string;
    startTime: string;
    endTime: string;
    description: string;
  }) => void;
}

export function EventModal({ isOpen, selectedDate, onClose, onSave }: EventModalProps) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");

  const { settings } = useSettings();
  const isDark = settings.theme === "dark";
  const themeColors = isDark ? Colors.dark : Colors.light;

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDescription("");
      if (selectedDate) {
        const defaultTime = selectedDate.toTimeString().slice(0, 5);
        setStartTime(defaultTime);
        setEndTime(defaultTime);
      } else {
        setStartTime("");
        setEndTime("");
      }
    }
  }, [isOpen, selectedDate]);

  const handleSubmit = () => {
    if (!title) return;

    onSave({
      title,
      startTime: startTime || "09:00",
      endTime: endTime || "10:00",
      description,
    });
    onClose();
  };

  const dateStr = selectedDate
    ? selectedDate.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isOpen}
      onRequestClose={onClose}
    >
      <View className="flex-1 justify-end bg-black/50">
        <View
          className={`rounded-t-3xl ${
            isDark ? "bg-gray-900" : "bg-white"
          }`}
          style={{ maxHeight: "85%" }}
        >
          {/* Header */}
          <View
            className={`flex-row items-center justify-between px-6 py-4 border-b ${
              isDark ? "border-gray-800" : "border-gray-200"
            }`}
          >
            <Text
              className={`text-xl font-semibold ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              Agregar Evento
            </Text>
            <TouchableOpacity
              onPress={onClose}
              className={`h-8 w-8 rounded-full items-center justify-center ${
                isDark ? "bg-gray-800" : "bg-gray-100"
              }`}
            >
              <MaterialCommunityIcons
                name="close"
                size={18}
                color={isDark ? "#9CA3AF" : "#6B7280"}
              />
            </TouchableOpacity>
          </View>

          {/* Form Content */}
          <ScrollView className="px-6 py-4">
            {/* Date */}
            <Text
              className={`text-sm mb-4 capitalize ${
                isDark ? "text-gray-400" : "text-gray-600"
              }`}
            >
              {dateStr}
            </Text>

            {/* Title */}
            <View className="mb-4">
              <Text
                className={`text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Título del evento
              </Text>
              <TextInput
                value={title}
                onChangeText={setTitle}
                placeholder="Ej: Reunión con el equipo"
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                className={`px-4 py-3 rounded-xl border ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
              />
            </View>

            {/* Time row */}
            <View className="flex-row gap-3 mb-4">
              <View className="flex-1">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Hora Inicio
                </Text>
                <TextInput
                  value={startTime}
                  onChangeText={setStartTime}
                  placeholder="HH:mm"
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  className={`px-4 py-3 rounded-xl border ${
                    isDark
                      ? "bg-gray-800 border-gray-700 text-white"
                      : "bg-gray-50 border-gray-200 text-gray-800"
                  }`}
                />
              </View>
              <View className="flex-1">
                <Text
                  className={`text-sm font-medium mb-2 ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Hora Final
                </Text>
                <TextInput
                  value={endTime}
                  onChangeText={setEndTime}
                  placeholder="HH:mm"
                  placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                  className={`px-4 py-3 rounded-xl border ${
                    isDark
                      ? "bg-gray-800 border-gray-700 text-white"
                      : "bg-gray-50 border-gray-200 text-gray-800"
                  }`}
                />
              </View>
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text
                className={`text-sm font-medium mb-2 ${
                  isDark ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Descripción (opcional)
              </Text>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Detalles del evento..."
                placeholderTextColor={isDark ? "#6B7280" : "#9CA3AF"}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                className={`px-4 py-3 rounded-xl border min-h-[80px] ${
                  isDark
                    ? "bg-gray-800 border-gray-700 text-white"
                    : "bg-gray-50 border-gray-200 text-gray-800"
                }`}
              />
            </View>

            {/* Buttons */}
            <View className="flex-row gap-3 mb-6">
              <TouchableOpacity
                onPress={onClose}
                className={`flex-1 py-3 rounded-xl border items-center ${
                  isDark ? "border-gray-700" : "border-gray-300"
                }`}
              >
                <Text
                  className={`font-medium ${
                    isDark ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Cancelar
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSubmit}
                className="flex-1 py-3 rounded-xl bg-verde items-center"
              >
                <Text className="font-medium text-white">Guardar Evento</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
