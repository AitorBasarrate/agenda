package services

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"agenda/internal/database"
	"agenda/internal/models"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockEventRepository is a mock implementation of EventRepositoryInterface
type MockEventRepository struct {
	mock.Mock
}

func (m *MockEventRepository) CreateEvent(ctx context.Context, event *models.Event) (*models.Event, error) {
	args := m.Called(ctx, event)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Event), args.Error(1)
}

func (m *MockEventRepository) GetEventByID(ctx context.Context, id int) (*models.Event, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*models.Event), args.Error(1)
}

func (m *MockEventRepository) UpdateEvent(ctx context.Context, event *models.Event) error {
	args := m.Called(ctx, event)
	return args.Error(0)
}

func (m *MockEventRepository) DeleteEvent(ctx context.Context, id int) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockEventRepository) ListEvents(ctx context.Context, filters database.EventFilters) ([]*models.Event, error) {
	args := m.Called(ctx, filters)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Event), args.Error(1)
}

func (m *MockEventRepository) CountEvents(ctx context.Context, filters database.EventFilters) (int64, error) {
	args := m.Called(ctx, filters)
	return args.Get(0).(int64), args.Error(1)
}

func (m *MockEventRepository) GetEventsByDateRange(ctx context.Context, startDate, endDate time.Time) ([]*models.Event, error) {
	args := m.Called(ctx, startDate, endDate)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Event), args.Error(1)
}

func (m *MockEventRepository) GetEventsByMonth(ctx context.Context, year int, month time.Month) ([]*models.Event, error) {
	args := m.Called(ctx, year, month)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Event), args.Error(1)
}

func (m *MockEventRepository) GetEventsByDay(ctx context.Context, date time.Time) ([]*models.Event, error) {
	args := m.Called(ctx, date)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Event), args.Error(1)
}

func (m *MockEventRepository) GetUpcomingEvents(ctx context.Context, limit int) ([]*models.Event, error) {
	args := m.Called(ctx, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Event), args.Error(1)
}

func (m *MockEventRepository) GetEventsByTitle(ctx context.Context, title string) ([]*models.Event, error) {
	args := m.Called(ctx, title)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*models.Event), args.Error(1)
}

// BaseRepository methods (not used in tests but required for interface)
func (m *MockEventRepository) Create(ctx context.Context, query string, args ...interface{}) (int64, error) {
	return 0, nil
}

func (m *MockEventRepository) GetByID(ctx context.Context, dest interface{}, query string, id interface{}) error {
	return nil
}

func (m *MockEventRepository) Update(ctx context.Context, query string, args ...interface{}) error {
	return nil
}

func (m *MockEventRepository) Delete(ctx context.Context, query string, id interface{}) error {
	return nil
}

func (m *MockEventRepository) List(ctx context.Context, dest interface{}, query string, args ...interface{}) error {
	return nil
}

func (m *MockEventRepository) Count(ctx context.Context, query string, args ...interface{}) (int64, error) {
	return 0, nil
}

func (m *MockEventRepository) Exists(ctx context.Context, query string, args ...interface{}) (bool, error) {
	return false, nil
}

func (m *MockEventRepository) WithTransaction(ctx context.Context, fn func(tx *sql.Tx) error) error {
	return nil
}

func (m *MockEventRepository) BeginTx(ctx context.Context) (*sql.Tx, error) {
	return nil, nil
}

// Test helper functions
func createTestEventService() (*EventService, *MockEventRepository) {
	mockRepo := &MockEventRepository{}
	service := NewEventService(mockRepo).(*EventService)
	return service, mockRepo
}

func createTestEvent() *models.Event {
	now := time.Now()
	return &models.Event{
		ID:          1,
		Title:       "Test Event",
		Description: "Test Description",
		StartTime:   now.Add(1 * time.Hour),
		EndTime:     now.Add(2 * time.Hour),
		CreatedAt:   now,
		UpdatedAt:   now,
	}
}

// Test CreateEvent
func TestEventService_CreateEvent_Success(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	now := time.Now()
	req := CreateEventRequest{
		Title:       "Test Event",
		Description: "Test Description",
		StartTime:   now.Add(1 * time.Hour),
		EndTime:     now.Add(2 * time.Hour),
	}

	expectedEvent := &models.Event{
		ID:          1,
		Title:       req.Title,
		Description: req.Description,
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
	}

	// Mock no conflicts
	mockRepo.On("ListEvents", ctx, mock.AnythingOfType("database.EventFilters")).Return([]*models.Event{}, nil)
	mockRepo.On("CreateEvent", ctx, mock.AnythingOfType("*models.Event")).Return(expectedEvent, nil)

	result, err := service.CreateEvent(ctx, req)

	assert.NoError(t, err)
	assert.Equal(t, expectedEvent.Title, result.Title)
	assert.Equal(t, expectedEvent.Description, result.Description)
	mockRepo.AssertExpectations(t)
}

func TestEventService_CreateEvent_ValidationErrors(t *testing.T) {
	service, _ := createTestEventService()
	ctx := context.Background()

	now := time.Now()

	tests := []struct {
		name        string
		req         CreateEventRequest
		expectedErr error
	}{
		{
			name: "empty title",
			req: CreateEventRequest{
				Title:     "",
				StartTime: now.Add(1 * time.Hour),
				EndTime:   now.Add(2 * time.Hour),
			},
			expectedErr: ErrEventTitleRequired,
		},
		{
			name: "title too long",
			req: CreateEventRequest{
				Title:     string(make([]byte, 256)),
				StartTime: now.Add(1 * time.Hour),
				EndTime:   now.Add(2 * time.Hour),
			},
			expectedErr: ErrEventTitleTooLong,
		},
		{
			name: "description too long",
			req: CreateEventRequest{
				Title:       "Valid Title",
				Description: string(make([]byte, 1001)),
				StartTime:   now.Add(1 * time.Hour),
				EndTime:     now.Add(2 * time.Hour),
			},
			expectedErr: ErrEventDescriptionTooLong,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := service.CreateEvent(ctx, tt.req)
			assert.Equal(t, tt.expectedErr, err)
		})
	}
}

func TestEventService_CreateEvent_TimeValidationErrors(t *testing.T) {
	service, _ := createTestEventService()
	ctx := context.Background()

	now := time.Now()

	tests := []struct {
		name        string
		req         CreateEventRequest
		expectedErr error
	}{
		{
			name: "end time before start time",
			req: CreateEventRequest{
				Title:     "Test Event",
				StartTime: now.Add(2 * time.Hour),
				EndTime:   now.Add(1 * time.Hour),
			},
			expectedErr: ErrInvalidTimeRange,
		},
		{
			name: "event in past",
			req: CreateEventRequest{
				Title:     "Test Event",
				StartTime: now.Add(-2 * time.Hour),
				EndTime:   now.Add(-1 * time.Hour),
			},
			expectedErr: ErrEventInPast,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := service.CreateEvent(ctx, tt.req)
			assert.Equal(t, tt.expectedErr, err)
		})
	}
}

func TestEventService_CreateEvent_EventTooLong(t *testing.T) {
	service, _ := createTestEventService()
	ctx := context.Background()

	now := time.Now()
	req := CreateEventRequest{
		Title:     "Test Event",
		StartTime: now.Add(1 * time.Hour),
		EndTime:   now.Add(1 * time.Hour).Add(25 * time.Hour), // 25 hours duration
	}

	_, err := service.CreateEvent(ctx, req)

	assert.Equal(t, ErrEventTooLong, err)
}

func TestEventService_CreateEvent_TimeConflict(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	now := time.Now()
	req := CreateEventRequest{
		Title:     "Test Event",
		StartTime: now.Add(1 * time.Hour),
		EndTime:   now.Add(2 * time.Hour),
	}

	conflictingEvent := &models.Event{
		ID:        2,
		Title:     "Conflicting Event",
		StartTime: now.Add(30 * time.Minute),
		EndTime:   now.Add(90 * time.Minute),
	}

	mockRepo.On("ListEvents", ctx, mock.AnythingOfType("database.EventFilters")).Return([]*models.Event{conflictingEvent}, nil)

	_, err := service.CreateEvent(ctx, req)

	assert.Equal(t, ErrTimeConflict, err)
	mockRepo.AssertExpectations(t)
}

// Test GetEventByID
func TestEventService_GetEventByID_Success(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	expectedEvent := createTestEvent()
	mockRepo.On("GetEventByID", ctx, 1).Return(expectedEvent, nil)

	result, err := service.GetEventByID(ctx, 1)

	assert.NoError(t, err)
	assert.Equal(t, expectedEvent, result)
	mockRepo.AssertExpectations(t)
}

func TestEventService_GetEventByID_InvalidID(t *testing.T) {
	service, _ := createTestEventService()
	ctx := context.Background()

	_, err := service.GetEventByID(ctx, 0)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "invalid event ID")
}

func TestEventService_GetEventByID_NotFound(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	mockRepo.On("GetEventByID", ctx, 999).Return(nil, sql.ErrNoRows)

	_, err := service.GetEventByID(ctx, 999)

	assert.Error(t, err)
	mockRepo.AssertExpectations(t)
}

// Test UpdateEvent
func TestEventService_UpdateEvent_Success(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	existingEvent := createTestEvent()
	now := time.Now()
	
	startTime := now.Add(3 * time.Hour)
	endTime := now.Add(4 * time.Hour)
	req := UpdateEventRequest{
		Title:     stringPtr("Updated Event"),
		StartTime: &startTime,
		EndTime:   &endTime,
	}

	mockRepo.On("GetEventByID", ctx, 1).Return(existingEvent, nil)
	mockRepo.On("ListEvents", ctx, mock.AnythingOfType("database.EventFilters")).Return([]*models.Event{}, nil)
	mockRepo.On("UpdateEvent", ctx, mock.AnythingOfType("*models.Event")).Return(nil)

	result, err := service.UpdateEvent(ctx, 1, req)

	assert.NoError(t, err)
	assert.Equal(t, "Updated Event", result.Title)
	mockRepo.AssertExpectations(t)
}

func TestEventService_UpdateEvent_TimeConflict(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	existingEvent := createTestEvent()
	now := time.Now()
	
	startTime := now.Add(1 * time.Hour)
	endTime := now.Add(2 * time.Hour)
	req := UpdateEventRequest{
		StartTime: &startTime,
		EndTime:   &endTime,
	}

	conflictingEvent := &models.Event{
		ID:        2,
		Title:     "Conflicting Event",
		StartTime: now.Add(30 * time.Minute),
		EndTime:   now.Add(90 * time.Minute),
	}

	mockRepo.On("GetEventByID", ctx, 1).Return(existingEvent, nil)
	mockRepo.On("ListEvents", ctx, mock.AnythingOfType("database.EventFilters")).Return([]*models.Event{conflictingEvent}, nil)

	_, err := service.UpdateEvent(ctx, 1, req)

	assert.Equal(t, ErrTimeConflict, err)
	mockRepo.AssertExpectations(t)
}

// Test DeleteEvent
func TestEventService_DeleteEvent_Success(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	existingEvent := createTestEvent()
	mockRepo.On("GetEventByID", ctx, 1).Return(existingEvent, nil)
	mockRepo.On("DeleteEvent", ctx, 1).Return(nil)

	err := service.DeleteEvent(ctx, 1)

	assert.NoError(t, err)
	mockRepo.AssertExpectations(t)
}

func TestEventService_DeleteEvent_NotFound(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	mockRepo.On("GetEventByID", ctx, 999).Return(nil, sql.ErrNoRows)

	err := service.DeleteEvent(ctx, 999)

	assert.Error(t, err)
	mockRepo.AssertExpectations(t)
}

// Test GetEventsByDateRange
func TestEventService_GetEventsByDateRange_Success(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	startDate := time.Now()
	endDate := startDate.AddDate(0, 0, 7)
	expectedEvents := []*models.Event{createTestEvent()}

	mockRepo.On("GetEventsByDateRange", ctx, startDate, endDate).Return(expectedEvents, nil)

	result, err := service.GetEventsByDateRange(ctx, startDate, endDate)

	assert.NoError(t, err)
	assert.Equal(t, expectedEvents, result)
	mockRepo.AssertExpectations(t)
}

func TestEventService_GetEventsByDateRange_InvalidRange(t *testing.T) {
	service, _ := createTestEventService()
	ctx := context.Background()

	startDate := time.Now()
	endDate := startDate.AddDate(0, 0, -1)

	_, err := service.GetEventsByDateRange(ctx, startDate, endDate)

	assert.Error(t, err)
	assert.Contains(t, err.Error(), "end date must be after start date")
}

// Test GetEventsByMonth
func TestEventService_GetEventsByMonth_Success(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	expectedEvents := []*models.Event{createTestEvent()}
	mockRepo.On("GetEventsByMonth", ctx, 2024, time.January).Return(expectedEvents, nil)

	result, err := service.GetEventsByMonth(ctx, 2024, time.January)

	assert.NoError(t, err)
	assert.Equal(t, expectedEvents, result)
	mockRepo.AssertExpectations(t)
}

func TestEventService_GetEventsByMonth_InvalidInputs(t *testing.T) {
	service, _ := createTestEventService()
	ctx := context.Background()

	tests := []struct {
		name  string
		year  int
		month time.Month
	}{
		{"invalid year low", 1800, time.January},
		{"invalid year high", 2200, time.January},
		{"invalid month low", 2024, 0},
		{"invalid month high", 2024, 13},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			_, err := service.GetEventsByMonth(ctx, tt.year, tt.month)
			assert.Error(t, err)
		})
	}
}

// Test GetEventsByDay
func TestEventService_GetEventsByDay_Success(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	date := time.Now()
	expectedEvents := []*models.Event{createTestEvent()}

	mockRepo.On("GetEventsByDay", ctx, date).Return(expectedEvents, nil)

	result, err := service.GetEventsByDay(ctx, date)

	assert.NoError(t, err)
	assert.Equal(t, expectedEvents, result)
	mockRepo.AssertExpectations(t)
}

// Test GetUpcomingEvents
func TestEventService_GetUpcomingEvents_Success(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	expectedEvents := []*models.Event{createTestEvent()}
	mockRepo.On("GetUpcomingEvents", ctx, 10).Return(expectedEvents, nil)

	result, err := service.GetUpcomingEvents(ctx, 10)

	assert.NoError(t, err)
	assert.Equal(t, expectedEvents, result)
	mockRepo.AssertExpectations(t)
}

func TestEventService_GetUpcomingEvents_DefaultLimit(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	expectedEvents := []*models.Event{createTestEvent()}
	mockRepo.On("GetUpcomingEvents", ctx, 10).Return(expectedEvents, nil)

	result, err := service.GetUpcomingEvents(ctx, 0)

	assert.NoError(t, err)
	assert.Equal(t, expectedEvents, result)
	mockRepo.AssertExpectations(t)
}

func TestEventService_GetUpcomingEvents_MaxLimit(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	expectedEvents := []*models.Event{createTestEvent()}
	mockRepo.On("GetUpcomingEvents", ctx, 100).Return(expectedEvents, nil)

	result, err := service.GetUpcomingEvents(ctx, 150)

	assert.NoError(t, err)
	assert.Equal(t, expectedEvents, result)
	mockRepo.AssertExpectations(t)
}

// Test CheckTimeConflicts
func TestEventService_CheckTimeConflicts_NoConflicts(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	now := time.Now()
	startTime := now.Add(1 * time.Hour)
	endTime := now.Add(2 * time.Hour)

	mockRepo.On("ListEvents", ctx, mock.AnythingOfType("database.EventFilters")).Return([]*models.Event{}, nil)

	conflicts, err := service.CheckTimeConflicts(ctx, startTime, endTime, nil)

	assert.NoError(t, err)
	assert.Empty(t, conflicts)
	mockRepo.AssertExpectations(t)
}

func TestEventService_CheckTimeConflicts_WithConflicts(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	now := time.Now()
	startTime := now.Add(1 * time.Hour)
	endTime := now.Add(2 * time.Hour)

	conflictingEvent := &models.Event{
		ID:        1,
		StartTime: now.Add(30 * time.Minute),
		EndTime:   now.Add(90 * time.Minute),
	}

	mockRepo.On("ListEvents", ctx, mock.AnythingOfType("database.EventFilters")).Return([]*models.Event{conflictingEvent}, nil)

	conflicts, err := service.CheckTimeConflicts(ctx, startTime, endTime, nil)

	assert.NoError(t, err)
	assert.Len(t, conflicts, 1)
	assert.Equal(t, conflictingEvent, conflicts[0])
	mockRepo.AssertExpectations(t)
}

func TestEventService_CheckTimeConflicts_ExcludeEvent(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	now := time.Now()
	startTime := now.Add(1 * time.Hour)
	endTime := now.Add(2 * time.Hour)
	excludeID := 1

	eventToExclude := &models.Event{
		ID:        1,
		StartTime: now.Add(30 * time.Minute),
		EndTime:   now.Add(90 * time.Minute),
	}

	mockRepo.On("ListEvents", ctx, mock.AnythingOfType("database.EventFilters")).Return([]*models.Event{eventToExclude}, nil)

	conflicts, err := service.CheckTimeConflicts(ctx, startTime, endTime, &excludeID)

	assert.NoError(t, err)
	assert.Empty(t, conflicts)
	mockRepo.AssertExpectations(t)
}

// Test ValidateEventTimes
func TestEventService_ValidateEventTimes_Success(t *testing.T) {
	service, _ := createTestEventService()

	now := time.Now()
	startTime := now.Add(1 * time.Hour)
	endTime := now.Add(2 * time.Hour)

	err := service.ValidateEventTimes(startTime, endTime)

	assert.NoError(t, err)
}

func TestEventService_ValidateEventTimes_Errors(t *testing.T) {
	service, _ := createTestEventService()

	now := time.Now()

	tests := []struct {
		name        string
		startTime   time.Time
		endTime     time.Time
		expectedErr error
	}{
		{
			name:        "end before start",
			startTime:   now.Add(2 * time.Hour),
			endTime:     now.Add(1 * time.Hour),
			expectedErr: ErrInvalidTimeRange,
		},
		{
			name:        "event in past",
			startTime:   now.Add(-2 * time.Hour),
			endTime:     now.Add(-1 * time.Hour),
			expectedErr: ErrEventInPast,
		},
		{
			name:        "event too long",
			startTime:   now.Add(1 * time.Hour),
			endTime:     now.Add(1 * time.Hour).Add(25 * time.Hour), // 25 hours duration
			expectedErr: ErrEventTooLong,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := service.ValidateEventTimes(tt.startTime, tt.endTime)
			assert.Equal(t, tt.expectedErr, err)
		})
	}
}

// Test ListEvents
func TestEventService_ListEvents_Success(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	filters := EventListFilters{
		Page:     1,
		PageSize: 10,
	}

	expectedEvents := []*models.Event{createTestEvent()}
	expectedTotal := int64(1)

	mockRepo.On("ListEvents", ctx, mock.AnythingOfType("database.EventFilters")).Return(expectedEvents, nil)
	mockRepo.On("CountEvents", ctx, mock.AnythingOfType("database.EventFilters")).Return(expectedTotal, nil)

	events, total, err := service.ListEvents(ctx, filters)

	assert.NoError(t, err)
	assert.Equal(t, expectedEvents, events)
	assert.Equal(t, expectedTotal, total)
	mockRepo.AssertExpectations(t)
}

func TestEventService_ListEvents_DefaultPagination(t *testing.T) {
	service, mockRepo := createTestEventService()
	ctx := context.Background()

	filters := EventListFilters{} // No pagination specified

	expectedEvents := []*models.Event{createTestEvent()}
	expectedTotal := int64(1)

	mockRepo.On("ListEvents", ctx, mock.MatchedBy(func(f database.EventFilters) bool {
		return f.Limit == 20 && f.Offset == 0
	})).Return(expectedEvents, nil)
	mockRepo.On("CountEvents", ctx, mock.AnythingOfType("database.EventFilters")).Return(expectedTotal, nil)

	events, total, err := service.ListEvents(ctx, filters)

	assert.NoError(t, err)
	assert.Equal(t, expectedEvents, events)
	assert.Equal(t, expectedTotal, total)
	mockRepo.AssertExpectations(t)
}

// Helper function
func stringPtr(s string) *string {
	return &s
}