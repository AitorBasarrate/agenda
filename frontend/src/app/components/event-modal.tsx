<<<<<<< Updated upstream
import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
=======
import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Event {
  id: number;
  title: string;
  time: string;
  description: string;
  color: string;
  date: string;
}
>>>>>>> Stashed changes

interface EventModalProps {
  isOpen: boolean;
  selectedDate: Date | null;
<<<<<<< Updated upstream
  onClose: () => void;
  onSave: (event: {
    title: string;
    startTime: string;
    endTime: string;
    description: string;
  }) => void;
=======
  isDark: boolean;
  isMobile: boolean;
  viewEvent?: Event | null;
  onDelete?: (eventId: number) => void;
>>>>>>> Stashed changes
}

export function EventModal({ isOpen, selectedDate, onClose, onSave }: EventModalProps) {
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [description, setDescription] = useState("");

  if (!isOpen || !selectedDate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    onSave({
      title,
      startTime: startTime || "12:13",
      endTime: endTime || "13:12",
      description,
    });

    // Limpiar formulario y cerrar modal
    setTitle("");
    setStartTime("");
    setEndTime("");
    setDescription("");
    onClose();
  };

  const dateStr = selectedDate.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <h3 className="text-xl">Agregar Evento</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
<<<<<<< Updated upstream
            <p className="text-sm text-gray-600 mb-4 capitalize">{dateStr}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título del evento</Label>
            <Input
              id="title"
=======
            <label 
              htmlFor="event-title"
              className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Título *
            </label>
            <input
              id="event-title"
              type="text"
>>>>>>> Stashed changes
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Reunión con el equipo"
              required
            />
          </div>

<<<<<<< Updated upstream
          <div className="space-y-2">
            <Label htmlFor="startTime">Hora Inicio</Label>
            <Input
              id="startTime"
=======
          {/* Time */}
          <div>
            <label 
              htmlFor="event-time"
              className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
            >
              Hora
            </label>
            <input
              id="event-time"
>>>>>>> Stashed changes
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endTime">Hora Final</Label>
            <Input
              id="endTime"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalles del evento..."
              rows={3}
            />
          </div>



          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1">
              Guardar Evento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
