import { useEffect, useState } from 'react';
import { useEventContext } from '../contexts/EventContext';
import type { Event } from '../types/api';

interface CalendarViewProps {
  onDateSelect?: (date: Date) => void;
  onEventSelect?: (event: Event) => void;
  className?: string;
}

interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: Event[];
}

export function CalendarView({ onDateSelect, onEventSelect, className = '' }: CalendarViewProps) {
  const {
    events,
    loading,
    error,
    currentMonth,
    selectedDate,
    loadEventsForMonth,
    setSelectedDate,
    nextMonth,
    previousMonth,
  } = useEventContext();

  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);

  // Generate calendar days for the current month
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    
    // Start from the first day of the week containing the first day of the month
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    // End at the last day of the week containing the last day of the month
    const endDate = new Date(lastDay);
    endDate.setDate(endDate.getDate() + (6 - lastDay.getDay()));
    
    const days: CalendarDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
      const currentDate = new Date(date);
      currentDate.setHours(0, 0, 0, 0);
      
      // Find events for this day
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.start_time);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === currentDate.getTime();
      });
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.getTime() === today.getTime(),
        events: dayEvents,
      });
    }
    
    setCalendarDays(days);
  }, [currentMonth, events]);

  // Load events when month changes
  useEffect(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth() + 1; // API expects 1-based month
    loadEventsForMonth(year, month);
  }, [currentMonth, loadEventsForMonth]);

  const handleDateClick = (day: CalendarDay) => {
    setSelectedDate(day.date);
    onDateSelect?.(day.date);
  };

  const handleEventClick = (event: Event, e: React.MouseEvent) => {
    e.stopPropagation();
    onEventSelect?.(event);
  };

  const formatMonthYear = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (error) {
    // Normalize error into a safe message before rendering.
    const message = error instanceof Error ? error.message : String(error);
    // Avoid rendering "[object Object]" for generic objects.
    const safeMessage = message === '[object Object]' ? 'Unknown error' : message;

    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-600">Error loading calendar: {safeMessage}</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Calendar Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <button
          onClick={previousMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={loading}
          aria-label="Previous month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <h2 className="text-lg font-semibold text-gray-900">
          {formatMonthYear(currentMonth)}
        </h2>
        
        <button
          onClick={nextMonth}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          disabled={loading}
          aria-label="Next month"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="p-4 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
            Loading calendar...
          </div>
        </div>
      )}

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Week day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {weekDays.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day) => {
            const isSelected = selectedDate && 
              day.date.getTime() === selectedDate.getTime();
            
            return (
              <div
                key={day.date.getTime()}
                onClick={() => handleDateClick(day)}
                onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && handleDateClick(day)}
                role="button"
                tabIndex={0}
                aria-selected={!!isSelected}
                aria-current={day.isToday ? 'date' : undefined}
                className={`
                  min-h-[80px] p-1 border rounded-lg cursor-pointer transition-colors
                  ${day.isCurrentMonth 
                    ? 'bg-white hover:bg-gray-50' 
                    : 'bg-gray-50 text-gray-400'
                  }
                  ${day.isToday ? 'ring-2 ring-blue-500' : ''}
                  ${isSelected ? 'bg-blue-50 border-blue-300' : 'border-gray-200'}
                `}
              >
                {/* Day number */}
                <div className={`
                  text-sm font-medium mb-1
                  ${day.isToday ? 'text-blue-600' : ''}
                  ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                `}>
                  {day.date.getDate()}
                </div>

                {/* Events */}
                <div className="space-y-1">
                  {day.events.slice(0, 2).map(event => (
                    <div
                      key={event.id}
                      onClick={(e) => handleEventClick(event, e)}
                      className="text-xs p-1 bg-blue-100 text-blue-800 rounded truncate hover:bg-blue-200 transition-colors"
                      title={`${event.title} - ${formatTime(event.start_time)}`}
                    >
                      {formatTime(event.start_time)} {event.title}
                    </div>
                  ))}
                  
                  {/* Show more indicator */}
                  {day.events.length > 2 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{day.events.length - 2} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}