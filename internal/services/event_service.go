package services

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"agenda/internal/database"
	"agenda/internal/models"
)

// EventServiceInterface defines the contract for event business logic operations
type EventServiceInterface interface {
	// Core CRUD operations
	CreateEvent(ctx context.Context, req CreateEventRequest) (*models.Event, error)
	GetEventByID(ctx context.Context, id int) (*models.Event, error)
	UpdateEvent(ctx context.Context, id int, req UpdateEventRequest) (*models.Event, error)
	DeleteEvent(ctx context.Context, id int) error

	// Calendar-specific operations
	GetEventsByDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.Event, error)
	GetEventsByMonth(ctx context.Context, year int, month time.Month) ([]*models.Event, error)
	GetEventsByDay(ctx context.Context, date time.Time) ([]*models.Event, error)
	GetUpcomingEvents(ctx context.Context, limit int) ([]*models.Event, error)

	// Business logic operations
	CheckTimeConflicts(ctx context.Context, startTime, endTime time.Time, excludeEventID *int) ([]*models.Event, error)
	ValidateEventTimes(startTime, endTime time.Time) error
	ListEvents(ctx context.Context, filters EventListFilters) ([]*models.Event, int64, error)
}

// EventService implements EventServiceInterface
type EventService struct {
	eventRepo database.EventRepositoryInterface
}

// NewEventService creates a new event service instance
func NewEventService(eventRepo database.EventRepositoryInterface) EventServiceInterface {
	return &EventService{
		eventRepo: eventRepo,
	}
}

// CreateEventRequest represents the request to create a new event
type CreateEventRequest struct {
	Title       string    `json:"title"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"start_time"`
	EndTime     time.Time `json:"end_time"`
}

// UpdateEventRequest represents the request to update an existing event
type UpdateEventRequest struct {
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	StartTime   *time.Time `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
}

// EventListFilters represents filtering options for listing events
type EventListFilters struct {
	Title       string
	StartAfter  *time.Time
	StartBefore *time.Time
	EndAfter    *time.Time
	EndBefore   *time.Time
	Search      string
	Page        int
	PageSize    int
}

// Validation errors
var (
	ErrEventTitleRequired      = errors.New("event title is required")
	ErrEventTitleTooLong       = errors.New("event title cannot exceed 255 characters")
	ErrEventDescriptionTooLong = errors.New("event description cannot exceed 1000 characters")
	ErrEventNotFound           = errors.New("event not found")
	ErrInvalidTimeRange        = errors.New("end time must be after start time")
	ErrEventInPast             = errors.New("event cannot be scheduled in the past")
	ErrEventTooLong            = errors.New("event duration cannot exceed 24 hours")
	ErrTimeConflict            = errors.New("event conflicts with existing events")
)

// CreateEvent creates a new event with validation and conflict checking
func (es *EventService) CreateEvent(ctx context.Context, req CreateEventRequest) (*models.Event, error) {
	// Validate request
	if err := es.validateCreateEventRequest(req); err != nil {
		return nil, err
	}

	// Validate event times
	if err := es.ValidateEventTimes(req.StartTime, req.EndTime); err != nil {
		return nil, err
	}

	// Check for time conflicts
	conflicts, err := es.CheckTimeConflicts(ctx, req.StartTime, req.EndTime, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to check time conflicts: %w", err)
	}
	if len(conflicts) > 0 {
		return nil, ErrTimeConflict
	}

	// Create event model
	event := &models.Event{
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
	}

	// Create event in repository
	createdEvent, err := es.eventRepo.CreateEvent(ctx, event)
	if err != nil {
		return nil, fmt.Errorf("failed to create event: %w", err)
	}

	return createdEvent, nil
}

// GetEventByID retrieves an event by its ID
func (es *EventService) GetEventByID(ctx context.Context, id int) (*models.Event, error) {
	if id <= 0 {
		return nil, errors.New("invalid event ID")
	}

	event, err := es.eventRepo.GetEventByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEventNotFound
		}
		return nil, fmt.Errorf("failed to get event: %w", err)
	}

	return event, nil
}

// UpdateEvent updates an existing event with validation and conflict checking
func (es *EventService) UpdateEvent(ctx context.Context, id int, req UpdateEventRequest) (*models.Event, error) {
	if id <= 0 {
		return nil, errors.New("invalid event ID")
	}

	// Get existing event
	existingEvent, err := es.eventRepo.GetEventByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrEventNotFound
		}
		return nil, fmt.Errorf("failed to get existing event: %w", err)
	}

	// Validate update request
	if err := es.validateUpdateEventRequest(req); err != nil {
		return nil, err
	}

	// Apply updates
	updatedEvent := *existingEvent
	if req.Title != nil {
		updatedEvent.Title = strings.TrimSpace(*req.Title)
	}
	if req.Description != nil {
		updatedEvent.Description = strings.TrimSpace(*req.Description)
	}
	if req.StartTime != nil {
		updatedEvent.StartTime = *req.StartTime
	}
	if req.EndTime != nil {
		updatedEvent.EndTime = *req.EndTime
	}

	// Validate updated times
	if err := es.ValidateEventTimes(updatedEvent.StartTime, updatedEvent.EndTime); err != nil {
		return nil, err
	}

	// Check for time conflicts (excluding current event)
	conflicts, err := es.CheckTimeConflicts(ctx, updatedEvent.StartTime, updatedEvent.EndTime, &id)
	if err != nil {
		return nil, fmt.Errorf("failed to check time conflicts: %w", err)
	}
	if len(conflicts) > 0 {
		return nil, ErrTimeConflict
	}

	// Update in repository
	if err := es.eventRepo.UpdateEvent(ctx, &updatedEvent); err != nil {
		return nil, fmt.Errorf("failed to update event: %w", err)
	}

	return &updatedEvent, nil
}

// DeleteEvent removes an event
func (es *EventService) DeleteEvent(ctx context.Context, id int) error {
	if id <= 0 {
		return errors.New("invalid event ID")
	}

	// Check if event exists
	_, err := es.eventRepo.GetEventByID(ctx, id)
	if err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return ErrEventNotFound
		}
		return fmt.Errorf("failed to verify event exists: %w", err)
	}

	// Delete event
	if err := es.eventRepo.DeleteEvent(ctx, id); err != nil {
		return fmt.Errorf("failed to delete event: %w", err)
	}

	return nil
}

// GetEventsByDateRange retrieves events within a specific date range
func (es *EventService) GetEventsByDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.Event, error) {
	if endDate.Before(startDate) {
		return nil, errors.New("end date must be after start date")
	}

	events, err := es.eventRepo.GetEventsByDateRange(ctx, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get events by date range: %w", err)
	}

	return events, nil
}

// GetEventsByMonth retrieves all events for a specific month (calendar view)
func (es *EventService) GetEventsByMonth(ctx context.Context, year int, month time.Month) ([]*models.Event, error) {
	if year < 1900 || year > 2100 {
		return nil, errors.New("invalid year")
	}
	if month < 1 || month > 12 {
		return nil, errors.New("invalid month")
	}

	events, err := es.eventRepo.GetEventsByMonth(ctx, year, month)
	if err != nil {
		return nil, fmt.Errorf("failed to get events by month: %w", err)
	}

	return events, nil
}

// GetEventsByDay retrieves all events for a specific day
func (es *EventService) GetEventsByDay(ctx context.Context, date time.Time) ([]*models.Event, error) {
	events, err := es.eventRepo.GetEventsByDay(ctx, date)
	if err != nil {
		return nil, fmt.Errorf("failed to get events by day: %w", err)
	}

	return events, nil
}

// GetUpcomingEvents retrieves upcoming events
func (es *EventService) GetUpcomingEvents(ctx context.Context, limit int) ([]*models.Event, error) {
	if limit <= 0 {
		limit = 10 // Default limit
	}
	if limit > 100 {
		limit = 100 // Maximum limit
	}

	events, err := es.eventRepo.GetUpcomingEvents(ctx, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get upcoming events: %w", err)
	}

	return events, nil
}

// CheckTimeConflicts checks if the given time range conflicts with existing events
func (es *EventService) CheckTimeConflicts(ctx context.Context, startTime, endTime time.Time, excludeEventID *int) ([]*models.Event, error) {
	// Get events that might conflict (events that overlap with the given time range)
	filters := database.EventFilters{
		StartBefore: &endTime,
		EndAfter:    &startTime,
	}

	events, err := es.eventRepo.ListEvents(ctx, filters)
	if err != nil {
		return nil, fmt.Errorf("failed to get events for conflict check: %w", err)
	}

	var conflicts []*models.Event
	for _, event := range events {
		// Skip the event being updated
		if excludeEventID != nil && event.ID == *excludeEventID {
			continue
		}

		// Check if events overlap
		if es.eventsOverlap(startTime, endTime, event.StartTime, event.EndTime) {
			conflicts = append(conflicts, event)
		}
	}

	return conflicts, nil
}

// ValidateEventTimes validates event start and end times according to business rules
func (es *EventService) ValidateEventTimes(startTime, endTime time.Time) error {
	// Check if end time is after start time
	if !endTime.After(startTime) {
		return ErrInvalidTimeRange
	}

	// Check if event is not in the past (allow events starting within the last hour for flexibility)
	if startTime.Before(time.Now().Add(-1 * time.Hour)) {
		return ErrEventInPast
	}

	// Check if event duration is reasonable (max 24 hours)
	duration := endTime.Sub(startTime)
	if duration > 24*time.Hour {
		return ErrEventTooLong
	}

	return nil
}

// ListEvents retrieves events with filtering and pagination
func (es *EventService) ListEvents(ctx context.Context, filters EventListFilters) ([]*models.Event, int64, error) {
	// Set default pagination
	if filters.PageSize <= 0 {
		filters.PageSize = 20
	}
	if filters.PageSize > 100 {
		filters.PageSize = 100
	}
	if filters.Page < 1 {
		filters.Page = 1
	}

	// Convert to repository filters
	repoFilters := database.EventFilters{
		Title:       filters.Title,
		StartAfter:  filters.StartAfter,
		StartBefore: filters.StartBefore,
		EndAfter:    filters.EndAfter,
		EndBefore:   filters.EndBefore,
		Search:      filters.Search,
		Limit:       filters.PageSize,
		Offset:      (filters.Page - 1) * filters.PageSize,
	}

	// Get events and total count
	events, err := es.eventRepo.ListEvents(ctx, repoFilters)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list events: %w", err)
	}

	total, err := es.eventRepo.CountEvents(ctx, repoFilters)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count events: %w", err)
	}

	return events, total, nil
}

// eventsOverlap checks if two time ranges overlap
func (es *EventService) eventsOverlap(start1, end1, start2, end2 time.Time) bool {
	// Events overlap if one starts before the other ends and vice versa
	return start1.Before(end2) && start2.Before(end1)
}

// validateCreateEventRequest validates the create event request
func (es *EventService) validateCreateEventRequest(req CreateEventRequest) error {
	// Title validation
	if strings.TrimSpace(req.Title) == "" {
		return ErrEventTitleRequired
	}
	if len(req.Title) > 255 {
		return ErrEventTitleTooLong
	}

	// Description validation
	if len(req.Description) > 1000 {
		return ErrEventDescriptionTooLong
	}

	return nil
}

// validateUpdateEventRequest validates the update event request
func (es *EventService) validateUpdateEventRequest(req UpdateEventRequest) error {
	// Title validation
	if req.Title != nil {
		if strings.TrimSpace(*req.Title) == "" {
			return ErrEventTitleRequired
		}
		if len(*req.Title) > 255 {
			return ErrEventTitleTooLong
		}
	}

	// Description validation
	if req.Description != nil && len(*req.Description) > 1000 {
		return ErrEventDescriptionTooLong
	}

	return nil
}