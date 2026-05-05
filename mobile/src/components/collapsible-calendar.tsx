import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Colors } from "@/constants/theme";
import { type Event } from "../types";

interface CollapsibleCalendarProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: Event[];
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDateClick: (date: Date) => void;
  onSelectedDateChange: (date: Date) => void;
  isDark: boolean;
}

const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DAY_NAMES = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export function CollapsibleCalendar({
  currentDate,
  selectedDate,
  events,
  onPrevMonth,
  onNextMonth,
  onDateClick,
  onSelectedDateChange,
  isDark,
}: CollapsibleCalendarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const themeColors = isDark ? Colors.dark : Colors.light;

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  };

  const getMonthDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days: (Date | null)[] = [];

    for (let i = 0; i < firstDayOfWeek; i++) {
      days.push(null);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  };

  const getCurrentWeekDays = () => {
    const today = selectedDate || new Date();
    const dayOfWeek = today.getDay();
    const monday = new Date(today);
    monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

    const weekDays: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(monday);
      day.setDate(monday.getDate() + i);
      weekDays.push(day);
    }

    return weekDays;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (date: Date | null) => {
    if (!date || !selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const hasEvents = (date: Date | null) => {
    if (!date) return false;
    return events.some((event) => {
      const eventDate = new Date(event.start_time);
      return (
        eventDate.getDate() === date.getDate() &&
        eventDate.getMonth() === date.getMonth() &&
        eventDate.getFullYear() === date.getFullYear()
      );
    });
  };

  const weekDays = getCurrentWeekDays();
  const monthDays = getMonthDays();
  const weekNumber = Math.ceil((selectedDate || new Date()).getDate() / 7);

  const renderDayCell = (date: Date | null, index: number) => {
    if (!date) {
      return <View key={`empty-${index}`} className="flex-1 aspect-square" />;
    }

    const isTodayDate = isToday(date);
    const isSelectedDate = isSelected(date);
    const hasEventsDate = hasEvents(date);
    const isHighlighted = isSelectedDate || isTodayDate;

    return (
      <TouchableOpacity
        key={index}
        onPress={() => {
          onSelectedDateChange(date);
          onDateClick(date);
        }}
        className={`flex-1 aspect-square items-center justify-center rounded-xl ${
          isHighlighted ? "bg-verde" : ""
        }`}
      >
        <Text
          className={`text-base font-semibold ${
            isHighlighted
              ? "text-white"
              : isDark
                ? "text-gray-300"
                : "text-gray-700"
          }`}
        >
          {date.getDate()}
        </Text>
        {hasEventsDate && !isHighlighted && (
          <View className="w-1.5 h-1.5 rounded-full bg-pistacho mt-0.5" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View
      className={`rounded-b-3xl shadow-lg overflow-hidden ${
        isDark ? "bg-gray-900" : "bg-gray-50"
      }`}
    >
      {/* Header */}
      <View
        className={`px-4 py-3 border-b ${
          isDark ? "border-gray-800" : "border-gray-200"
        }`}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={onPrevMonth}
            className={`h-8 w-8 items-center justify-center rounded-lg ${
              isDark ? "bg-gray-800" : "bg-gray-200"
            }`}
          >
            <MaterialCommunityIcons
              name="chevron-left"
              size={20}
              color={isDark ? "#9CA3AF" : "#4B5563"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsExpanded(!isExpanded)}
            className="flex-row items-center gap-2 px-3 py-1.5 rounded-lg"
          >
            <Text
              className={`text-sm font-medium ${
                isDark ? "text-white" : "text-gray-800"
              }`}
            >
              {isExpanded
                ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : `Semana ${weekNumber}`}
            </Text>
            <MaterialCommunityIcons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={16}
              color={isDark ? "#9CA3AF" : "#4B5563"}
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={onNextMonth}
            className={`h-8 w-8 items-center justify-center rounded-lg ${
              isDark ? "bg-gray-800" : "bg-gray-200"
            }`}
          >
            <MaterialCommunityIcons
              name="chevron-right"
              size={20}
              color={isDark ? "#9CA3AF" : "#4B5563"}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Calendar Content */}
      <View className="px-4 pb-4 pt-2">
        {/* Day names */}
        <View className="flex-row mb-2">
          {DAY_NAMES.map((day) => (
            <View key={day} className="flex-1 items-center">
              <Text
                className={`text-xs font-medium py-1 ${
                  isDark ? "text-gray-500" : "text-gray-600"
                }`}
              >
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* Week view (collapsed) */}
        {!isExpanded && (
          <View className="flex-row">
            {weekDays.map((date, index) => renderDayCell(date, index))}
          </View>
        )}

        {/* Month view (expanded) */}
        {isExpanded && (
          <View>
            {Array.from({
              length: Math.ceil(monthDays.length / 7),
            }).map((_, weekIndex) => (
              <View key={weekIndex} className="flex-row">
                {monthDays
                  .slice(weekIndex * 7, (weekIndex + 1) * 7)
                  .map((date, dayIndex) =>
                    renderDayCell(date, weekIndex * 7 + dayIndex)
                  )}
                {/* Fill remaining cells if last row is incomplete */}
                {weekIndex === Math.ceil(monthDays.length / 7) - 1 &&
                  monthDays.slice(weekIndex * 7).length < 7 &&
                  Array.from({
                    length: 7 - monthDays.slice(weekIndex * 7).length,
                  }).map((_, i) => (
                    <View
                      key={`pad-${i}`}
                      className="flex-1 aspect-square"
                    />
                  ))}
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
