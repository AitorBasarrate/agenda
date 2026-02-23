import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Button } from "./ui/button";
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
const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

const isDarkMode = false; // Ideally pull this from a hook

export function CalendarView({
  currentDate,
  selectedDate,
  events,
  onPrevMonth,
  onNextMonth,
  onDateClick,
}: CalendarViewProps) {
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar logic
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

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString();
  };

  return (
    <View className={`rounded-xl shadow-sm p-4 ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <Text className={`text-xl font-bold ${isDarkMode ? "text-white" : "text-gray-800"}`}>
          {MONTHS[month]} {year}
        </Text>
        <View className="flex-row space-x-2">
          <Button onPress={onPrevMonth} variant="outline" size="icon">
            <MaterialCommunityIcons name="chevron-left" size={20} color={isDarkMode ? "white" : "black"} />
          </Button>
          <Button onPress={onNextMonth} variant="outline" size="icon">
            <MaterialCommunityIcons name="chevron-right" size={20} color={isDarkMode ? "white" : "black"} />
          </Button>
        </View>
      </View>

      {/* Weekday Labels */}
      <View className="flex-row mb-2">
        {DAYS.map((day) => (
          <View key={day} className="flex-1">
            <Text className="text-center text-xs font-medium text-gray-400 uppercase">
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid - The fix is flex-wrap and w-[14.28%] */}
      <View className="flex-row flex-wrap border-t border-l border-gray-100 dark:border-gray-800">
        {days.map((date, index) => {
          const dateKey = date.toDateString();
          const dayEvents = events[dateKey] || [];
          const currentMonth = date.getMonth() === month;
          const today = isToday(date);
          const selected = isSelected(date);

          return (
            <TouchableOpacity
              key={index}
              onPress={() => onDateClick(date)}
              // Width must be 1/7th of the container
              style={{ width: '14.28%' }}
              className={`
                aspect-square p-1 border-r border-b border-gray-100 dark:border-gray-800
                ${!currentMonth ? "bg-gray-50 opacity-40" : "bg-white"}
                ${today ? "bg-green-50" : ""}
                ${selected ? "bg-green-100" : ""}
              `}
            >
              <Text
                className={`text-right text-xs font-medium
                  ${today ? "text-green-600" : currentMonth ? "text-gray-700" : "text-gray-300"}
                `}
              >
                {date.getDate()}
              </Text>
              
              <View className="flex-1 justify-end items-center pb-1">
                {dayEvents.length > 0 && (
                  <View className="h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}