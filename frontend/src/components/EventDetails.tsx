import { useState } from 'react';
import { useEventContext } from '../contexts/EventContext';
import type { Event } from '../types/api';

interface EventDetailsProps {
  event: Event;
  onEdit?: (event: Event) => void;
  onClose?: () => void;
  className?: string;
}

export function EventDetails({ event, onEdit, onClose, className = '' }: EventDetailsProps) {
  const { deleteEvent, loading } = useEventContext();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      time: date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };
  };

  // Calculate duration
  const calculateDuration = () => {
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours === 0) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffMinutes === 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      return `${diffHours}h ${diffMinutes}m`;
    }
  };

  // Handle delete
  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteEvent(event.id);
      if (success) {
        onClose?.();
      }
    } catch (error) {
      // Error is handled by the context
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Handle edit
  const handleEdit = () => {
    onEdit?.(event);
  };

  const startDateTime = formatDateTime(event.start_time);
  const endDateTime = formatDateTime(event.end_time);
  const isSameDay = startDateTime.date === endDateTime.date;
  const duration = calculateDuration();

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between p-6 border-b">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {event.title}
          </h2>
          <div className="flex items-center text-sm text-gray-500">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{duration}</span>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close event details"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-6 space-y-4">
        {/* Date and Time */}
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-2">Date & Time</h3>
          <div className="space-y-1">
            <div className="flex items-center text-sm text-gray-900">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">Start:</span>
              <span className="ml-2">{startDateTime.date} at {startDateTime.time}</span>
            </div>
            <div className="flex items-center text-sm text-gray-900">
              <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium">End:</span>
              <span className="ml-2">
                {isSameDay ? endDateTime.time : `${endDateTime.date} at ${endDateTime.time}`}
              </span>
            </div>
          </div>
        </div>

        {/* Description */}
        {event.description && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-sm text-gray-900 whitespace-pre-wrap">
              {event.description}
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-gray-500">
            <div>
              <span className="font-medium">Created:</span>
              <span className="ml-1">
                {new Date(event.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div>
              <span className="font-medium">Updated:</span>
              <span className="ml-1">
                {new Date(event.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center p-6 border-t bg-gray-50">
        <div>
          {showDeleteConfirm ? (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Delete this event?</span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Yes'}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading}
              className="flex items-center px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              Delete
            </button>
          )}
        </div>

        <div className="flex space-x-2">
          {onEdit && (
            <button
              onClick={handleEdit}
              disabled={loading}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit
            </button>
          )}
        </div>
      </div>
    </div>
  );
}