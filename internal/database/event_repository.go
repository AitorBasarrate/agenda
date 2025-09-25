package database

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"agenda/internal/models"
)

// EventRepositoryInterface defines the contract for event repository operations
type EventRepositoryInterface interface {
	BaseRepository

	// Event-specific methods
	CreateEvent(ctx context.Context, event *models.Event) (*models.Event, error)
	GetEventByID(ctx context.Context, id int) (*models.Event, error)
	UpdateEvent(ctx context.Context, event *models.Event) error
	DeleteEvent(ctx context.Context, id int) error
	ListEvents(ctx context.Context, filters EventFilters) ([]*models.Event, error)
	CountEvents(ctx context.Context, filters EventFilters) (int64, error)

	// Calendar-specific queries
	GetEventsByDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.Event, error)
	GetEventsByMonth(ctx context.Context, year int, month time.Month) ([]*models.Event, error)
	GetEventsByDay(ctx context.Context, date time.Time) ([]*models.Event, error)
	GetUpcomingEvents(ctx context.Context, limit int) ([]*models.Event, error)
	GetEventsByTitle(ctx context.Context, title string) ([]*models.Event, error)
}

// EventFilters represents filtering options for event queries
type EventFilters struct {
	Title       string
	Description string
	StartAfter  *time.Time
	StartBefore *time.Time
	EndAfter    *time.Time
	EndBefore   *time.Time
	Search      string
	Limit       int
	Offset      int
}

// EventRepository implements EventRepositoryInterface
type EventRepository struct {
	*Repository
}

// NewEventRepository creates a new event repository instance
func NewEventRepository(db *sql.DB) EventRepositoryInterface {
	return &EventRepository{
		Repository: NewRepository(db),
	}
}

// CreateEvent creates a new event in the database
func (er *EventRepository) CreateEvent(ctx context.Context, event *models.Event) (*models.Event, error) {
	query := `
		INSERT INTO events (title, description, start_time, end_time, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	event.CreatedAt = now
	event.UpdatedAt = now

	// Validate time range
	if !event.IsValidTimeRange() {
		return nil, fmt.Errorf("invalid time range: end time must be after start time")
	}

	id, err := er.Create(ctx, query, event.Title, event.Description, event.StartTime, event.EndTime, event.CreatedAt, event.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create event: %w", err)
	}

	event.ID = int(id)
	return event, nil
}

// GetEventByID retrieves an event by its ID
func (er *EventRepository) GetEventByID(ctx context.Context, id int) (*models.Event, error) {
	query := `
		SELECT id, title, description, start_time, end_time, created_at, updated_at
		FROM events
		WHERE id = ?
	`

	var event models.Event
	err := er.GetByID(ctx, &event, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("event with id %d not found", id)
		}
		return nil, fmt.Errorf("failed to get event: %w", err)
	}

	return &event, nil
}

// UpdateEvent updates an existing event
func (er *EventRepository) UpdateEvent(ctx context.Context, event *models.Event) error {
	query := `
		UPDATE events 
		SET title = ?, description = ?, start_time = ?, end_time = ?, updated_at = ?
		WHERE id = ?
	`

	// Validate time range
	if !event.IsValidTimeRange() {
		return fmt.Errorf("invalid time range: end time must be after start time")
	}

	event.UpdatedAt = time.Now()

	err := er.Update(ctx, query, event.Title, event.Description, event.StartTime, event.EndTime, event.UpdatedAt, event.ID)
	if err != nil {
		return fmt.Errorf("failed to update event: %w", err)
	}

	return nil
}

// DeleteEvent removes an event from the database
func (er *EventRepository) DeleteEvent(ctx context.Context, id int) error {
	query := `DELETE FROM events WHERE id = ?`

	err := er.Delete(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete event: %w", err)
	}

	return nil
}

// ListEvents retrieves events with optional filtering
func (er *EventRepository) ListEvents(ctx context.Context, filters EventFilters) ([]*models.Event, error) {
	query, args := er.buildEventQuery(filters, false)

	var events []*models.Event
	err := er.List(ctx, &events, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list events: %w", err)
	}

	return events, nil
}

// CountEvents returns the total number of events matching the filters
func (er *EventRepository) CountEvents(ctx context.Context, filters EventFilters) (int64, error) {
	query, args := er.buildEventQuery(filters, true)

	count, err := er.Count(ctx, query, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to count events: %w", err)
	}

	return count, nil
}

// GetEventsByDateRange retrieves events within a specific date range
func (er *EventRepository) GetEventsByDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.Event, error) {
	filters := EventFilters{
		StartAfter:  &startDate,
		StartBefore: &endDate,
	}
	return er.ListEvents(ctx, filters)
}

// GetEventsByMonth retrieves all events for a specific month (calendar view)
func (er *EventRepository) GetEventsByMonth(ctx context.Context, year int, month time.Month) ([]*models.Event, error) {
	// Get the first day of the month
	startOfMonth := time.Date(year, month, 1, 0, 0, 0, 0, time.UTC)
	// Get the first day of the next month
	endOfMonth := startOfMonth.AddDate(0, 1, 0)

	query := `
		SELECT id, title, description, start_time, end_time, created_at, updated_at
		FROM events
		WHERE (start_time >= ? AND start_time < ?) 
		   OR (end_time >= ? AND end_time < ?)
		   OR (start_time < ? AND end_time >= ?)
		ORDER BY start_time ASC
	`

	var events []*models.Event
	err := er.List(ctx, &events, query, startOfMonth, endOfMonth, startOfMonth, endOfMonth, startOfMonth, endOfMonth)
	if err != nil {
		return nil, fmt.Errorf("failed to get events for month %d/%d: %w", month, year, err)
	}

	return events, nil
}

// GetEventsByDay retrieves all events for a specific day
func (er *EventRepository) GetEventsByDay(ctx context.Context, date time.Time) ([]*models.Event, error) {
	// Get start and end of the day
	startOfDay := time.Date(date.Year(), date.Month(), date.Day(), 0, 0, 0, 0, date.Location())
	endOfDay := startOfDay.AddDate(0, 0, 1)

	query := `
		SELECT id, title, description, start_time, end_time, created_at, updated_at
		FROM events
		WHERE (start_time >= ? AND start_time < ?) 
		   OR (end_time >= ? AND end_time < ?)
		   OR (start_time < ? AND end_time >= ?)
		ORDER BY start_time ASC
	`

	var events []*models.Event
	err := er.List(ctx, &events, query, startOfDay, endOfDay, startOfDay, endOfDay, startOfDay, endOfDay)
	if err != nil {
		return nil, fmt.Errorf("failed to get events for day %s: %w", date.Format("2006-01-02"), err)
	}

	return events, nil
}

// GetUpcomingEvents retrieves upcoming events (starting from now)
func (er *EventRepository) GetUpcomingEvents(ctx context.Context, limit int) ([]*models.Event, error) {
	query := `
		SELECT id, title, description, start_time, end_time, created_at, updated_at
		FROM events
		WHERE start_time >= ?
		ORDER BY start_time ASC
		LIMIT ?
	`

	now := time.Now()
	var events []*models.Event
	err := er.List(ctx, &events, query, now, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get upcoming events: %w", err)
	}

	return events, nil
}

// GetEventsByTitle retrieves events by title (exact match)
func (er *EventRepository) GetEventsByTitle(ctx context.Context, title string) ([]*models.Event, error) {
	query := `
		SELECT id, title, description, start_time, end_time, created_at, updated_at
		FROM events
		WHERE title = ?
		ORDER BY start_time ASC
	`

	var events []*models.Event
	err := er.List(ctx, &events, query, title)
	if err != nil {
		return nil, fmt.Errorf("failed to get events by title: %w", err)
	}

	return events, nil
}

// buildEventQuery constructs a SQL query with WHERE conditions based on filters
func (er *EventRepository) buildEventQuery(filters EventFilters, isCount bool) (string, []interface{}) {
	var baseQuery string
	if isCount {
		baseQuery = "SELECT COUNT(*) FROM events"
	} else {
		baseQuery = "SELECT id, title, description, start_time, end_time, created_at, updated_at FROM events"
	}

	var conditions []string
	var args []interface{}

	// Title filter (exact match)
	if filters.Title != "" {
		conditions = append(conditions, "title = ?")
		args = append(args, filters.Title)
	}

	// Description filter (exact match)
	if filters.Description != "" {
		conditions = append(conditions, "description = ?")
		args = append(args, filters.Description)
	}

	// Start time range filters
	if filters.StartAfter != nil {
		conditions = append(conditions, "start_time >= ?")
		args = append(args, *filters.StartAfter)
	}

	if filters.StartBefore != nil {
		conditions = append(conditions, "start_time <= ?")
		args = append(args, *filters.StartBefore)
	}

	// End time range filters
	if filters.EndAfter != nil {
		conditions = append(conditions, "end_time >= ?")
		args = append(args, *filters.EndAfter)
	}

	if filters.EndBefore != nil {
		conditions = append(conditions, "end_time <= ?")
		args = append(args, *filters.EndBefore)
	}

	// Search filter (searches in title and description)
	if filters.Search != "" {
		conditions = append(conditions, "(title LIKE ? OR description LIKE ?)")
		searchTerm := "%" + filters.Search + "%"
		args = append(args, searchTerm, searchTerm)
	}

	// Build WHERE clause
	query := baseQuery
	if len(conditions) > 0 {
		query += " WHERE " + strings.Join(conditions, " AND ")
	}

	// Add ordering and pagination for non-count queries
	if !isCount {
		query += " ORDER BY start_time ASC"

		if filters.Limit > 0 {
			query += " LIMIT ?"
			args = append(args, filters.Limit)

			if filters.Offset > 0 {
				query += " OFFSET ?"
				args = append(args, filters.Offset)
			}
		}
	}

	return query, args
}
