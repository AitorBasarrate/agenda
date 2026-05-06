import { useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  time: string;
  description: string;
  color: string;
  date: string;
}

interface CollapsibleCalendarProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: Record<string, Event[]>;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onDateClick: (date: Date) => void;
  onSelectedDateChange: (date: Date) => void;
  isDark: boolean;
}

const MONTH_NAMES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

const DAY_NAMES = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

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

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
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
    return (events[getDateKey(date)]?.length || 0) > 0;
  };

  const weekDays = getCurrentWeekDays();
  const monthDays = getMonthDays();
  const weekNumber = Math.ceil((selectedDate || new Date()).getDate() / 7);

  return (
    <div
      className={`sticky top-0 z-30 ${
        isDark ? 'bg-gray-900' : 'bg-gray-50'
      } rounded-b-3xl shadow-lg overflow-hidden transition-all duration-300`}
    >
      {/* Header */}
      <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-800' : 'border-gray-200'}`}>
        <div className="flex items-center justify-between">
          <button
            onClick={onPrevMonth}
            className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
            }`}
          >
            <ChevronLeft className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800/50' : 'hover:bg-gray-200/50'
            }`}
          >
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
              {isExpanded
                ? `${MONTH_NAMES[currentDate.getMonth()]} ${currentDate.getFullYear()}`
                : `Semana ${weekNumber}`}
            </span>
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${
                isExpanded ? 'rotate-180' : ''
              } ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            />
          </button>

          <button
            onClick={onNextMonth}
            className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-200'
            }`}
          >
            <ChevronRight className={`h-5 w-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </button>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="px-4 pb-4 pt-2">
        {/* Day names */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_NAMES.map((day) => (
            <div
              key={day}
              className={`text-center text-xs font-medium py-1 ${
                isDark ? 'text-gray-500' : 'text-gray-600'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Week view (collapsed) */}
        {!isExpanded && (
          <div className="grid grid-cols-7 gap-1">
            {weekDays.map((date, index) => {
              const isTodayDate = isToday(date);
              const isSelectedDate = isSelected(date);
              const hasEventsDate = hasEvents(date);

              return (
                <button
                  key={index}
                  onClick={() => {
                    onSelectedDateChange(date);
                    onDateClick(date);
                  }}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all ${
                    isSelectedDate || isTodayDate
                      ? 'bg-[#80BF41] text-white scale-110 shadow-md'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-800'
                        : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-lg font-semibold">{date.getDate()}</span>
                  {hasEventsDate && !isSelectedDate && !isTodayDate && (
                    <div className="w-1 h-1 rounded-full bg-[#B1D923] mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Month view (expanded) */}
        {isExpanded && (
          <div className="grid grid-cols-7 gap-1">
            {monthDays.map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const isTodayDate = isToday(date);
              const isSelectedDate = isSelected(date);
              const hasEventsDate = hasEvents(date);

              return (
                <button
                  key={index}
                  onClick={() => {
                    onSelectedDateChange(date);
                    onDateClick(date);
                  }}
                  className={`aspect-square flex flex-col items-center justify-center rounded-xl transition-all ${
                    isSelectedDate || isTodayDate
                      ? 'bg-[#80BF41] text-white scale-105 shadow-md'
                      : isDark
                        ? 'text-gray-300 hover:bg-gray-800'
                        : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="text-sm font-semibold">{date.getDate()}</span>
                  {hasEventsDate && !isSelectedDate && !isTodayDate && (
                    <div className="w-1 h-1 rounded-full bg-[#B1D923] mt-1" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
