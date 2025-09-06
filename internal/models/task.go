package models

import (
	"time"
)

// Task represents a task in the system
type Task struct {
	ID          int        `json:"id" db:"id"`
	Title       string     `json:"title" db:"title"`
	Description string     `json:"description" db:"description"`
	DueDate     *time.Time `json:"due_date" db:"due_date"`
	Status      string     `json:"status" db:"status"` // "pending", "completed"
	CreatedAt   time.Time  `json:"created_at" db:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at" db:"updated_at"`
}

// TaskStatus constants
const (
	TaskStatusPending   = "pending"
	TaskStatusCompleted = "completed"
)

// IsValidStatus checks if the provided status is valid
func (t *Task) IsValidStatus(status string) bool {
	return status == TaskStatusPending || status == TaskStatusCompleted
}