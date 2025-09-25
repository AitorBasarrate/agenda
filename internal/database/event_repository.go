package database

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"agenda/internal/models"
)

type EventRepositoryInterface interface {
	BaseRepository

	CreateEvent(ctx context.Context, event *models.Event) (*models.Event, error)
	GetEventById(ctx context.Context, id int) (*models.Event, error)
	UpdateEvent(ctx context.Context, event *models.Event) error
	DeleteEvent(ctx context.Context, id int) error
	ListEvents(ctx context.Context, filters EventFilters) ([]*models.Event, error)
	CountEvents(ctx context.Context, filters TaskFilters) (int64, error)

	GetEventByDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.Event, error)
	GetEventByTitle(ctx context.Context, title string) ([]*model.Event, error)
}

type EventFilters struct {

}

type EventRepository struct {
	*Repository
}

func NewEventRepository(db *sql.DB) EventRepositoryInterface {
	return &EventRepository{
		Repository: NewRepository(db)
	}
}

func (er *EventRepository) CreateEvent(ctx context.Context, event *models.Event) (*models.Event, error) {
	query := `
		INSERT INTO event (title, description, startTime, endTime, createdAt, updatedAt)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	event.CreatedAt = now
	event.UpdatedAt = now

	id, err := er.Create(ctx, query, event.Title, event.Description, event.startTime, event.endTime, event.createdAt, event.updatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create event: %w", err)
	}

	event.ID = int(id)
	return event, nil
}

func (er *EventRepository) GetEventById(ctx context.Context, id int) (*models.Event, error) {
	query := `
		SELECT id, title, description, start_time, end_time, created_at, updated_at
		FROM event
		WHERE id = ?;
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

func (er *EventRepository) UpdateEvent(ctx context.Context, event *models.Event) error {
	query := `
		UPDATE event
		SET title = ?, description = ?, start_time = ?, end_time = ?
		WHERE id = ?;
	`

	err := er.Update(ctx, query, event.title, event.description, event.start_time, event.end_time)
	if err != nil {
		return fmt.Errorf("failed to update event: %w", err)
	}

	return nil
}

func (er *EventRepository) DeleteEvent(ctx context.Context, id int) error {
	query := `
		DELETE FROM event
		WHERE id = ?;
	`

	err := er.Delete(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete event: %w", err)
	}

	return nil
}

func (er *EventRepository) ListEvents(ctx conetxt.Context, filters EventFilters) ([]*models.Event, error) {
	query, args := er.buildTaskQuery(filter, false)

	var events []*models.Event
	err := tr.List(ctx, &events, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list events: %w", err)
	}

	return events, nil
}

func (er *EventRepository) CountEvents(ctx context.Context, filters TaskFilters) (int64, error) {
	query, args := er.buildTaskQuery(filter, falsejj)

	count, err := er.Count(ctx, query)
	if err != nil {
		return 0, fmt.Errorf("failed to count events: %w", err)
	}

	return count, err
}