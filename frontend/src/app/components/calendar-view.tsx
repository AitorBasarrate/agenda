import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

import { type Event } from "../../types";

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

  // Obtener primer día del mes y cantidad de días
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  // Ajustar para que lunes sea 0 (en lugar de domingo)
  const firstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Crear array de días a mostrar
  const days: (Date | null)[] = [];

  // Días del mes anterior
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push(new Date(year, month - 1, daysInPrevMonth - i));
  }

  // Días del mes actual
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(year, month, i));
  }

  // Días del mes siguiente
  const remainingDays = 42 - days.length; // 6 semanas x 7 días
  for (let i = 1; i <= remainingDays; i++) {
    days.push(new Date(year, month + 1, i));
  }

  const getDateKey = (date: Date) => {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
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

  return (
    <div>
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-medium text-gray-800">
          {MONTHS[month]} {year}
        </h2>
        <div className="flex gap-1">
          <Button
            onClick={onPrevMonth}
            variant="outline"
            size="icon"
            className="h-9 w-9 hover:bg-green-50 hover:border-green-300"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            onClick={onNextMonth}
            variant="outline"
            size="icon"
            className="h-9 w-9 hover:bg-green-50 hover:border-green-300"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-3">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-gray-600 py-3 border-b border-gray-200">
            {day}
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div className="grid grid-cols-7">
        {days.map((date, index) => {
          if (!date) return <div key={index} />;

          const dateKey = getDateKey(date);
          const dayEvents = events[dateKey] || [];
          const isCurrent = isCurrentMonth(date);

          return (
            <button
              key={index}
              onClick={() => onDateClick(date)}
              className={`
                min-h-28 p-3 border border-gray-200 transition-all duration-200
                hover:bg-green-50 hover:border-green-300 hover:shadow-sm
                focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1
                ${isToday(date) ? "bg-green-50 border-green-400 shadow-sm" : ""}
                ${isSelected(date) ? "ring-2 ring-green-500 bg-green-50" : ""}
                ${!isCurrent ? "opacity-50 bg-gray-25" : "bg-white"}
              `}
            >
              <div className={`text-right text-sm mb-2 ${
                isToday(date)
                  ? "text-green-700 font-semibold"
                  : isCurrent
                    ? "text-gray-700"
                    : "text-gray-400"
              }`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs px-2 py-1 rounded-md truncate font-medium bg-blue-100 text-blue-800 border-blue-200`}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{dayEvents.length - 2} más
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
