import { X } from 'lucide-react';
import { useState, useEffect } from 'react';

interface Event {
  id: string;
  title: string;
  time: string;
  description: string;
  color: string;
  date: string;
}

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Omit<Event, 'id'>) => void;
  selectedDate: Date | null;
  isDark: boolean;
  isMobile: boolean;
  viewEvent?: Event | null;
  onDelete?: (eventId: string) => void;
}

export function EventModal({
  isOpen,
  onClose,
  onSave,
  selectedDate,
  isDark,
  isMobile,
  viewEvent,
  onDelete,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('12:00');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('bg-[#80BF41]');

  useEffect(() => {
    if (viewEvent) {
      setTitle(viewEvent.title);
      setTime(viewEvent.time);
      setDescription(viewEvent.description);
      setColor(viewEvent.color);
    } else {
      setTitle('');
      setTime('12:00');
      setDescription('');
      setColor('bg-[#80BF41]');
    }
  }, [viewEvent, isOpen]);

  const colors = [
    { name: 'Verde Claro', value: 'bg-[#E7F2E4]', class: 'bg-[#E7F2E4] text-[#4a5f3f] border-[#80BF41]' },
    { name: 'Verde', value: 'bg-[#80BF41]', class: 'bg-[#80BF41] text-white border-[#80BF41]' },
    { name: 'Lima', value: 'bg-[#B1D923]', class: 'bg-[#B1D923] text-[#1a1a1a] border-[#B1D923]' },
    { name: 'Naranja', value: 'bg-[#F27405]', class: 'bg-[#F27405] text-white border-[#F27405]' },
    { name: 'Gris', value: 'bg-[#F2F2F2]', class: 'bg-[#F2F2F2] text-gray-800 border-gray-300' },
    { name: 'Verde Oscuro', value: 'bg-emerald-700', class: 'bg-emerald-700 text-white border-emerald-700' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !selectedDate) return;

    const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;

    onSave({
      title: title.trim(),
      time,
      description: description.trim(),
      color,
      date: dateKey,
    });

    setTitle('');
    setTime('12:00');
    setDescription('');
    setColor('bg-[#80BF41]');
  };

  const handleDelete = () => {
    if (viewEvent && onDelete) {
      onDelete(viewEvent.id);
      onClose();
    }
  };

  if (!isOpen || !selectedDate) return null;

  const formatDate = (date: Date) => {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return `${days[date.getDay()]}, ${date.getDate()} de ${months[date.getMonth()]}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div
        className={`
          ${isDark ? 'bg-gray-800 text-white' : 'bg-white'}
          rounded-2xl shadow-2xl
          ${isMobile ? 'w-full max-w-md max-h-[90vh]' : 'w-full max-w-lg'}
          overflow-hidden flex flex-col
        `}
      >
        {/* Header */}
        <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div>
            <h2 className="text-xl font-bold">
              {viewEvent ? 'Detalles del Evento' : 'Nuevo Evento'}
            </h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              {formatDate(selectedDate)}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg hover:bg-gray-200 ${isDark ? 'hover:bg-gray-700' : ''} transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Reunión de equipo"
              className={`
                w-full px-4 py-2 rounded-lg border
                ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}
                focus:outline-none focus:ring-2 focus:ring-[#80BF41]
              `}
              required
              disabled={!!viewEvent}
            />
          </div>

          {/* Time */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Hora
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className={`
                w-full px-4 py-2 rounded-lg border
                ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'}
                focus:outline-none focus:ring-2 focus:ring-[#80BF41]
              `}
              disabled={!!viewEvent}
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Descripción
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Agrega detalles sobre el evento..."
              rows={3}
              className={`
                w-full px-4 py-2 rounded-lg border resize-none
                ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-300'}
                focus:outline-none focus:ring-2 focus:ring-[#80BF41]
              `}
              disabled={!!viewEvent}
            />
          </div>

          {/* Color picker */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Color
            </label>
            <div className="grid grid-cols-3 gap-2">
              {colors.map((colorOption) => (
                <button
                  key={colorOption.value}
                  type="button"
                  onClick={() => !viewEvent && setColor(colorOption.value)}
                  disabled={!!viewEvent}
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${colorOption.class}
                    ${color === colorOption.value ? 'ring-2 ring-offset-2 ring-[#80BF41] scale-105' : 'opacity-70 hover:opacity-100'}
                    ${viewEvent ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <div className="text-xs font-medium">{colorOption.name}</div>
                </button>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className={`flex gap-2 p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          {viewEvent ? (
            <>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
              >
                Eliminar
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
              >
                Cerrar
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onClose}
                className={`
                  flex-1 px-4 py-2 rounded-lg font-medium transition-colors
                  ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'}
                `}
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim()}
                className="flex-1 px-4 py-2 bg-[#80BF41] text-white rounded-lg hover:bg-[#B1D923] disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                Guardar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
