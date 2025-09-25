package database

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"agenda/internal/models"
)

// TaskRepositoryInterface defines the contract for task repository operations
type TaskRepositoryInterface interface {
	BaseRepository

	// Task-specific methods
	CreateTask(ctx context.Context, task *models.Task) (*models.Task, error)
	GetTaskByID(ctx context.Context, id int) (*models.Task, error)
	UpdateTask(ctx context.Context, task *models.Task) error
	DeleteTask(ctx context.Context, id int) error
	ListTasks(ctx context.Context, filters TaskFilters) ([]*models.Task, error)
	CountTasks(ctx context.Context, filters TaskFilters) (int64, error)

	// Filtering methods
	GetTasksByStatus(ctx context.Context, status string) ([]*models.Task, error)
	GetTasksByDueDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.Task, error)
	GetOverdueTasks(ctx context.Context) ([]*models.Task, error)
}

// TaskFilters represents filtering options for task queries
type TaskFilters struct {
	Status    string
	DueAfter  *time.Time
	DueBefore *time.Time
	Search    string
	Limit     int
	Offset    int
}

// TaskRepository implements TaskRepositoryInterface
type TaskRepository struct {
	*Repository
}

// NewTaskRepository creates a new task repository instance
func NewTaskRepository(db *sql.DB) TaskRepositoryInterface {
	return &TaskRepository{
		Repository: NewRepository(db),
	}
}

// CreateTask creates a new task in the database
func (tr *TaskRepository) CreateTask(ctx context.Context, task *models.Task) (*models.Task, error) {
	query := `
		INSERT INTO tasks (title, description, due_date, status, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`

	now := time.Now()
	task.CreatedAt = now
	task.UpdatedAt = now

	// Set default status if not provided
	if task.Status == "" {
		task.Status = models.TaskStatusPending
	}

	// Validate status
	if !task.IsValidStatus(task.Status) {
		return nil, fmt.Errorf("invalid task status: %s", task.Status)
	}

	id, err := tr.Create(ctx, query, task.Title, task.Description, task.DueDate, task.Status, task.CreatedAt, task.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to create task: %w", err)
	}

	task.ID = int(id)
	return task, nil
}

// GetTaskByID retrieves a task by its ID
func (tr *TaskRepository) GetTaskByID(ctx context.Context, id int) (*models.Task, error) {
	query := `
		SELECT id, title, description, due_date, status, created_at, updated_at
		FROM tasks
		WHERE id = ?
	`

	var task models.Task
	err := tr.GetByID(ctx, &task, query, id)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("task with id %d not found", id)
		}
		return nil, fmt.Errorf("failed to get task: %w", err)
	}

	return &task, nil
}

// UpdateTask updates an existing task
func (tr *TaskRepository) UpdateTask(ctx context.Context, task *models.Task) error {
	query := `
		UPDATE tasks 
		SET title = ?, description = ?, due_date = ?, status = ?, updated_at = ?
		WHERE id = ?
	`

	// Validate status
	if !task.IsValidStatus(task.Status) {
		return fmt.Errorf("invalid task status: %s", task.Status)
	}

	task.UpdatedAt = time.Now()

	err := tr.Update(ctx, query, task.Title, task.Description, task.DueDate, task.Status, task.UpdatedAt, task.ID)
	if err != nil {
		return fmt.Errorf("failed to update task: %w", err)
	}

	return nil
}

// DeleteTask removes a task from the database
func (tr *TaskRepository) DeleteTask(ctx context.Context, id int) error {
	query := `DELETE FROM tasks WHERE id = ?`

	err := tr.Delete(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete task: %w", err)
	}

	return nil
}

// ListTasks retrieves tasks with optional filtering
func (tr *TaskRepository) ListTasks(ctx context.Context, filters TaskFilters) ([]*models.Task, error) {
	query, args := tr.buildTaskQuery(filters, false)

	var tasks []*models.Task
	err := tr.List(ctx, &tasks, query, args...)
	if err != nil {
		return nil, fmt.Errorf("failed to list tasks: %w", err)
	}

	return tasks, nil
}

// CountTasks returns the total number of tasks matching the filters
func (tr *TaskRepository) CountTasks(ctx context.Context, filters TaskFilters) (int64, error) {
	query, args := tr.buildTaskQuery(filters, true)

	count, err := tr.Count(ctx, query, args...)
	if err != nil {
		return 0, fmt.Errorf("failed to count tasks: %w", err)
	}

	return count, nil
}

// GetTasksByStatus retrieves tasks filtered by status
func (tr *TaskRepository) GetTasksByStatus(ctx context.Context, status string) ([]*models.Task, error) {
	filters := TaskFilters{
		Status: status,
	}
	return tr.ListTasks(ctx, filters)
}

// GetTasksByDueDateRange retrieves tasks within a specific due date range
func (tr *TaskRepository) GetTasksByDueDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.Task, error) {
	filters := TaskFilters{
		DueAfter:  &startDate,
		DueBefore: &endDate,
	}
	return tr.ListTasks(ctx, filters)
}

// GetOverdueTasks retrieves tasks that are overdue (due date in the past and not completed)
func (tr *TaskRepository) GetOverdueTasks(ctx context.Context) ([]*models.Task, error) {
	query := `
		SELECT id, title, description, due_date, status, created_at, updated_at
		FROM tasks
		WHERE due_date < ? AND status = ?
		ORDER BY due_date ASC
	`

	now := time.Now()
	var tasks []*models.Task
	err := tr.List(ctx, &tasks, query, now, models.TaskStatusPending)
	if err != nil {
		return nil, fmt.Errorf("failed to get overdue tasks: %w", err)
	}

	return tasks, nil
}

// buildTaskQuery constructs a SQL query with WHERE conditions based on filters
func (tr *TaskRepository) buildTaskQuery(filters TaskFilters, isCount bool) (string, []interface{}) {
	var baseQuery string
	if isCount {
		baseQuery = "SELECT COUNT(*) FROM tasks"
	} else {
		baseQuery = "SELECT id, title, description, due_date, status, created_at, updated_at FROM tasks"
	}

	var conditions []string
	var args []interface{}

	// Status filter
	if filters.Status != "" {
		conditions = append(conditions, "status = ?")
		args = append(args, filters.Status)
	}

	// Due date range filters
	if filters.DueAfter != nil {
		conditions = append(conditions, "due_date >= ?")
		args = append(args, *filters.DueAfter)
	}

	if filters.DueBefore != nil {
		conditions = append(conditions, "due_date <= ?")
		args = append(args, *filters.DueBefore)
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
		query += " ORDER BY created_at DESC"

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
