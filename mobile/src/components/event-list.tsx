import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from './ui/button';
import { type Event } from '../../src/types';
import { useThemeColor } from '@/hooks/use-theme-color';

interface EventListProps {
  selectedDate: Date | null;
  events: Event[];
  onDeleteEvent: (id: number) => void;
  onAddEvent: () => void;
}

export function EventList({ selectedDate, events, onDeleteEvent, onAddEvent }: EventListProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const mutedForeground = useThemeColor({}, 'mutedForeground');
  const greenPrimary = '#22C55E'; // bg-green-600
  const green700 = '#047857'; // text-green-700
  const green200 = '#9AE6B4'; // border-green-200
  const green400 = '#4ade80'; // hover:border-green-400
  const red500 = '#EF4444'; // text-red-500
  const gray400 = '#9CA3AF'; // text-gray-400

  const styles = StyleSheet.create({
    container: {
      backgroundColor: backgroundColor, // bg-white
      borderRadius: 8, // rounded-lg
      shadowColor: '#000', // shadow-lg (simplified)
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 3.84,
      elevation: 5,
      padding: 24, // p-6
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8, // gap-2
      marginBottom: 16, // mb-4
    },
    headerTitle: {
      fontSize: 22, // text-2xl
      flexGrow: 1, // grow
      color: textColor,
    },
    addButton: {
      height: 40, // h-10 w-10
      width: 40,
      backgroundColor: greenPrimary,
      borderRadius: 6,
    },
    dateText: {
      fontSize: 14, // text-sm
      color: mutedForeground, // text-gray-600
      marginBottom: 16, // mb-4
      textTransform: 'capitalize',
    },
    eventList: {
      // space-y-3
    },
    eventItem: {
      padding: 16, // p-4
      borderLeftWidth: 4, // border-l-4
      borderLeftColor: green200, // border-green-200
      borderRadius: 8, // rounded-lg
      position: 'relative',
      marginBottom: 12, // For space-y-3
    },
    eventItemHover: {
      borderLeftColor: green400, // hover:border-green-400
    },
    eventContent: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 8, // gap-2
    },
    eventDetails: {
      flex: 1, // flex-1
    },
    eventTitle: {
      fontWeight: '500', // font-medium
      marginBottom: 4, // mb-1
      color: textColor,
    },
    eventTimeContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4, // gap-1
      fontSize: 12, // text-sm
      marginBottom: 8, // mb-2
      color: mutedForeground,
    },
    eventDescription: {
      fontSize: 14, // text-sm
      color: mutedForeground, // text-gray-600
      marginTop: 8, // mt-2
    },
    deleteButton: {
      // opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0
      // For React Native, this needs explicit state or animation
      padding: 8,
      borderRadius: 20,
    },
    deleteButtonIcon: {
      color: red500, // text-red-500
    },
    emptyState: {
      textAlign: 'center',
      paddingVertical: 64, // py-8
      color: gray400,
      alignItems: 'center',
    },
    emptyStateIcon: {
      marginBottom: 8, // mb-2
      opacity: 0.5,
      color: gray400,
    },
    emptyStateText: {
      fontSize: 16,
      color: gray400,
    },
    emptyStateSmallText: {
      fontSize: 12, // text-sm
      color: gray400,
    }
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="calendar-month" size={20} color={green700} />
        <Text style={styles.headerTitle}>Eventos del Día</Text>
        <Button
          size="icon"
          style={styles.addButton}
          onPress={onAddEvent}
        >
          <MaterialCommunityIcons name="plus" size={16} color="#FFFFFF" />
        </Button>
      </View>
      {selectedDate ? (
        <>
          <Text style={styles.dateText}>
            {formatDate(selectedDate)}
          </Text>
          {events.length > 0 ? (
            <ScrollView style={styles.eventList}>
              {events.map((event) => (
                <View
                  key={event.id}
                  style={[styles.eventItem]} // Hover effect will be harder to replicate directly
                >
                  <View style={styles.eventContent}>
                    <View style={styles.eventDetails}>
                      <Text style={styles.eventTitle}>{event.title}</Text>
                      {event.start_time && (
                        <View style={styles.eventTimeContainer}>
                          <MaterialCommunityIcons name="clock-outline" size={12} color={mutedForeground} />
                          <Text style={styles.eventTimeContainer}>
                            {new Date(event.start_time).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" - "}
                            {new Date(event.end_time).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </View>
                      )}
                      {event.description && (
                        <Text style={styles.eventDescription}>
                          {event.description}
                        </Text>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => onDeleteEvent(event.id)}
                      style={styles.deleteButton}
                    >
                      <MaterialCommunityIcons name="trash-can-outline" size={16} style={styles.deleteButtonIcon} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-remove-outline" size={40} style={styles.emptyStateIcon} />
              <Text style={styles.emptyStateText}>No hay eventos para este día</Text>
              <Text style={styles.emptyStateSmallText}>Haz clic en el día para agregar uno</Text>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={40} style={styles.emptyStateIcon} />
          <Text style={styles.emptyStateText}>Selecciona un día del calendario</Text>
          <Text style={styles.emptyStateSmallText}>para ver sus eventos</Text>
        </View>
      )}
    </View>
  );
}
