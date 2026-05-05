import { Clock, Calendar } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  time: string;
  description: string;
  color: string;
  date: string;
}

interface EventListProps {
  events: Event[];
  selectedDate: Date | null;
  onEventClick: (event: Event) => void;
  isDark: boolean;
  isMobile: boolean;
}

export function EventList({
  events,
  selectedDate,
  onEventClick,
  isDark,
  isMobile,
}: EventListProps) {
  const formatDate = (date: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  const getBorderColor = (color: string) => {
    const colorMap: Record<string, string> = {
      'bg-[#E7F2E4]': 'border-l-[#80BF41]',
      'bg-[#80BF41]': 'border-l-[#80BF41]',
      'bg-[#B1D923]': 'border-l-[#B1D923]',
      'bg-[#F27405]': 'border-l-[#F27405]',
      'bg-[#F2F2F2]': 'border-l-gray-300',
      'bg-emerald-700': 'border-l-emerald-700',
    };
    return colorMap[color] || 'border-l-gray-400';
  };

  const sortedEvents = [...events].sort((a, b) => {
    return a.time.localeCompare(b.time);
  });

  return (
    <div className={`${isDark ? 'bg-gray-900 text-white' : 'bg-white'} rounded-2xl ${isMobile ? 'p-4' : 'p-6'} shadow-lg h-full overflow-y-auto`}>
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-[#80BF41]" />
        <h2 className={`${isMobile ? 'text-xl' : 'text-2xl'} font-bold text-[#80BF41]`}>
          Eventos del Día
        </h2>
      </div>

      {selectedDate && (
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
          {formatDate(selectedDate)}
        </p>
      )}

      <div className="space-y-3">
        {sortedEvents.length === 0 ? (
          <div className="text-center py-8">
            <Clock className={`w-12 h-12 mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              No hay eventos para este día
            </p>
            <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-500'} mt-1`}>
              Haz clic en una fecha para agregar un evento
            </p>
          </div>
        ) : (
          sortedEvents.map((event) => (
            <button
              key={event.id}
              onClick={() => onEventClick(event)}
              className={`
                w-full text-left p-4 rounded-2xl border-l-4 transition-all
                ${isDark ? 'bg-gray-800/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'}
                ${getBorderColor(event.color)}
                hover:shadow-md active:scale-95
              `}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {event.title}
                </h3>
                <div className="flex items-center gap-1 text-xs text-[#80BF41] flex-shrink-0">
                  <Clock className="w-3 h-3" />
                  <span>{event.time}</span>
                </div>
              </div>
              {event.description && (
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} line-clamp-2`}>
                  {event.description}
                </p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
