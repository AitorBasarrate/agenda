package database

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"agenda/internal/models"

	_ "github.com/mattn/go-sqlite3"
)

// setupTaskTestDB creates an in-memory SQLite database for testing tasks
func setupTaskTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}

	// Create tasks table
	schema := `
	CREATE TABLE tasks (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT,
		due_date DATETIME,
		status TEXT NOT NULL DEFAULT 'pending',
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);
	
	CREATE INDEX idx_tasks_due_date ON tasks(due_date);
	CREATE INDEX idx_tasks_status ON tasks(status);
	`

	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("Failed to create test schema: %v", err)
	}

	return db
}

// createTestTask creates a test task with default values
func createTestTask(title string) *models.Task {
	return &models.Task{
		Title:       title,
		Description: "Test description for " + title,
		Status:      models.TaskStatusPending,
	}
}

func TestTaskRepository_CreateTask(t *testing.T) {
	db := setupTaskTestDB(t)
	defer db.Close()

	repo := NewTaskRepository(db)
	ctx := context.Background()

	tests := []struct {
		name    string
		task    *models.Task
		wantErr bool
	}{
		{
			name:    "valid task creation",
			task:    createTestTask("Test Task 1"),
			wantErr: false,
		},
		{
			name: "task with due date",
			task: &models.Task{
				Title:       "Task with due date",
				Description: "Test description",
				DueDate:     &time.Time{},
				Status:      models.TaskStatusPending,
			},
			wantErr: false,
		},
		{
			name: "task with invalid status",
			task: &models.Task{
				Title:       "Invalid status task",
				Description: "Test description",
				Status:      "invalid_status",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := repo.CreateTask(ctx, tt.task)

			if tt.wantErr {
				if err == nil {
					t.Errorf("CreateTask() expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Errorf("CreateTask() unexpected error: %v", err)
				return
			}

			if result.ID == 0 {
				t.Errorf("CreateTask() expected non-zero ID, got %d", result.ID)
			}

			if result.CreatedAt.IsZero() {
				t.Errorf("CreateTask() expected non-zero CreatedAt")
			}

			if result.UpdatedAt.IsZero() {
				t.Errorf("CreateTask() expected non-zero UpdatedAt")
			}

			if result.Status == "" {
				t.Errorf("CreateTask() expected default status to be set")
			}
		})
	}
}

func TestTaskRepository_GetTaskByID(t *testing.T) {
	db := setupTaskTestDB(t)
	defer db.Close()

	repo := NewTaskRepository(db)
	ctx := context.Background()

	// Create a test task first
	task := createTestTask("Test Task for Get")
	createdTask, err := repo.CreateTask(ctx, task)
	if err != nil {
		t.Fatalf("Failed to create test task: %v", err)
	}

	tests := []struct {
		name    string
		id      int
		wantErr bool
	}{
		{
			name:    "existing task",
			id:      createdTask.ID,
			wantErr: false,
		},
		{
			name:    "non-existing task",
			id:      99999,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := repo.GetTaskByID(ctx, tt.id)

			if tt.wantErr {
				if err == nil {
					t.Errorf("GetTaskByID() expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Errorf("GetTaskByID() unexpected error: %v", err)
				return
			}

			if result.ID != tt.id {
				t.Errorf("GetTaskByID() expected ID %d, got %d", tt.id, result.ID)
			}

			if result.Title != createdTask.Title {
				t.Errorf("GetTaskByID() expected title %s, got %s", createdTask.Title, result.Title)
			}
		})
	}
}

func TestTaskRepository_UpdateTask(t *testing.T) {
	db := setupTaskTestDB(t)
	defer db.Close()

	repo := NewTaskRepository(db)
	ctx := context.Background()

	// Create a test task first
	task := createTestTask("Test Task for Update")
	createdTask, err := repo.CreateTask(ctx, task)
	if err != nil {
		t.Fatalf("Failed to create test task: %v", err)
	}

	tests := []struct {
		name    string
		task    *models.Task
		wantErr bool
	}{
		{
			name: "valid update",
			task: &models.Task{
				ID:          createdTask.ID,
				Title:       "Updated Title",
				Description: "Updated Description",
				Status:      models.TaskStatusCompleted,
			},
			wantErr: false,
		},
		{
			name: "invalid status update",
			task: &models.Task{
				ID:          createdTask.ID,
				Title:       "Updated Title",
				Description: "Updated Description",
				Status:      "invalid_status",
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := repo.UpdateTask(ctx, tt.task)

			if tt.wantErr {
				if err == nil {
					t.Errorf("UpdateTask() expected error, got nil")
				}
				return
			}

			if err != nil {
				t.Errorf("UpdateTask() unexpected error: %v", err)
				return
			}

			// Verify the update by fetching the task
			updatedTask, err := repo.GetTaskByID(ctx, tt.task.ID)
			if err != nil {
				t.Errorf("Failed to fetch updated task: %v", err)
				return
			}

			if updatedTask.Title != tt.task.Title {
				t.Errorf("UpdateTask() expected title %s, got %s", tt.task.Title, updatedTask.Title)
			}

			if updatedTask.Status != tt.task.Status {
				t.Errorf("UpdateTask() expected status %s, got %s", tt.task.Status, updatedTask.Status)
			}
		})
	}
}

func TestTaskRepository_DeleteTask(t *testing.T) {
	db := setupTaskTestDB(t)
	defer db.Close()

	repo := NewTaskRepository(db)
	ctx := context.Background()

	// Create a test task first
	task := createTestTask("Test Task for Delete")
	createdTask, err := repo.CreateTask(ctx, task)
	if err != nil {
		t.Fatalf("Failed to create test task: %v", err)
	}

	// Delete the task
	err = repo.DeleteTask(ctx, createdTask.ID)
	if err != nil {
		t.Errorf("DeleteTask() unexpected error: %v", err)
	}

	// Verify the task is deleted
	_, err = repo.GetTaskByID(ctx, createdTask.ID)
	if err == nil {
		t.Errorf("DeleteTask() expected task to be deleted, but it still exists")
	}
}

func TestTaskRepository_ListTasks(t *testing.T) {
	db := setupTaskTestDB(t)
	defer db.Close()

	repo := NewTaskRepository(db)
	ctx := context.Background()

	// Create test tasks
	tasks := []*models.Task{
		{
			Title:       "Pending Task 1",
			Description: "Description 1",
			Status:      models.TaskStatusPending,
		},
		{
			Title:       "Completed Task 1",
			Description: "Description 2",
			Status:      models.TaskStatusCompleted,
		},
		{
			Title:       "Pending Task 2",
			Description: "Description 3",
			Status:      models.TaskStatusPending,
		},
	}

	for _, task := range tasks {
		_, err := repo.CreateTask(ctx, task)
		if err != nil {
			t.Fatalf("Failed to create test task: %v", err)
		}
	}

	tests := []struct {
		name        string
		filters     TaskFilters
		expectedLen int
	}{
		{
			name:        "no filters",
			filters:     TaskFilters{},
			expectedLen: 3,
		},
		{
			name: "filter by pending status",
			filters: TaskFilters{
				Status: models.TaskStatusPending,
			},
			expectedLen: 2,
		},
		{
			name: "filter by completed status",
			filters: TaskFilters{
				Status: models.TaskStatusCompleted,
			},
			expectedLen: 1,
		},
		{
			name: "search filter",
			filters: TaskFilters{
				Search: "Pending",
			},
			expectedLen: 2,
		},
		{
			name: "limit filter",
			filters: TaskFilters{
				Limit: 2,
			},
			expectedLen: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := repo.ListTasks(ctx, tt.filters)
			if err != nil {
				t.Errorf("ListTasks() unexpected error: %v", err)
				return
			}

			if len(result) != tt.expectedLen {
				t.Errorf("ListTasks() expected %d tasks, got %d", tt.expectedLen, len(result))
			}
		})
	}
}

func TestTaskRepository_GetTasksByStatus(t *testing.T) {
	db := setupTaskTestDB(t)
	defer db.Close()

	repo := NewTaskRepository(db)
	ctx := context.Background()

	// Create test tasks with different statuses
	pendingTask := createTestTask("Pending Task")
	pendingTask.Status = models.TaskStatusPending
	_, err := repo.CreateTask(ctx, pendingTask)
	if err != nil {
		t.Fatalf("Failed to create pending task: %v", err)
	}

	completedTask := createTestTask("Completed Task")
	completedTask.Status = models.TaskStatusCompleted
	_, err = repo.CreateTask(ctx, completedTask)
	if err != nil {
		t.Fatalf("Failed to create completed task: %v", err)
	}

	// Test getting pending tasks
	pendingTasks, err := repo.GetTasksByStatus(ctx, models.TaskStatusPending)
	if err != nil {
		t.Errorf("GetTasksByStatus() unexpected error: %v", err)
	}
	if len(pendingTasks) != 1 {
		t.Errorf("GetTasksByStatus() expected 1 pending task, got %d", len(pendingTasks))
	}

	// Test getting completed tasks
	completedTasks, err := repo.GetTasksByStatus(ctx, models.TaskStatusCompleted)
	if err != nil {
		t.Errorf("GetTasksByStatus() unexpected error: %v", err)
	}
	if len(completedTasks) != 1 {
		t.Errorf("GetTasksByStatus() expected 1 completed task, got %d", len(completedTasks))
	}
}

func TestTaskRepository_GetTasksByDueDateRange(t *testing.T) {
	db := setupTaskTestDB(t)
	defer db.Close()

	repo := NewTaskRepository(db)
	ctx := context.Background()

	// Create test tasks with different due dates
	now := time.Now()
	tomorrow := now.Add(24 * time.Hour)
	nextWeek := now.Add(7 * 24 * time.Hour)

	tasks := []*models.Task{
		{
			Title:   "Task Due Tomorrow",
			DueDate: &tomorrow,
			Status:  models.TaskStatusPending,
		},
		{
			Title:   "Task Due Next Week",
			DueDate: &nextWeek,
			Status:  models.TaskStatusPending,
		},
		{
			Title:  "Task No Due Date",
			Status: models.TaskStatusPending,
		},
	}

	for _, task := range tasks {
		_, err := repo.CreateTask(ctx, task)
		if err != nil {
			t.Fatalf("Failed to create test task: %v", err)
		}
	}

	// Test getting tasks in date range
	startDate := now
	endDate := now.Add(3 * 24 * time.Hour) // 3 days from now

	tasksInRange, err := repo.GetTasksByDueDateRange(ctx, startDate, endDate)
	if err != nil {
		t.Errorf("GetTasksByDueDateRange() unexpected error: %v", err)
	}

	// Should only get the task due tomorrow
	if len(tasksInRange) != 1 {
		t.Errorf("GetTasksByDueDateRange() expected 1 task, got %d", len(tasksInRange))
	}
}

func TestTaskRepository_GetOverdueTasks(t *testing.T) {
	db := setupTaskTestDB(t)
	defer db.Close()

	repo := NewTaskRepository(db)
	ctx := context.Background()

	// Create test tasks
	now := time.Now()
	yesterday := now.Add(-24 * time.Hour)
	tomorrow := now.Add(24 * time.Hour)

	tasks := []*models.Task{
		{
			Title:   "Overdue Pending Task",
			DueDate: &yesterday,
			Status:  models.TaskStatusPending,
		},
		{
			Title:   "Overdue Completed Task",
			DueDate: &yesterday,
			Status:  models.TaskStatusCompleted,
		},
		{
			Title:   "Future Task",
			DueDate: &tomorrow,
			Status:  models.TaskStatusPending,
		},
	}

	for _, task := range tasks {
		_, err := repo.CreateTask(ctx, task)
		if err != nil {
			t.Fatalf("Failed to create test task: %v", err)
		}
	}

	// Test getting overdue tasks
	overdueTasks, err := repo.GetOverdueTasks(ctx)
	if err != nil {
		t.Errorf("GetOverdueTasks() unexpected error: %v", err)
	}

	// Should only get the overdue pending task
	if len(overdueTasks) != 1 {
		t.Errorf("GetOverdueTasks() expected 1 task, got %d", len(overdueTasks))
	}

	if overdueTasks[0].Title != "Overdue Pending Task" {
		t.Errorf("GetOverdueTasks() expected 'Overdue Pending Task', got %s", overdueTasks[0].Title)
	}
}

func TestTaskRepository_CountTasks(t *testing.T) {
	db := setupTaskTestDB(t)
	defer db.Close()

	repo := NewTaskRepository(db)
	ctx := context.Background()

	// Create test tasks
	tasks := []*models.Task{
		createTestTask("Task 1"),
		createTestTask("Task 2"),
		createTestTask("Task 3"),
	}

	for _, task := range tasks {
		_, err := repo.CreateTask(ctx, task)
		if err != nil {
			t.Fatalf("Failed to create test task: %v", err)
		}
	}

	// Test counting all tasks
	count, err := repo.CountTasks(ctx, TaskFilters{})
	if err != nil {
		t.Errorf("CountTasks() unexpected error: %v", err)
	}

	if count != 3 {
		t.Errorf("CountTasks() expected 3 tasks, got %d", count)
	}

	// Test counting with filters
	count, err = repo.CountTasks(ctx, TaskFilters{
		Status: models.TaskStatusPending,
	})
	if err != nil {
		t.Errorf("CountTasks() with filter unexpected error: %v", err)
	}

	if count != 3 {
		t.Errorf("CountTasks() with filter expected 3 tasks, got %d", count)
	}
}
