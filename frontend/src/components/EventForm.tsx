import React, { useState, useEffect } from 'react';
import { useEventContext } from '../contexts/EventContext';
import type { Event, CreateEventRequest, UpdateEventRequest } from '../types/api';

interface EventFormProps {
  event?: Event | null;
  initialDate?: Date;
  onSubmit?: (event: Event) => void;
  onCancel?: () => void;
  className?: string;
}

interface FormData {
  title: string;
  description: string;
  start_time: string;
  end_time: string;
}

interface FormErrors {
  title?: string;
  start_time?: string;
  end_time?: string;
  general?: string;
}

export function EventForm({ 
  event, 
  initialDate, 
  onSubmit, 
  onCancel, 
  className = '' 
}: EventFormProps) {
  const { createEvent, updateEvent, loading, error } = useEventContext();
  
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    start_time: '',
    end_time: '',
  });
  
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form data
  useEffect(() => {
    if (event) {
      // Editing existing event
      const startDate = new Date(event.start_time);
      const endDate = new Date(event.end_time);
      
      setFormData({
        title: event.title,
        description: event.description || '',
        start_time: formatDateTimeLocal(startDate),
        end_time: formatDateTimeLocal(endDate),
      });
    } else if (initialDate) {
      // Creating new event with initial date
      const start = new Date(initialDate);
      start.setHours(9, 0, 0, 0); // Default to 9 AM
      
      const end = new Date(start);
      end.setHours(10, 0, 0, 0); // Default to 10 AM (1 hour duration)
      
      setFormData({
        title: '',
        description: '',
        start_time: formatDateTimeLocal(start),
        end_time: formatDateTimeLocal(end),
      });
    }
  }, [event, initialDate]);

  // Format date for datetime-local input
  const formatDateTimeLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // Validate form data
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.start_time) {
      newErrors.start_time = 'Start time is required';
    }

    if (!formData.end_time) {
      newErrors.end_time = 'End time is required';
    }

    if (formData.start_time && formData.end_time) {
      const startDate = new Date(formData.start_time);
      const endDate = new Date(formData.end_time);
      
      if (endDate <= startDate) {
        newErrors.end_time = 'End time must be after start time';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field
    if (errors[name as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        start_time: new Date(formData.start_time).toISOString(),
        end_time: new Date(formData.end_time).toISOString(),
      };

      let result: Event | null = null;

      if (event) {
        // Update existing event
        result = await updateEvent(event.id, eventData as UpdateEventRequest);
      } else {
        // Create new event
        result = await createEvent(eventData as CreateEventRequest);
      }

      if (result) {
        onSubmit?.(result);
      }
    } catch (err) {
      setErrors({ general: 'Failed to save event. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle start time change - auto-adjust end time
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const startTime = e.target.value;
    setFormData(prev => {
      const newData = { ...prev, start_time: startTime };
      
      // If end time is not set or is before new start time, adjust it
      if (!prev.end_time || new Date(prev.end_time) <= new Date(startTime)) {
        const startDate = new Date(startTime);
        const endDate = new Date(startDate);
        endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration
        newData.end_time = formatDateTimeLocal(endDate);
      }
      
      return newData;
    });
    
    // Clear errors
    if (errors.start_time) {
      setErrors(prev => ({ ...prev, start_time: undefined }));
    }
  };

  const isEditing = !!event;

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      <div className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {isEditing ? 'Edit Event' : 'Create New Event'}
        </h2>

        {/* General error */}
        {(errors.general || error) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 text-sm">
              {errors.general || error}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors.title ? 'border-red-300' : 'border-gray-300'}
              `}
              placeholder="Enter event title"
              disabled={isSubmitting}
            />
            {errors.title && (
              <p className="mt-1 text-sm text-red-600">{errors.title}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter event description (optional)"
              disabled={isSubmitting}
            />
          </div>

          {/* Start Time */}
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time *
            </label>
            <input
              type="datetime-local"
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleStartTimeChange}
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors.start_time ? 'border-red-300' : 'border-gray-300'}
              `}
              disabled={isSubmitting}
            />
            {errors.start_time && (
              <p className="mt-1 text-sm text-red-600">{errors.start_time}</p>
            )}
          </div>

          {/* End Time */}
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-1">
              End Time *
            </label>
            <input
              type="datetime-local"
              id="end_time"
              name="end_time"
              value={formData.end_time}
              onChange={handleInputChange}
              className={`
                w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${errors.end_time ? 'border-red-300' : 'border-gray-300'}
              `}
              disabled={isSubmitting}
            />
            {errors.end_time && (
              <p className="mt-1 text-sm text-red-600">{errors.end_time}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </span>
              ) : (
                isEditing ? 'Update Event' : 'Create Event'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}