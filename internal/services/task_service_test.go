package services

import (
	"context"
	"errors"
	"testing"
	"time"

	"agenda/internal/database"
	"agenda/internal/models"
)

// MockTaskRepository implements TaskRepositoryInterface for testing
type MockTaskRepository struct {
	tasks       map[int]*models.Task
	nextID      int
	shouldError bool
	errorMsg    string
}

func NewMockTaskRepository() *MockTaskRepository {
	return &MockTaskRepository{
		tasks:  make(map[int]*models.Task),
		nextID: 1,
	}
}

func (m *MockTaskRepository) SetError(shouldError bool, msg string) {
	m.shouldError = shouldError
	m.errorMsg = msg
}

func (m *MockTaskRepository) CreateTask(ctx context.Context, task *models.Task) (*models.Task, error) {
	if m.shouldError {
		return nil, errors.New(m.errorMsg)
	}

	task.ID = m.nextID
	m.nextID++
	now := time.Now()
	task.CreatedAt = now
	task.UpdatedAt = now
	if task.Status == "" {
		task.Status = models.TaskStatusPending
	}

	m.tasks[task.ID] = task
	return task, nil
}

func (m *MockTaskRepository) GetTaskByID(ctx context.Context, id int) (*models.Task, error) {
	if m.shouldError {
		return nil, errors.New(m.errorMsg)
	}

	task, exists := m.tasks[id]
	if !exists {
		return nil, errors.New("task not found")
	}

	// Return a copy to avoid modification issues
	taskCopy := *task
	return &taskCopy, nil
}

func (m *MockTaskRepository) UpdateTask(ctx context.Context, task *models.Task) error {
	if m.shouldError {
		return errors.New(m.errorMsg)
	}

	if _, exists := m.tasks[task.ID]; !exists {
		return errors.New("task not found")
	}

	task.UpdatedAt = time.Now()
	m.tasks[task.ID] = task
	return nil
}

func (m *MockTaskRepository) DeleteTask(ctx context.Context, id int) error {
	if m.shouldError {
		return errors.New(m.errorMsg)
	}

	if _, exists := m.tasks[id]; !exists {
		return errors.New("task not found")
	}

	delete(m.tasks, id)
	return nil
}

func (m *MockTaskRepository) ListTasks(ctx context.Context, filters database.TaskFilters) ([]*models.Task, error) {
	if m.shouldError {
		return nil, errors.New(m.errorMsg)
	}

	var result []*models.Task
	for _, task := range m.tasks {
		// Apply filters
		if filters.Status != "" && task.Status != filters.Status {
			continue
		}
		if filters.DueAfter != nil && (task.DueDate == nil || task.DueDate.Before(*filters.DueAfter)) {
			continue
		}
		if filters.DueBefore != nil && (task.DueDate == nil || task.DueDate.After(*filters.DueBefore)) {
			continue
		}

		taskCopy := *task
		result = append(result, &taskCopy)
	}

	return result, nil
}

func (m *MockTaskRepository) CountTasks(ctx context.Context, filters database.TaskFilters) (int64, error) {
	if m.shouldError {
		return 0, errors.New(m.errorMsg)
	}

	tasks, err := m.ListTasks(ctx, filters)
	if err != nil {
		return 0, err
	}

	return int64(len(tasks)), nil
}

func (m *MockTaskRepository) GetTasksByStatus(ctx context.Context, status string) ([]*models.Task, error) {
	return m.ListTasks(ctx, database.TaskFilters{Status: status})
}

func (m *MockTaskRepository) GetTasksByDueDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.Task, error) {
	return m.ListTasks(ctx, database.TaskFilters{
		DueAfter:  &startDate,
		DueBefore: &endDate,
	})
}

func (m *MockTaskRepository) GetOverdueTasks(ctx context.Context) ([]*models.Task, error) {
	if m.shouldError {
		return nil, errors.New(m.errorMsg)
	}

	var result []*models.Task
	now := time.Now()
	for _, task := range m.tasks {
		if task.Status == models.TaskStatusPending && task.DueDate != nil && task.DueDate.Before(now) {
			taskCopy := *task
			result = append(result, &taskCopy)
		}
	}

	return result, nil
}

// Implement BaseRepository interface methods (not used in tests but required)
func (m *MockTaskRepository) Create(ctx context.Context, query string, args ...interface{}) (int64, error) {
	return 0, nil
}
func (m *MockTaskRepository) GetByID(ctx context.Context, dest interface{}, query string, id interface{}) error {
	return nil
}
func (m *MockTaskRepository) Update(ctx context.Context, query string, args ...interface{}) error {
	return nil
}
func (m *MockTaskRepository) Delete(ctx context.Context, query string, id interface{}) error {
	return nil
}
func (m *MockTaskRepository) List(ctx context.Context, dest interface{}, query string, args ...interface{}) error {
	return nil
}
func (m *MockTaskRepository) Count(ctx context.Context, query string, args ...interface{}) (int64, error) {
	return 0, nil
}
func (m *MockTaskRepository) Exists(ctx context.Context, query string, args ...interface{}) (bool, error) {
	return false, nil
}

func TestTaskService_CreateTask(t *testing.T) {
	mockRepo := NewMockTaskRepository()
	service := NewTaskService(mockRepo)
	ctx := context.Background()

	t.Run("successful task creation", func(t *testing.T) {
		req := CreateTaskRequest{
			Title:       "Test Task",
			Description: "Test Description",
		}

		task, err := service.CreateTask(ctx, req)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if task.ID == 0 {
			t.Error("expected task ID to be set")
		}
		if task.Title != "Test Task" {
			t.Errorf("expected title 'Test Task', got '%s'", task.Title)
		}
		if task.Status != models.TaskStatusPending {
			t.Errorf("expected status 'pending', got '%s'", task.Status)
		}
	})

	t.Run("task creation with due date", func(t *testing.T) {
		futureDate := time.Now().AddDate(0, 0, 1)
		req := CreateTaskRequest{
			Title:   "Task with due date",
			DueDate: &futureDate,
		}

		task, err := service.CreateTask(ctx, req)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if task.DueDate == nil {
			t.Error("expected due date to be set")
		}
		if !task.DueDate.Equal(futureDate) {
			t.Errorf("expected due date %v, got %v", futureDate, *task.DueDate)
		}
	})

	t.Run("validation error - empty title", func(t *testing.T) {
		req := CreateTaskRequest{
			Title: "",
		}

		_, err := service.CreateTask(ctx, req)
		if err == nil {
			t.Error("expected validation error for empty title")
		}
		if err != ErrTaskTitleRequired {
			t.Errorf("expected ErrTaskTitleRequired, got %v", err)
		}
	})

	t.Run("validation error - title too long", func(t *testing.T) {
		longTitle := make([]byte, 256)
		for i := range longTitle {
			longTitle[i] = 'a'
		}

		req := CreateTaskRequest{
			Title: string(longTitle),
		}

		_, err := service.CreateTask(ctx, req)
		if err == nil {
			t.Error("expected validation error for long title")
		}
		if err != ErrTaskTitleTooLong {
			t.Errorf("expected ErrTaskTitleTooLong, got %v", err)
		}
	})

	t.Run("validation error - due date in past", func(t *testing.T) {
		pastDate := time.Now().AddDate(0, 0, -1)
		req := CreateTaskRequest{
			Title:   "Task with past due date",
			DueDate: &pastDate,
		}

		_, err := service.CreateTask(ctx, req)
		if err == nil {
			t.Error("expected validation error for past due date")
		}
		if err != ErrDueDateInPast {
			t.Errorf("expected ErrDueDateInPast, got %v", err)
		}
	})

	t.Run("repository error", func(t *testing.T) {
		mockRepo.SetError(true, "database error")
		defer mockRepo.SetError(false, "")

		req := CreateTaskRequest{
			Title: "Test Task",
		}

		_, err := service.CreateTask(ctx, req)
		if err == nil {
			t.Error("expected repository error")
		}
	})
}

func TestTaskService_GetTaskByID(t *testing.T) {
	mockRepo := NewMockTaskRepository()
	service := NewTaskService(mockRepo)
	ctx := context.Background()

	// Create a test task
	testTask := &models.Task{
		ID:     1,
		Title:  "Test Task",
		Status: models.TaskStatusPending,
	}
	mockRepo.tasks[1] = testTask

	t.Run("successful task retrieval", func(t *testing.T) {
		task, err := service.GetTaskByID(ctx, 1)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if task.ID != 1 {
			t.Errorf("expected ID 1, got %d", task.ID)
		}
		if task.Title != "Test Task" {
			t.Errorf("expected title 'Test Task', got '%s'", task.Title)
		}
	})

	t.Run("task not found", func(t *testing.T) {
		_, err := service.GetTaskByID(ctx, 999)
		if err == nil {
			t.Error("expected error for non-existent task")
		}
	})

	t.Run("invalid task ID", func(t *testing.T) {
		_, err := service.GetTaskByID(ctx, 0)
		if err == nil {
			t.Error("expected error for invalid task ID")
		}
	})
}

func TestTaskService_UpdateTask(t *testing.T) {
	mockRepo := NewMockTaskRepository()
	service := NewTaskService(mockRepo)
	ctx := context.Background()

	// Create a test task
	testTask := &models.Task{
		ID:          1,
		Title:       "Original Title",
		Description: "Original Description",
		Status:      models.TaskStatusPending,
	}
	mockRepo.tasks[1] = testTask

	t.Run("successful task update", func(t *testing.T) {
		newTitle := "Updated Title"
		req := UpdateTaskRequest{
			Title: &newTitle,
		}

		updatedTask, err := service.UpdateTask(ctx, 1, req)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if updatedTask.Title != "Updated Title" {
			t.Errorf("expected title 'Updated Title', got '%s'", updatedTask.Title)
		}
	})

	t.Run("update with invalid status", func(t *testing.T) {
		invalidStatus := "invalid"
		req := UpdateTaskRequest{
			Status: &invalidStatus,
		}

		_, err := service.UpdateTask(ctx, 1, req)
		if err == nil {
			t.Error("expected validation error for invalid status")
		}
		if err != ErrInvalidTaskStatus {
			t.Errorf("expected ErrInvalidTaskStatus, got %v", err)
		}
	})

	t.Run("task not found", func(t *testing.T) {
		newTitle := "Updated Title"
		req := UpdateTaskRequest{
			Title: &newTitle,
		}

		_, err := service.UpdateTask(ctx, 999, req)
		if err == nil {
			t.Error("expected error for non-existent task")
		}
	})
}

func TestTaskService_CompleteTask(t *testing.T) {
	mockRepo := NewMockTaskRepository()
	service := NewTaskService(mockRepo)
	ctx := context.Background()

	// Create a test task
	testTask := &models.Task{
		ID:     1,
		Title:  "Test Task",
		Status: models.TaskStatusPending,
	}
	mockRepo.tasks[1] = testTask

	t.Run("successful task completion", func(t *testing.T) {
		completedTask, err := service.CompleteTask(ctx, 1)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if completedTask.Status != models.TaskStatusCompleted {
			t.Errorf("expected status 'completed', got '%s'", completedTask.Status)
		}
	})

	t.Run("task already completed", func(t *testing.T) {
		_, err := service.CompleteTask(ctx, 1)
		if err == nil {
			t.Error("expected error for already completed task")
		}
		if err != ErrTaskAlreadyCompleted {
			t.Errorf("expected ErrTaskAlreadyCompleted, got %v", err)
		}
	})
}

func TestTaskService_ReopenTask(t *testing.T) {
	mockRepo := NewMockTaskRepository()
	service := NewTaskService(mockRepo)
	ctx := context.Background()

	// Create a completed test task
	testTask := &models.Task{
		ID:     1,
		Title:  "Test Task",
		Status: models.TaskStatusCompleted,
	}
	mockRepo.tasks[1] = testTask

	t.Run("successful task reopening", func(t *testing.T) {
		reopenedTask, err := service.ReopenTask(ctx, 1)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if reopenedTask.Status != models.TaskStatusPending {
			t.Errorf("expected status 'pending', got '%s'", reopenedTask.Status)
		}
	})

	t.Run("task already pending", func(t *testing.T) {
		_, err := service.ReopenTask(ctx, 1)
		if err == nil {
			t.Error("expected error for already pending task")
		}
		if err != ErrTaskAlreadyPending {
			t.Errorf("expected ErrTaskAlreadyPending, got %v", err)
		}
	})
}

func TestTaskService_ListTasks(t *testing.T) {
	mockRepo := NewMockTaskRepository()
	service := NewTaskService(mockRepo)
	ctx := context.Background()

	// Create test tasks
	task1 := &models.Task{ID: 1, Title: "Task 1", Status: models.TaskStatusPending}
	task2 := &models.Task{ID: 2, Title: "Task 2", Status: models.TaskStatusCompleted}
	mockRepo.tasks[1] = task1
	mockRepo.tasks[2] = task2

	t.Run("list all tasks", func(t *testing.T) {
		filters := TaskListFilters{}
		tasks, total, err := service.ListTasks(ctx, filters)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if len(tasks) != 2 {
			t.Errorf("expected 2 tasks, got %d", len(tasks))
		}
		if total != 2 {
			t.Errorf("expected total 2, got %d", total)
		}
	})

	t.Run("list tasks with status filter", func(t *testing.T) {
		filters := TaskListFilters{
			Status: models.TaskStatusPending,
		}
		tasks, total, err := service.ListTasks(ctx, filters)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if len(tasks) != 1 {
			t.Errorf("expected 1 task, got %d", len(tasks))
		}
		if total != 1 {
			t.Errorf("expected total 1, got %d", total)
		}
		if tasks[0].Status != models.TaskStatusPending {
			t.Errorf("expected pending task, got %s", tasks[0].Status)
		}
	})

	t.Run("pagination defaults", func(t *testing.T) {
		filters := TaskListFilters{
			PageSize: 0, // Should default to 20
		}
		_, _, err := service.ListTasks(ctx, filters)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}
		// Test passes if no error occurs with default pagination
	})
}

func TestTaskService_GetOverdueTasks(t *testing.T) {
	mockRepo := NewMockTaskRepository()
	service := NewTaskService(mockRepo)
	ctx := context.Background()

	// Create test tasks
	pastDate := time.Now().AddDate(0, 0, -1)
	futureDate := time.Now().AddDate(0, 0, 1)

	overdueTask := &models.Task{
		ID:      1,
		Title:   "Overdue Task",
		Status:  models.TaskStatusPending,
		DueDate: &pastDate,
	}
	futureTask := &models.Task{
		ID:      2,
		Title:   "Future Task",
		Status:  models.TaskStatusPending,
		DueDate: &futureDate,
	}
	completedOverdueTask := &models.Task{
		ID:      3,
		Title:   "Completed Overdue Task",
		Status:  models.TaskStatusCompleted,
		DueDate: &pastDate,
	}

	mockRepo.tasks[1] = overdueTask
	mockRepo.tasks[2] = futureTask
	mockRepo.tasks[3] = completedOverdueTask

	t.Run("get overdue tasks", func(t *testing.T) {
		tasks, err := service.GetOverdueTasks(ctx)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if len(tasks) != 1 {
			t.Errorf("expected 1 overdue task, got %d", len(tasks))
		}
		if len(tasks) > 0 && tasks[0].ID != 1 {
			t.Errorf("expected overdue task ID 1, got %d", tasks[0].ID)
		}
	})
}

func TestTaskService_GetUpcomingTasks(t *testing.T) {
	mockRepo := NewMockTaskRepository()
	service := NewTaskService(mockRepo)
	ctx := context.Background()

	// Create test tasks
	tomorrow := time.Now().AddDate(0, 0, 1)
	nextWeek := time.Now().AddDate(0, 0, 8)

	upcomingTask := &models.Task{
		ID:      1,
		Title:   "Upcoming Task",
		Status:  models.TaskStatusPending,
		DueDate: &tomorrow,
	}
	distantTask := &models.Task{
		ID:      2,
		Title:   "Distant Task",
		Status:  models.TaskStatusPending,
		DueDate: &nextWeek,
	}

	mockRepo.tasks[1] = upcomingTask
	mockRepo.tasks[2] = distantTask

	t.Run("get upcoming tasks within 7 days", func(t *testing.T) {
		tasks, err := service.GetUpcomingTasks(ctx, 7)
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if len(tasks) != 1 {
			t.Errorf("expected 1 upcoming task, got %d", len(tasks))
		}
		if len(tasks) > 0 && tasks[0].ID != 1 {
			t.Errorf("expected upcoming task ID 1, got %d", tasks[0].ID)
		}
	})

	t.Run("get upcoming tasks with default days", func(t *testing.T) {
		tasks, err := service.GetUpcomingTasks(ctx, -1) // Should default to 7
		if err != nil {
			t.Fatalf("expected no error, got %v", err)
		}

		if len(tasks) != 1 {
			t.Errorf("expected 1 upcoming task, got %d", len(tasks))
		}
	})
}