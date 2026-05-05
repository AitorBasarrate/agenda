import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  time: string;
  description: string;
  color: string;
  date: string;
}

interface CalendarViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: Record<string, Event[]>;
  onDateClick: (date: Date) => void;
  onMonthChange: (direction: 'prev' | 'next') => void;
  isMobile: boolean;
  isDark: boolean;
}

export function CalendarView({
  currentDate,
  selectedDate,
  events,
  onDateClick,
  onMonthChange,
  isMobile,
  isDark,
}: CalendarViewProps) {
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const dayNames = isMobile
    ? ['L', 'M', 'X', 'J', 'V', 'S', 'D']
    : ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Get the day of week (0 = Sunday, 1 = Monday, etc.)
    let firstDayOfWeek = firstDay.getDay();
    // Convert to Monday = 0
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const days: (Date | null)[] = [];

    // Add previous month's days
    const prevMonth = new Date(year, month, 0);
    const prevMonthDays = prevMonth.getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push(new Date(year, month - 1, prevMonthDays - i));
    }

    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Add next month's days to fill the grid
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const days = getDaysInMonth(currentDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isToday = (date: Date) => {
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  };

  const getEventColor = (color: string) => {
    const colors: Record<string, string> = {
      'bg-[#E7F2E4]': 'bg-[#E7F2E4] text-[#4a5f3f] border-[#80BF41]',
      'bg-[#80BF41]': 'bg-[#80BF41] text-white border-[#80BF41]',
      'bg-[#B1D923]': 'bg-[#B1D923] text-[#1a1a1a] border-[#B1D923]',
      'bg-[#F27405]': 'bg-[#F27405] text-white border-[#F27405]',
      'bg-[#F2F2F2]': 'bg-[#F2F2F2] text-gray-800 border-gray-300',
      'bg-emerald-700': 'bg-emerald-700 text-white border-emerald-700',
    };
    return colors[color] || color;
  };

  return (
    <div className={`${isDark ? 'bg-gray-900 text-white' : 'bg-white'} rounded-2xl ${isMobile ? 'p-2' : 'p-6'} shadow-lg h-full`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => onMonthChange('prev')}
          className={`p-2 rounded-lg hover:bg-[#80BF41] hover:text-white transition-colors ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}
        >
          <ChevronLeft className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
        </button>
        <h2 className={`font-bold ${isMobile ? 'text-lg' : 'text-2xl'}`}>
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button
          onClick={() => onMonthChange('next')}
          className={`p-2 rounded-lg hover:bg-[#80BF41] hover:text-white transition-colors ${
            isDark ? 'text-white' : 'text-gray-700'
          }`}
        >
          <ChevronRight className={isMobile ? 'w-5 h-5' : 'w-6 h-6'} />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 mb-2">
        {dayNames.map((day) => (
          <div
            key={day}
            className={`text-center font-semibold text-[#80BF41] ${isMobile ? 'text-xs py-1' : 'text-sm py-2'}`}
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((date, index) => {
          if (!date) return null;

          const dateKey = getDateKey(date);
          const dateEvents = events[dateKey] || [];
          const isCurrentMonthDay = isCurrentMonth(date);
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);

          return (
            <button
              key={index}
              onClick={() => onDateClick(date)}
              className={`
                relative border ${isDark ? 'border-gray-700' : 'border-gray-200'}
                ${isMobile ? 'h-12 p-1' : 'h-24 p-2'}
                transition-all hover:bg-[#E7F2E4] hover:bg-opacity-50
                ${isSelectedDate ? 'ring-2 ring-[#80BF41]' : ''}
                ${isTodayDate && !isSelectedDate ? 'bg-[#E7F2E4] bg-opacity-30' : ''}
                ${!isCurrentMonthDay ? 'opacity-40' : ''}
                active:scale-95
              `}
            >
              {/* Date number */}
              <div className="flex justify-end">
                <span
                  className={`
                    ${isMobile ? 'text-xs' : 'text-sm'} font-medium
                    ${isTodayDate ? 'bg-[#80BF41] text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}
                    ${isDark && !isTodayDate ? 'text-white' : !isTodayDate ? 'text-gray-700' : ''}
                  `}
                >
                  {date.getDate()}
                </span>
              </div>

              {/* Events */}
              {isMobile ? (
                // Mobile: show dots
                <div className="flex gap-0.5 justify-center mt-1 flex-wrap">
                  {dateEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`w-1.5 h-1.5 rounded-full ${event.color}`}
                    />
                  ))}
                  {dateEvents.length > 3 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                  )}
                </div>
              ) : (
                // Desktop: show event chips
                <div className="mt-1 space-y-0.5">
                  {dateEvents.slice(0, 3).map((event) => (
                    <div
                      key={event.id}
                      className={`text-xs px-1 py-0.5 rounded truncate border ${getEventColor(event.color)}`}
                    >
                      {event.title}
                    </div>
                  ))}
                  {dateEvents.length > 3 && (
                    <div className="text-xs text-gray-500 px-1">
                      +{dateEvents.length - 3} más
                    </div>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
