<<<<<<< Updated upstream
import { Clock, Trash2, Calendar, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { type Event } from "../../types/index";
=======
import { Clock, Calendar } from 'lucide-react';

interface Event {
  id: number;
  title: string;
  time: string;
  description: string;
  color: string;
  date: string;
}
>>>>>>> Stashed changes

interface EventListProps {
  selectedDate: Date | null;
  events: Event[];
  onDeleteEvent: (id: number) => void;
  onAddEvent: () => void;
}

export function EventList({ selectedDate, events, onDeleteEvent, onAddEvent}: EventListProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-green-700" />
        <h2 className="text-2xl grow">Eventos del Día</h2>
        <Button
          size="icon"
          className="h-10 w-10 bg-green-600 hover:bg-green-700 focus:ring-green-500"
          onClick={onAddEvent}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {selectedDate ? (
        <>
          <p className="text-sm text-gray-600 mb-4 capitalize">
            {formatDate(selectedDate)}
          </p>
          {events.length > 0 ? (
            <div className="space-y-3">
              {events.map((event) => (
                <div
                  key={event.id}
                  className={`p-4 rounded-lg border-l-4 group relative border-green-200 hover:border-green-400`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{event.title}</h3>
                      {event.start_time && (
                        <div className="flex items-center gap-1 text-sm mb-2">
                          <Clock className="h-3 w-3" />
                          <span>
                            {new Date(event.start_time).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {" - "}
                            {new Date(event.end_time).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      )}
                      {event.description && (
                        <p className="text-sm text-gray-600 mt-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDeleteEvent(event.id)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No hay eventos para este día</p>
              <p className="text-sm">Haz clic en el día para agregar uno</p>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-gray-400">
          <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>Selecciona un día del calendario</p>
          <p className="text-sm">para ver sus eventos</p>
        </div>
      )}
    </div>
  );
}
