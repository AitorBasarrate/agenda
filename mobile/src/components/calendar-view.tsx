import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons'; // Using MaterialCommunityIcons for chevron icons
import { Button } from './ui/button';
import { useThemeColor } from '@/hooks/use-theme-color';
import { type Event } from '../../src/types'; // Corrected import path

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
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

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

  const borderColor = useThemeColor({}, 'border');
  const textColor = useThemeColor({}, 'text');
  const mutedForeground = useThemeColor({}, 'mutedForeground');
  const accent = useThemeColor({}, 'accent');
  const primary = useThemeColor({}, 'primary');
  const primaryForeground = useThemeColor({}, 'primaryForeground');
  const green700 = '#047857'; // From frontend tailwind.config.js, or similar
  const green50 = '#F0FDF4'; // A light green for hover/selected states
  const green300 = '#86EFAC';
  const green400 = '#4ade80';
  const blue100 = '#DBEAFE'; // For event tags

  const styles = StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 24, // mb-6
    },
    monthYearText: {
      fontSize: 22, // text-2xl
      fontWeight: '500', // font-medium
      color: textColor, // text-gray-800
    },
    navButtons: {
      flexDirection: 'row',
      gap: 4, // gap-1
    },
    dayNamesContainer: {
      flexDirection: 'row',
      marginBottom: 12, // mb-3
    },
    dayName: {
      flex: 1, // grid-cols-7
      textAlign: 'center',
      fontSize: 12, // text-sm
      fontWeight: '500', // font-medium
      color: mutedForeground, // text-gray-600
      paddingVertical: 12, // py-3
      borderBottomWidth: 1,
      borderBottomColor: borderColor, // border-b border-gray-200
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dateCell: {
      minHeight: 112, // min-h-28 (28*4=112)
      width: `${100 / 7}%`, // grid-cols-7
      padding: 12, // p-3
      borderWidth: 1,
      borderColor: borderColor, // border border-gray-200
      transitionDuration: 200,
      justifyContent: 'flex-start',
      alignItems: 'flex-end', // Align date number to top-right
    },
    dateCellText: {
      fontSize: 14, // text-sm
      marginBottom: 8, // mb-2
      textAlign: 'right',
    },
    eventContainer: {
      width: '100%',
      alignItems: 'flex-end', // Align event names to the right
    },
    eventTag: {
      fontSize: 10, // text-xs
      paddingHorizontal: 8, // px-2
      paddingVertical: 4, // py-1
      borderRadius: 6, // rounded-md
      overflow: 'hidden', // truncate
      fontWeight: '500', // font-medium
      backgroundColor: blue100, // bg-blue-100
      color: '#1E40AF', // text-blue-800
      borderColor: '#BFDBFE', // border-blue-200
      marginBottom: 2,
    },
    moreEventsText: {
      fontSize: 10, // text-xs
      color: mutedForeground, // text-gray-500
      paddingHorizontal: 4, // px-1
      marginTop: 2,
    },
    // Dynamic styles
    todayCell: {
      backgroundColor: green50,
      borderColor: green400,
    },
    todayText: {
      color: green700,
      fontWeight: '600', // font-semibold
    },
    selectedCell: {
      borderColor: green700, // ring-2 ring-green-500
      backgroundColor: green50,
    },
    currentMonthCell: {
      backgroundColor: '#FFFFFF', // bg-white
    },
    otherMonthCell: {
      opacity: 0.5,
      backgroundColor: '#F9FAFB', // bg-gray-25, light gray
    },
    currentMonthText: {
      color: textColor, // text-gray-700
    },
    otherMonthText: {
      color: mutedForeground, // text-gray-400
    },
  });

  return (
    <View>
      {/* Header con navegación */}
      <View style={styles.header}>
        <Text style={styles.monthYearText}>
          {MONTHS[month]} {year}
        </Text>
        <View style={styles.navButtons}>
          <Button
            onPress={onPrevMonth}
            variant="outline"
            size="icon"
            style={{ borderColor: borderColor }} // Apply border color
          >
            <MaterialCommunityIcons name="chevron-left" size={16} color={textColor} />
          </Button>
          <Button
            onPress={onNextMonth}
            variant="outline"
            size="icon"
            style={{ borderColor: borderColor }} // Apply border color
          >
            <MaterialCommunityIcons name="chevron-right" size={16} color={textColor} />
          </Button>
        </View>
      </View>

      {/* Días de la semana */}
      <View style={styles.dayNamesContainer}>
        {DAYS.map((day) => (
          <Text key={day} style={styles.dayName}>
            {day}
          </Text>
        ))}
      </View>

      {/* Calendario */}
      <View style={styles.calendarGrid}>
        {days.map((date, index) => {
          const dateKey = getDateKey(date);
          const dayEvents = events[dateKey] || [];
          const currentMonth = isCurrentMonth(date);
          const today = isToday(date);
          const selected = isSelected(date);

          return (
            <TouchableOpacity
              key={index}
              onPress={() => onDateClick(date)}
              style={[
                styles.dateCell,
                !currentMonth && styles.otherMonthCell,
                currentMonth && styles.currentMonthCell,
                today && styles.todayCell,
                selected && styles.selectedCell,
              ]}
            >
              <Text style={[
                styles.dateCellText,
                !currentMonth && styles.otherMonthText,
                currentMonth && styles.currentMonthText,
                today && styles.todayText,
                selected && styles.todayText, // Apply selected text style if selected
              ]}>
                {date.getDate()}
              </Text>
              <View style={styles.eventContainer}>
                {dayEvents.slice(0, 2).map((event) => (
                  <Text
                    key={event.id}
                    style={styles.eventTag}
                    numberOfLines={1}
                  >
                    {event.title}
                  </Text>
                ))}
                {dayEvents.length > 2 && (
                  <Text style={styles.moreEventsText}>
                    +{dayEvents.length - 2} más
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
