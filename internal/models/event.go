package models

import (
	"time"
)

// Event represents a calendar event in the system
type Event struct {
	ID          int       `json:"id" db:"id"`
	Title       string    `json:"title" db:"title"`
	Description string    `json:"description" db:"description"`
	StartTime   time.Time `json:"start_time" db:"start_time"`
	EndTime     time.Time `json:"end_time" db:"end_time"`
	CreatedAt   time.Time `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time `json:"updated_at" db:"updated_at"`
}

// IsValidTimeRange checks if the event has a valid time range
func (e *Event) IsValidTimeRange() bool {
	return e.EndTime.After(e.StartTime)
}