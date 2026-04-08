import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, useColorScheme } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "./ui/button";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Colors } from "@/constants/theme";
import { type Event } from "../../src/types";

interface CalendarViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: Record<string, Event[]>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDateClick: (date: Date) => void;
}

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const isDarkMode = false;
export function CalendarView({
  currentDate,
  selectedDate,
  events,
  onPrevMonth,
  onNextMonth,
  onDateClick,
}: CalendarViewProps) {
  const colorScheme = useColorScheme();
  const isDarkComp = colorScheme === 'dark';
  const themeColors = isDarkComp ? Colors.dark : Colors.light;
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const firstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const days: Date[] = [];

  for (let i = firstDay - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, daysInPrevMonth - i));
  }

  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  const remainingDays = 42 - days.length;
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  const getDateKey = (date: Date) => {
    return date.toDateString();
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === month;
  };

  const textColor = useThemeColor({}, "text");

  return (
    <View
      className={`rounded-lg shadow-lg p-4 ${isDarkComp ? "bg-gray-800" : "bg-white"}`}
    >
      {/* Header con navegación */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className={`text-2xl ${isDarkComp ? "text-white" : ""}`}>
          {MONTHS[month]} {year}
        </Text>
        <View className="flex-row space-x-2">
          <Button
            onPress={onPrevMonth}
            variant="outline"
            className={
              isDarkComp
                ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                : ""
            }
            size="icon" // Apply border color
          >
            <MaterialCommunityIcons name="chevron-left" size={16} />
          </Button>
          <Button
            onPress={onNextMonth}
            variant="outline"
            className={
              isDarkComp
                ? "bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
                : ""
            }
            size="icon" // Apply border color
          >
            <MaterialCommunityIcons name="chevron-right" size={16} />
          </Button>
        </View>
      </View>

      {/* Días de la semana */}
      <View className="flex-row mb-2">
        {DAYS.map((day) => (
          <View key={day} className="flex-1">
            <Text
              key={day}
              className={`text-center py-2 border-b ${isDarkComp ? "text-gray-400 border-gray-700" : "text-gray-500"}`}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Calendario */}
      <View>
        {/* Render weeks in rows of 7 */}
        {Array.from({ length: Math.ceil(days.length / 7) }).map((_, weekIndex) => (
          <View key={weekIndex} className="flex-row">
            {days.slice(weekIndex * 7, (weekIndex + 1) * 7).map((date, dayIndex) => {
              const dateKey = getDateKey(date);
              const dayEvents = events[dateKey] || [];
              const currentMonth = isCurrentMonth(date);
              const today = isToday(date);
              const selected = isSelected(date);

              return (
                <TouchableOpacity
                  key={`${weekIndex}-${dayIndex}`}
                  onPress={() => onDateClick(date)}
                  className={`
                    flex-1 min-h-16 p-1 border
                    ${isDarkComp ? "border-gray-700" : "border-gray-200"}
                    ${isToday(date) ? (isDarkComp ? "bg-gray-700 border-verde" : "bg-lima border-verde") : ""}
                    ${isSelected(date) ? (isDarkComp ? "ring-2 ring-verde" : "ring-2 ring-verde") : ""}
                  `}
                >
                  <Text
                    className={`
                      text-right text-xs px-1
                      ${
                        isToday(date)
                          ? isDarkMode
                            ? "text-verde font-semibold"
                            : "text-verde font-semibold"
                          : isDarkMode
                            ? "text-gray-400"
                            : "text-gray-600"
                      }
                    `}
                  >
                    {date.getDate()}
                  </Text>
                  <View className="space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <Text
                        key={event.id}
                        className={`text-xs p-1 rounded truncate`}
                      >
                        {event.title}
                      </Text>
                    ))}
                    {dayEvents.length > 2 && (
                      <Text className="text-xs text-gray-500">
                        +{dayEvents.length - 2} más
                      </Text>
                    )}
                  </View>
                  {dayEvents.length > 0 && (
                    <View className="flex justify-center mt-1">
                      <View className="w-1 h-1 rounded-full bg-verde"></View>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}
