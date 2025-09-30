package services

import (
	"context"
	"testing"
	"time"

	"agenda/internal/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockTaskService is a mock implementation of TaskServiceInterface
type MockTaskService struct {
	mock.Mock
}

func (m *MockTaskService) CreateTask(ctx context.Context, req CreateTaskRequest) (*models.Task, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*models.Task), args.Error(1)
}

func (m *MockTaskService) GetTaskByID(ctx context.Context, id int) (*models.Task, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.Task), args.Error(1)
}

func (m *MockTaskService) UpdateTask(ctx context.Context, id int, req UpdateTaskRequest) (*models.Task, error) {
	args := m.Called(ctx, id, req)
	return args.Get(0).(*models.Task), args.Error(1)
}

func (m *MockTaskService) DeleteTask(ctx context.Context, id int) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockTaskService) CompleteTask(ctx context.Context, id int) (*models.Task, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.Task), args.Error(1)
}

func (m *MockTaskService) ReopenTask(ctx context.Context, id int) (*models.Task, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.Task), args.Error(1)
}

func (m *MockTaskService) ListTasks(ctx context.Context, filters TaskListFilters) ([]*models.Task, int64, error) {
	args := m.Called(ctx, filters)
	return args.Get(0).([]*models.Task), args.Get(1).(int64), args.Error(2)
}

func (m *MockTaskService) GetOverdueTasks(ctx context.Context) ([]*models.Task, error) {
	args := m.Called(ctx)
	return args.Get(0).([]*models.Task), args.Error(1)
}

func (m *MockTaskService) GetTasksByStatus(ctx context.Context, status string) ([]*models.Task, error) {
	args := m.Called(ctx, status)
	return args.Get(0).([]*models.Task), args.Error(1)
}

func (m *MockTaskService) GetUpcomingTasks(ctx context.Context, days int) ([]*models.Task, error) {
	args := m.Called(ctx, days)
	return args.Get(0).([]*models.Task), args.Error(1)
}

// MockEventService is a mock implementation of EventServiceInterface
type MockEventService struct {
	mock.Mock
}

func (m *MockEventService) CreateEvent(ctx context.Context, req CreateEventRequest) (*models.Event, error) {
	args := m.Called(ctx, req)
	return args.Get(0).(*models.Event), args.Error(1)
}

func (m *MockEventService) GetEventByID(ctx context.Context, id int) (*models.Event, error) {
	args := m.Called(ctx, id)
	return args.Get(0).(*models.Event), args.Error(1)
}

func (m *MockEventService) UpdateEvent(ctx context.Context, id int, req UpdateEventRequest) (*models.Event, error) {
	args := m.Called(ctx, id, req)
	return args.Get(0).(*models.Event), args.Error(1)
}

func (m *MockEventService) DeleteEvent(ctx context.Context, id int) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockEventService) GetEventsByDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.Event, error) {
	args := m.Called(ctx, startDate, endDate)
	return args.Get(0).([]*models.Event), args.Error(1)
}

func (m *MockEventService) GetEventsByMonth(ctx context.Context, year int, month time.Month) ([]*models.Event, error) {
	args := m.Called(ctx, year, month)
	return args.Get(0).([]*models.Event), args.Error(1)
}

func (m *MockEventService) GetEventsByDay(ctx context.Context, date time.Time) ([]*models.Event, error) {
	args := m.Called(ctx, date)
	return args.Get(0).([]*models.Event), args.Error(1)
}

func (m *MockEventService) GetUpcomingEvents(ctx context.Context, limit int) ([]*models.Event, error) {
	args := m.Called(ctx, limit)
	return args.Get(0).([]*models.Event), args.Error(1)
}

func (m *MockEventService) CheckTimeConflicts(ctx context.Context, startTime, endTime time.Time, excludeEventID *int) ([]*models.Event, error) {
	args := m.Called(ctx, startTime, endTime, excludeEventID)
	return args.Get(0).([]*models.Event), args.Error(1)
}

func (m *MockEventService) ValidateEventTimes(startTime, endTime time.Time) error {
	args := m.Called(startTime, endTime)
	return args.Error(0)
}

func (m *MockEventService) ListEvents(ctx context.Context, filters EventListFilters) ([]*models.Event, int64, error) {
	args := m.Called(ctx, filters)
	return args.Get(0).([]*models.Event), args.Get(1).(int64), args.Error(2)
}

func TestNewDashboardService(t *testing.T) {
	mockTaskService := &MockTaskService{}
	mockEventService := &MockEventService{}

	service := NewDashboardService(mockTaskService, mockEventService)

	assert.NotNil(t, service)
	assert.IsType(t, &DashboardService{}, service)
}

func TestDashboardService_GetDashboardData(t *testing.T) {
	mockTaskService := &MockTaskService{}
	mockEventService := &MockEventService{}
	service := NewDashboardService(mockTaskService, mockEventService)

	ctx := context.Background()
	now := time.Now()
	startDate := now.Truncate(24 * time.Hour)
	
	// Create test data
	upcomingTasks := []*models.Task{
		{ID: 1, Title: "Task 1", Status: models.TaskStatusPending, DueDate: &now},
	}
	overdueTasks := []*models.Task{
		{ID: 2, Title: "Overdue Task", Status: models.TaskStatusPending},
	}
	upcomingEvents := []*models.Event{
		{ID: 1, Title: "Event 1", StartTime: now.Add(time.Hour)},
	}
	todayEvents := []*models.Event{
		{ID: 2, Title: "Today Event", StartTime: now},
	}
	allTasks := []*models.Task{
		{ID: 1, Status: models.TaskStatusPending},
		{ID: 2, Status: models.TaskStatusCompleted},
	}

	// Set up mock expectations
	mockTaskService.On("GetUpcomingTasks", ctx, 7).Return(upcomingTasks, nil)
	mockTaskService.On("GetOverdueTasks", ctx).Return(overdueTasks, nil)
	mockTaskService.On("ListTasks", ctx, mock.AnythingOfType("TaskListFilters")).Return(allTasks, int64(2), nil)
	
	mockEventService.On("GetUpcomingEvents", ctx, 10).Return(upcomingEvents, nil)
	mockEventService.On("GetEventsByDay", ctx, mock.AnythingOfType("time.Time")).Return(todayEvents, nil)
	mockEventService.On("ListEvents", ctx, mock.AnythingOfType("EventListFilters")).Return([]*models.Event{}, int64(0), nil)

	filters := DashboardFilters{
		StartDate:     &startDate,
		IncludeTasks:  true,
		IncludeEvents: true,
	}

	result, err := service.GetDashboardData(ctx, filters)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, upcomingTasks, result.UpcomingTasks)
	assert.Equal(t, overdueTasks, result.OverdueTasks)
	assert.Equal(t, upcomingEvents, result.UpcomingEvents)
	assert.Equal(t, todayEvents, result.TodayEvents)
	assert.NotNil(t, result.Stats)

	mockTaskService.AssertExpectations(t)
	mockEventService.AssertExpectations(t)
}

func TestDashboardService_GetDashboardData_InvalidDateRange(t *testing.T) {
	mockTaskService := &MockTaskService{}
	mockEventService := &MockEventService{}
	service := NewDashboardService(mockTaskService, mockEventService)

	ctx := context.Background()
	now := time.Now()
	startDate := now
	endDate := now.Add(-time.Hour) // End date before start date

	filters := DashboardFilters{
		StartDate: &startDate,
		EndDate:   &endDate,
	}

	result, err := service.GetDashboardData(ctx, filters)

	assert.Error(t, err)
	assert.Equal(t, ErrInvalidDateRange, err)
	assert.Nil(t, result)
}

func TestDashboardService_GetUpcomingItems(t *testing.T) {
	mockTaskService := &MockTaskService{}
	mockEventService := &MockEventService{}
	service := NewDashboardService(mockTaskService, mockEventService)

	ctx := context.Background()
	now := time.Now()
	
	upcomingTasks := []*models.Task{
		{ID: 1, Title: "Task 1", DueDate: &now},
		{ID: 2, Title: "Task 2", DueDate: &now},
	}
	upcomingEvents := []*models.Event{
		{ID: 1, Title: "Event 1", StartTime: now.Add(time.Hour)},
		{ID: 2, Title: "Event 2", StartTime: now.Add(2 * time.Hour)},
	}

	mockTaskService.On("GetUpcomingTasks", ctx, 7).Return(upcomingTasks, nil)
	mockEventService.On("GetUpcomingEvents", ctx, 20).Return(upcomingEvents, nil)

	result, err := service.GetUpcomingItems(ctx, 7, 20)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, upcomingTasks, result.Tasks)
	assert.Equal(t, upcomingEvents, result.Events)
	assert.Equal(t, 4, result.Total)

	mockTaskService.AssertExpectations(t)
	mockEventService.AssertExpectations(t)
}

func TestDashboardService_GetUpcomingItems_WithLimits(t *testing.T) {
	mockTaskService := &MockTaskService{}
	mockEventService := &MockEventService{}
	service := NewDashboardService(mockTaskService, mockEventService)

	ctx := context.Background()
	now := time.Now()
	
	// Create more items than the limit
	upcomingTasks := []*models.Task{
		{ID: 1, Title: "Task 1", DueDate: &now},
		{ID: 2, Title: "Task 2", DueDate: &now},
		{ID: 3, Title: "Task 3", DueDate: &now},
	}
	upcomingEvents := []*models.Event{
		{ID: 1, Title: "Event 1", StartTime: now.Add(time.Hour)},
		{ID: 2, Title: "Event 2", StartTime: now.Add(2 * time.Hour)},
	}

	mockTaskService.On("GetUpcomingTasks", ctx, 7).Return(upcomingTasks, nil)
	mockEventService.On("GetUpcomingEvents", ctx, 3).Return(upcomingEvents, nil)

	result, err := service.GetUpcomingItems(ctx, 7, 3) // Limit to 3 items

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.LessOrEqual(t, len(result.Tasks)+len(result.Events), 3)
	assert.Equal(t, len(result.Tasks)+len(result.Events), result.Total)

	mockTaskService.AssertExpectations(t)
	mockEventService.AssertExpectations(t)
}

func TestDashboardService_GetDashboardStats(t *testing.T) {
	mockTaskService := &MockTaskService{}
	mockEventService := &MockEventService{}
	service := NewDashboardService(mockTaskService, mockEventService)

	ctx := context.Background()
	now := time.Now()
	
	overdueTasks := []*models.Task{
		{ID: 4, Status: models.TaskStatusPending},
	}
	allEvents := []*models.Event{
		{ID: 1, StartTime: now.Add(time.Hour)},
		{ID: 2, StartTime: now.Add(-time.Hour)},
	}

	// Mock the new behavior: separate calls for total, completed, and pending counts
	mockTaskService.On("ListTasks", ctx, TaskListFilters{PageSize: 1}).Return([]*models.Task{}, int64(3), nil)
	mockTaskService.On("ListTasks", ctx, TaskListFilters{Status: models.TaskStatusCompleted, PageSize: 1}).Return([]*models.Task{}, int64(2), nil)
	mockTaskService.On("ListTasks", ctx, TaskListFilters{Status: models.TaskStatusPending, PageSize: 1}).Return([]*models.Task{}, int64(1), nil)
	mockTaskService.On("GetOverdueTasks", ctx).Return(overdueTasks, nil)
	mockEventService.On("ListEvents", ctx, mock.AnythingOfType("EventListFilters")).Return(allEvents, int64(2), nil)

	result, err := service.GetDashboardStats(ctx)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, int64(3), result.TotalTasks)
	assert.Equal(t, int64(2), result.CompletedTasks)
	assert.Equal(t, int64(1), result.PendingTasks)
	assert.Equal(t, int64(1), result.OverdueTasks)
	assert.Equal(t, int64(2), result.TotalEvents)
	assert.InDelta(t, 66.67, result.CompletionRate, 0.01) // 2/3 * 100

	mockTaskService.AssertExpectations(t)
	mockEventService.AssertExpectations(t)
}

func TestDashboardService_GetDashboardStats_LargeDataset(t *testing.T) {
	mockTaskService := &MockTaskService{}
	mockEventService := &MockEventService{}
	service := NewDashboardService(mockTaskService, mockEventService)

	ctx := context.Background()
	now := time.Now()
	
	overdueTasks := []*models.Task{
		{ID: 1, Status: models.TaskStatusPending},
		{ID: 2, Status: models.TaskStatusPending},
	}
	allEvents := []*models.Event{
		{ID: 1, StartTime: now.Add(time.Hour)},
	}

	// Mock large dataset: 1000 total tasks, 750 completed, 250 pending
	mockTaskService.On("ListTasks", ctx, TaskListFilters{PageSize: 1}).Return([]*models.Task{}, int64(1000), nil)
	mockTaskService.On("ListTasks", ctx, TaskListFilters{Status: models.TaskStatusCompleted, PageSize: 1}).Return([]*models.Task{}, int64(750), nil)
	mockTaskService.On("ListTasks", ctx, TaskListFilters{Status: models.TaskStatusPending, PageSize: 1}).Return([]*models.Task{}, int64(250), nil)
	mockTaskService.On("GetOverdueTasks", ctx).Return(overdueTasks, nil)
	mockEventService.On("ListEvents", ctx, mock.AnythingOfType("EventListFilters")).Return(allEvents, int64(1), nil)

	result, err := service.GetDashboardStats(ctx)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, int64(1000), result.TotalTasks)
	assert.Equal(t, int64(750), result.CompletedTasks)
	assert.Equal(t, int64(250), result.PendingTasks)
	assert.Equal(t, int64(2), result.OverdueTasks)
	assert.Equal(t, int64(1), result.TotalEvents)
	assert.InDelta(t, 75.0, result.CompletionRate, 0.01) // 750/1000 * 100

	mockTaskService.AssertExpectations(t)
	mockEventService.AssertExpectations(t)
}

func TestDashboardService_GetCombinedCalendarView(t *testing.T) {
	mockTaskService := &MockTaskService{}
	mockEventService := &MockEventService{}
	service := NewDashboardService(mockTaskService, mockEventService)

	ctx := context.Background()
	year := 2024
	month := time.January
	dueDate := time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)
	
	events := []*models.Event{
		{ID: 1, Title: "Event 1", StartTime: time.Date(2024, 1, 10, 14, 0, 0, 0, time.UTC)},
	}
	tasks := []*models.Task{
		{ID: 1, Title: "Task 1", DueDate: &dueDate},
		{ID: 2, Title: "Task 2", DueDate: nil}, // Should be filtered out
	}

	mockEventService.On("GetEventsByMonth", ctx, year, month).Return(events, nil)
	mockTaskService.On("ListTasks", ctx, mock.AnythingOfType("TaskListFilters")).Return(tasks, int64(2), nil)

	result, err := service.GetCombinedCalendarView(ctx, year, month)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, year, result.Year)
	assert.Equal(t, month, result.Month)
	assert.Equal(t, events, result.Events)
	assert.Len(t, result.Tasks, 1) // Only task with due date
	assert.Equal(t, "Task 1", result.Tasks[0].Title)

	mockTaskService.AssertExpectations(t)
	mockEventService.AssertExpectations(t)
}

func TestDashboardService_GetCombinedCalendarView_InvalidYear(t *testing.T) {
	mockTaskService := &MockTaskService{}
	mockEventService := &MockEventService{}
	service := NewDashboardService(mockTaskService, mockEventService)

	ctx := context.Background()

	result, err := service.GetCombinedCalendarView(ctx, 1800, time.January)

	assert.Error(t, err)
	assert.Equal(t, ErrInvalidYear, err)
	assert.Nil(t, result)
}

func TestDashboardService_GetCombinedCalendarView_InvalidMonth(t *testing.T) {
	mockTaskService := &MockTaskService{}
	mockEventService := &MockEventService{}
	service := NewDashboardService(mockTaskService, mockEventService)

	ctx := context.Background()

	result, err := service.GetCombinedCalendarView(ctx, 2024, time.Month(13))

	assert.Error(t, err)
	assert.Equal(t, ErrInvalidMonth, err)
	assert.Nil(t, result)
}

func TestDashboardService_GetItemsByDateRange(t *testing.T) {
	mockTaskService := &MockTaskService{}
	mockEventService := &MockEventService{}
	service := NewDashboardService(mockTaskService, mockEventService)

	ctx := context.Background()
	startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2024, 1, 31, 23, 59, 59, 0, time.UTC)
	dueDate := time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)
	
	events := []*models.Event{
		{ID: 1, Title: "Event 1", StartTime: time.Date(2024, 1, 10, 14, 0, 0, 0, time.UTC)},
		{ID: 2, Title: "Event 2", StartTime: time.Date(2024, 1, 20, 16, 0, 0, 0, time.UTC)},
	}
	tasks := []*models.Task{
		{ID: 1, Title: "Task 1", DueDate: &dueDate},
		{ID: 2, Title: "Task 2", DueDate: nil}, // Should be filtered out
	}

	mockEventService.On("GetEventsByDateRange", ctx, startDate, endDate).Return(events, nil)
	mockTaskService.On("ListTasks", ctx, mock.AnythingOfType("TaskListFilters")).Return(tasks, int64(2), nil)

	result, err := service.GetItemsByDateRange(ctx, startDate, endDate)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Equal(t, startDate, result.StartDate)
	assert.Equal(t, endDate, result.EndDate)
	assert.Equal(t, events, result.Events)
	assert.Len(t, result.Tasks, 1) // Only task with due date
	assert.Equal(t, "Task 1", result.Tasks[0].Title)
	assert.Equal(t, 3, result.Total) // 2 events + 1 task with due date

	mockTaskService.AssertExpectations(t)
	mockEventService.AssertExpectations(t)
}

func TestDashboardService_GetItemsByDateRange_InvalidDateRange(t *testing.T) {
	mockTaskService := &MockTaskService{}
	mockEventService := &MockEventService{}
	service := NewDashboardService(mockTaskService, mockEventService)

	ctx := context.Background()
	startDate := time.Date(2024, 1, 31, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC) // End before start

	result, err := service.GetItemsByDateRange(ctx, startDate, endDate)

	assert.Error(t, err)
	assert.Equal(t, ErrInvalidDateRange, err)
	assert.Nil(t, result)
}

func TestDashboardService_GetCombinedCalendarItems(t *testing.T) {
	mockTaskService := &MockTaskService{}
	mockEventService := &MockEventService{}
	service := NewDashboardService(mockTaskService, mockEventService)

	ctx := context.Background()
	startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(2024, 1, 31, 23, 59, 59, 0, time.UTC)
	dueDate := time.Date(2024, 1, 15, 10, 0, 0, 0, time.UTC)
	eventStart := time.Date(2024, 1, 10, 14, 0, 0, 0, time.UTC)
	eventEnd := time.Date(2024, 1, 10, 15, 0, 0, 0, time.UTC)
	
	events := []*models.Event{
		{ID: 1, Title: "Event 1", Description: "Event desc", StartTime: eventStart, EndTime: eventEnd},
	}
	tasks := []*models.Task{
		{ID: 1, Title: "Task 1", Description: "Task desc", Status: models.TaskStatusPending, DueDate: &dueDate},
	}

	mockEventService.On("GetEventsByDateRange", ctx, startDate, endDate).Return(events, nil)
	mockTaskService.On("ListTasks", ctx, mock.AnythingOfType("TaskListFilters")).Return(tasks, int64(1), nil)

	result, err := service.GetCombinedCalendarItems(ctx, startDate, endDate)

	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.Len(t, result, 2) // 1 task + 1 event

	// Check task item
	taskItem := result[0]
	assert.Equal(t, 1, taskItem.ID)
	assert.Equal(t, "Task 1", taskItem.Title)
	assert.Equal(t, "Task desc", taskItem.Description)
	assert.Equal(t, "task", taskItem.Type)
	assert.Equal(t, models.TaskStatusPending, taskItem.Status)
	assert.Equal(t, dueDate, taskItem.Date)
	assert.Nil(t, taskItem.StartTime)
	assert.Nil(t, taskItem.EndTime)

	// Check event item
	eventItem := result[1]
	assert.Equal(t, 1, eventItem.ID)
	assert.Equal(t, "Event 1", eventItem.Title)
	assert.Equal(t, "Event desc", eventItem.Description)
	assert.Equal(t, "event", eventItem.Type)
	assert.Equal(t, "", eventItem.Status)
	assert.Equal(t, eventStart, eventItem.Date)
	assert.Equal(t, eventStart, *eventItem.StartTime)
	assert.Equal(t, eventEnd, *eventItem.EndTime)

	mockTaskService.AssertExpectations(t)
	mockEventService.AssertExpectations(t)
}