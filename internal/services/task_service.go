package services

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"agenda/internal/database"
	"agenda/internal/models"
)

// TaskServiceInterface defines the contract for task business logic operations
type TaskServiceInterface interface {
	// Core CRUD operations
	CreateTask(ctx context.Context, req CreateTaskRequest) (*models.Task, error)
	GetTaskByID(ctx context.Context, id int) (*models.Task, error)
	UpdateTask(ctx context.Context, id int, req UpdateTaskRequest) (*models.Task, error)
	DeleteTask(ctx context.Context, id int) error
	
	// Business logic operations
	CompleteTask(ctx context.Context, id int) (*models.Task, error)
	ReopenTask(ctx context.Context, id int) (*models.Task, error)
	
	// Query operations
	ListTasks(ctx context.Context, filters TaskListFilters) ([]*models.Task, int64, error)
	GetOverdueTasks(ctx context.Context) ([]*models.Task, error)
	GetTasksByStatus(ctx context.Context, status string) ([]*models.Task, error)
	GetUpcomingTasks(ctx context.Context, days int) ([]*models.Task, error)
}

// TaskService implements TaskServiceInterface
type TaskService struct {
	taskRepo database.TaskRepositoryInterface
}

// NewTaskService creates a new task service instance
func NewTaskService(taskRepo database.TaskRepositoryInterface) TaskServiceInterface {
	return &TaskService{
		taskRepo: taskRepo,
	}
}

// CreateTaskRequest represents the request to create a new task
type CreateTaskRequest struct {
	Title       string     `json:"title"`
	Description string     `json:"description"`
	DueDate     *time.Time `json:"due_date"`
}

// UpdateTaskRequest represents the request to update an existing task
type UpdateTaskRequest struct {
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	DueDate     *time.Time `json:"due_date"`
	Status      *string    `json:"status"`
}

// TaskListFilters represents filtering options for listing tasks
type TaskListFilters struct {
	Status    string
	DueAfter  *time.Time
	DueBefore *time.Time
	Search    string
	Page      int
	PageSize  int
}

// Validation errors
var (
	ErrTaskTitleRequired    = errors.New("task title is required")
	ErrTaskTitleTooLong     = errors.New("task title cannot exceed 255 characters")
	ErrTaskDescriptionTooLong = errors.New("task description cannot exceed 1000 characters")
	ErrInvalidTaskStatus    = errors.New("invalid task status")
	ErrTaskNotFound         = errors.New("task not found")
	ErrDueDateInPast        = errors.New("due date cannot be in the past")
	ErrTaskAlreadyCompleted = errors.New("task is already completed")
	ErrTaskAlreadyPending   = errors.New("task is already pending")
)

// CreateTask creates a new task with validation
func (ts *TaskService) CreateTask(ctx context.Context, req CreateTaskRequest) (*models.Task, error) {
	// Validate request
	if err := ts.validateCreateTaskRequest(req); err != nil {
		return nil, err
	}

	// Create task model
	task := &models.Task{
		Title:       strings.TrimSpace(req.Title),
		Description: strings.TrimSpace(req.Description),
		DueDate:     req.DueDate,
		Status:      models.TaskStatusPending,
	}

	// Create task in repository
	createdTask, err := ts.taskRepo.CreateTask(ctx, task)
	if err != nil {
		return nil, fmt.Errorf("failed to create task: %w", err)
	}

	return createdTask, nil
}

// GetTaskByID retrieves a task by its ID
func (ts *TaskService) GetTaskByID(ctx context.Context, id int) (*models.Task, error) {
	if id <= 0 {
		return nil, errors.New("invalid task ID")
	}

	task, err := ts.taskRepo.GetTaskByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get task: %w", err)
	}

	return task, nil
}

// UpdateTask updates an existing task with validation
func (ts *TaskService) UpdateTask(ctx context.Context, id int, req UpdateTaskRequest) (*models.Task, error) {
	if id <= 0 {
		return nil, errors.New("invalid task ID")
	}

	// Get existing task
	existingTask, err := ts.taskRepo.GetTaskByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get existing task: %w", err)
	}

	// Validate update request
	if err := ts.validateUpdateTaskRequest(req); err != nil {
		return nil, err
	}

	// Apply updates
	updatedTask := *existingTask
	if req.Title != nil {
		updatedTask.Title = strings.TrimSpace(*req.Title)
	}
	if req.Description != nil {
		updatedTask.Description = strings.TrimSpace(*req.Description)
	}
	if req.DueDate != nil {
		updatedTask.DueDate = req.DueDate
	}
	if req.Status != nil {
		updatedTask.Status = *req.Status
	}

	// Update in repository
	if err := ts.taskRepo.UpdateTask(ctx, &updatedTask); err != nil {
		return nil, fmt.Errorf("failed to update task: %w", err)
	}

	return &updatedTask, nil
}

// DeleteTask removes a task
func (ts *TaskService) DeleteTask(ctx context.Context, id int) error {
	if id <= 0 {
		return errors.New("invalid task ID")
	}

	// Check if task exists
	_, err := ts.taskRepo.GetTaskByID(ctx, id)
	if err != nil {
		return fmt.Errorf("failed to verify task exists: %w", err)
	}

	// Delete task
	if err := ts.taskRepo.DeleteTask(ctx, id); err != nil {
		return fmt.Errorf("failed to delete task: %w", err)
	}

	return nil
}

// CompleteTask marks a task as completed
func (ts *TaskService) CompleteTask(ctx context.Context, id int) (*models.Task, error) {
	if id <= 0 {
		return nil, errors.New("invalid task ID")
	}

	// Get existing task
	task, err := ts.taskRepo.GetTaskByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get task: %w", err)
	}

	// Check if already completed
	if task.Status == models.TaskStatusCompleted {
		return nil, ErrTaskAlreadyCompleted
	}

	// Update status
	task.Status = models.TaskStatusCompleted
	if err := ts.taskRepo.UpdateTask(ctx, task); err != nil {
		return nil, fmt.Errorf("failed to complete task: %w", err)
	}

	return task, nil
}

// ReopenTask marks a completed task as pending
func (ts *TaskService) ReopenTask(ctx context.Context, id int) (*models.Task, error) {
	if id <= 0 {
		return nil, errors.New("invalid task ID")
	}

	// Get existing task
	task, err := ts.taskRepo.GetTaskByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get task: %w", err)
	}

	// Check if already pending
	if task.Status == models.TaskStatusPending {
		return nil, ErrTaskAlreadyPending
	}

	// Update status
	task.Status = models.TaskStatusPending
	if err := ts.taskRepo.UpdateTask(ctx, task); err != nil {
		return nil, fmt.Errorf("failed to reopen task: %w", err)
	}

	return task, nil
}

// ListTasks retrieves tasks with filtering and pagination
func (ts *TaskService) ListTasks(ctx context.Context, filters TaskListFilters) ([]*models.Task, int64, error) {
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
	repoFilters := database.TaskFilters{
		Status:    filters.Status,
		DueAfter:  filters.DueAfter,
		DueBefore: filters.DueBefore,
		Search:    filters.Search,
		Limit:     filters.PageSize,
		Offset:    (filters.Page - 1) * filters.PageSize,
	}

	// Get tasks and total count
	tasks, err := ts.taskRepo.ListTasks(ctx, repoFilters)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to list tasks: %w", err)
	}

	total, err := ts.taskRepo.CountTasks(ctx, repoFilters)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to count tasks: %w", err)
	}

	return tasks, total, nil
}

// GetOverdueTasks retrieves tasks that are overdue
func (ts *TaskService) GetOverdueTasks(ctx context.Context) ([]*models.Task, error) {
	tasks, err := ts.taskRepo.GetOverdueTasks(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get overdue tasks: %w", err)
	}

	return tasks, nil
}

// GetTasksByStatus retrieves tasks filtered by status
func (ts *TaskService) GetTasksByStatus(ctx context.Context, status string) ([]*models.Task, error) {
	// Validate status
	if status != models.TaskStatusPending && status != models.TaskStatusCompleted {
		return nil, ErrInvalidTaskStatus
	}

	tasks, err := ts.taskRepo.GetTasksByStatus(ctx, status)
	if err != nil {
		return nil, fmt.Errorf("failed to get tasks by status: %w", err)
	}

	return tasks, nil
}

// GetUpcomingTasks retrieves tasks due within the specified number of days
func (ts *TaskService) GetUpcomingTasks(ctx context.Context, days int) ([]*models.Task, error) {
	if days < 0 {
		days = 7 // Default to 7 days
	}

	now := time.Now()
	endDate := now.AddDate(0, 0, days)

	tasks, err := ts.taskRepo.GetTasksByDueDateRange(ctx, now, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get upcoming tasks: %w", err)
	}

	return tasks, nil
}

// validateCreateTaskRequest validates the create task request
func (ts *TaskService) validateCreateTaskRequest(req CreateTaskRequest) error {
	// Title validation
	if strings.TrimSpace(req.Title) == "" {
		return ErrTaskTitleRequired
	}
	if len(req.Title) > 255 {
		return ErrTaskTitleTooLong
	}

	// Description validation
	if len(req.Description) > 1000 {
		return ErrTaskDescriptionTooLong
	}

	// Due date validation
	if req.DueDate != nil && req.DueDate.Before(time.Now().Truncate(24*time.Hour)) {
		return ErrDueDateInPast
	}

	return nil
}

// validateUpdateTaskRequest validates the update task request
func (ts *TaskService) validateUpdateTaskRequest(req UpdateTaskRequest) error {
	// Title validation
	if req.Title != nil {
		if strings.TrimSpace(*req.Title) == "" {
			return ErrTaskTitleRequired
		}
		if len(*req.Title) > 255 {
			return ErrTaskTitleTooLong
		}
	}

	// Description validation
	if req.Description != nil && len(*req.Description) > 1000 {
		return ErrTaskDescriptionTooLong
	}

	// Status validation
	if req.Status != nil {
		if *req.Status != models.TaskStatusPending && *req.Status != models.TaskStatusCompleted {
			return ErrInvalidTaskStatus
		}
	}

	// Due date validation
	if req.DueDate != nil && req.DueDate.Before(time.Now().Truncate(24*time.Hour)) {
		return ErrDueDateInPast
	}

	return nil
}