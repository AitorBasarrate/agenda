import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

interface EventModalProps {
  isOpen: boolean;
  selectedDate: Date | null;
  onClose: () => void;
  onSave: (event: {
    title: string;
    time: string;
    description: string;
    color: string;
  }) => void;
}

const COLORS = [
  { name: "Verde Bosque", class: "bg-green-100 text-green-800 border-green-200" },
  { name: "Verde Oscuro", class: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { name: "Verde Musgo", class: "bg-lime-100 text-lime-800 border-lime-200" },
  { name: "Tierra", class: "bg-amber-100 text-amber-800 border-amber-200" },
  { name: "Madera", class: "bg-orange-100 text-orange-800 border-orange-200" },
  { name: "Piedra", class: "bg-slate-100 text-slate-800 border-slate-200" },
];

export function EventModal({ isOpen, selectedDate, onClose, onSave }: EventModalProps) {
  const [title, setTitle] = useState("");
  const [time, setTime] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0].class);

  if (!isOpen || !selectedDate) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    onSave({
      title,
      time,
      description,
      color: selectedColor,
    });

    // Limpiar formulario
    setTitle("");
    setTime("");
    setDescription("");
    setSelectedColor(COLORS[0].class);
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
            <p className="text-sm text-gray-600 mb-4 capitalize">{dateStr}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Título del evento</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Reunión con el equipo"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Hora</Label>
            <Input
              id="time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
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

          <div className="space-y-2">
            <Label>Color</Label>
            <div className="grid grid-cols-3 gap-2">
              {COLORS.map((color) => (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => setSelectedColor(color.class)}
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${color.class}
                    ${selectedColor === color.class ? "ring-2 ring-offset-2 ring-gray-400" : ""}
                  `}
                >
                  {color.name}
                </button>
              ))}
            </div>
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