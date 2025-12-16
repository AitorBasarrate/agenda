import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";

interface CalendarViewProps {
  currentDate: Date;
  selectedDate: Date | null;
  events: Record<string, { id: string; title: string; time: string; color: string }[]>;
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
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl">
          {MONTHS[month]} {year}
        </h2>
        <div className="flex gap-2">
          <Button onClick={onPrevMonth} variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button onClick={onNextMonth} variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 mb-2">
        {DAYS.map((day) => (
          <div key={day} className="text-center text-gray-500 py-2 border-b">
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
                min-h-24 p-2 border transition-all
                hover:bg-green-50 hover:z-10
                ${isToday(date) ? "bg-green-50 border-green-600" : "border-gray-200"}
                ${isSelected(date) ? "ring-2 ring-green-500 ring-inset z-10" : ""}
                ${!isCurrent ? "opacity-40 bg-gray-50" : ""}
              `}
            >
              <div className={`text-right text-xs px-1 ${isToday(date) ? "text-green-700 font-semibold" : "text-gray-600"}`}>
                {date.getDate()}
              </div>
              <div className="space-y-1">
                {dayEvents.slice(0, 2).map((event) => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded truncate ${event.color}`}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-xs text-gray-500">
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