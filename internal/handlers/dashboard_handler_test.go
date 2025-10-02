package handlers

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"
	"time"

	"agenda/internal/models"
	"agenda/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// MockDashboardService is a mock implementation of DashboardServiceInterface
type MockDashboardService struct {
	mock.Mock
}

func (m *MockDashboardService) GetDashboardData(ctx context.Context, filters services.DashboardFilters) (*services.DashboardData, error) {
	args := m.Called(ctx, filters)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*services.DashboardData), args.Error(1)
}

func (m *MockDashboardService) GetUpcomingItems(ctx context.Context, days int, limit int) (*services.UpcomingItems, error) {
	args := m.Called(ctx, days, limit)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*services.UpcomingItems), args.Error(1)
}

func (m *MockDashboardService) GetDashboardStats(ctx context.Context) (*services.DashboardStats, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*services.DashboardStats), args.Error(1)
}

func (m *MockDashboardService) GetCombinedCalendarView(ctx context.Context, year int, month time.Month) (*services.CalendarViewData, error) {
	args := m.Called(ctx, year, month)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*services.CalendarViewData), args.Error(1)
}

func (m *MockDashboardService) GetItemsByDateRange(ctx context.Context, startDate, endDate time.Time) (*services.DateRangeData, error) {
	args := m.Called(ctx, startDate, endDate)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*services.DateRangeData), args.Error(1)
}

func (m *MockDashboardService) GetCombinedCalendarItems(ctx context.Context, startDate, endDate time.Time) ([]*services.CalendarItem, error) {
	args := m.Called(ctx, startDate, endDate)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*services.CalendarItem), args.Error(1)
}

func setupDashboardTestRouter() (*gin.Engine, *MockDashboardService) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	
	mockService := &MockDashboardService{}
	handler := NewDashboardHandler(mockService)
	
	api := router.Group("/api")
	dashboard := api.Group("/dashboard")
	{
		dashboard.GET("", handler.GetDashboard)
		dashboard.GET("/stats", handler.GetDashboardStats)
		dashboard.GET("/upcoming", handler.GetUpcomingItems)
		dashboard.GET("/calendar", handler.GetCalendarView)
		dashboard.GET("/daterange", handler.GetDateRange)
	}
	
	return router, mockService
}

func TestDashboardHandler_GetDashboard(t *testing.T) {
	router, mockService := setupDashboardTestRouter()

	t.Run("successful dashboard request", func(t *testing.T) {
		// Setup mock data
		now := time.Now()
		mockDashboardData := &services.DashboardData{
			UpcomingTasks: []*models.Task{
				{
					ID:          1,
					Title:       "Test Task",
					Description: "Test Description",
					DueDate:     &now,
					Status:      models.TaskStatusPending,
				},
			},
			UpcomingEvents: []*models.Event{
				{
					ID:          1,
					Title:       "Test Event",
					Description: "Test Description",
					StartTime:   now,
					EndTime:     now.Add(time.Hour),
				},
			},
			Stats: &services.DashboardStats{
				TotalTasks:     10,
				CompletedTasks: 5,
				PendingTasks:   5,
				TotalEvents:    3,
			},
		}

		mockService.On("GetDashboardData", mock.Anything, mock.AnythingOfType("services.DashboardFilters")).Return(mockDashboardData, nil)

		// Make request
		req, _ := http.NewRequest("GET", "/api/dashboard", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assertions
		assert.Equal(t, http.StatusOK, w.Code)
		
		var response services.DashboardData
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, 1, len(response.UpcomingTasks))
		assert.Equal(t, 1, len(response.UpcomingEvents))
		assert.Equal(t, "Test Task", response.UpcomingTasks[0].Title)
		assert.Equal(t, "Test Event", response.UpcomingEvents[0].Title)
		
		mockService.AssertExpectations(t)
	})

	t.Run("dashboard request with date filters", func(t *testing.T) {
		startDate := time.Now().Format(time.RFC3339)
		endDate := time.Now().AddDate(0, 0, 7).Format(time.RFC3339)
		
		mockDashboardData := &services.DashboardData{
			UpcomingTasks:  []*models.Task{},
			UpcomingEvents: []*models.Event{},
			Stats: &services.DashboardStats{
				TotalTasks: 0,
			},
		}

		mockService.On("GetDashboardData", mock.Anything, mock.MatchedBy(func(filters services.DashboardFilters) bool {
			return filters.StartDate != nil && filters.EndDate != nil
		})).Return(mockDashboardData, nil)

		// Make request with query parameters (URL encoded)
		reqURL := fmt.Sprintf("/api/dashboard?start_date=%s&end_date=%s", 
			url.QueryEscape(startDate), url.QueryEscape(endDate))
		req, _ := http.NewRequest("GET", reqURL, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		// Assertions
		assert.Equal(t, http.StatusOK, w.Code)
		mockService.AssertExpectations(t)
	})

	t.Run("invalid date format", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/dashboard?start_date=invalid-date", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		
		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "INVALID_DATE", response.Error.Code)
	})

	t.Run("service error", func(t *testing.T) {
		// Create a fresh mock service for this test
		freshRouter, freshMockService := setupDashboardTestRouter()
		
		freshMockService.On("GetDashboardData", mock.Anything, mock.AnythingOfType("services.DashboardFilters")).Return(nil, services.ErrInvalidDateRange)

		req, _ := http.NewRequest("GET", "/api/dashboard", nil)
		w := httptest.NewRecorder()
		freshRouter.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		
		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "INVALID_DATE_RANGE", response.Error.Code)
		
		freshMockService.AssertExpectations(t)
	})
}

func TestDashboardHandler_GetDashboardStats(t *testing.T) {
	router, mockService := setupDashboardTestRouter()

	t.Run("successful stats request", func(t *testing.T) {
		mockStats := &services.DashboardStats{
			TotalTasks:     20,
			CompletedTasks: 12,
			PendingTasks:   8,
			OverdueTasks:   2,
			TotalEvents:    5,
			TodayEvents:    1,
			UpcomingEvents: 4,
			CompletionRate: 60.0,
		}

		mockService.On("GetDashboardStats", mock.Anything).Return(mockStats, nil)

		req, _ := http.NewRequest("GET", "/api/dashboard/stats", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		
		var response services.DashboardStats
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, int64(20), response.TotalTasks)
		assert.Equal(t, int64(12), response.CompletedTasks)
		assert.Equal(t, 60.0, response.CompletionRate)
		
		mockService.AssertExpectations(t)
	})
}

func TestDashboardHandler_GetUpcomingItems(t *testing.T) {
	router, mockService := setupDashboardTestRouter()

	t.Run("successful upcoming items request", func(t *testing.T) {
		now := time.Now()
		mockUpcomingItems := &services.UpcomingItems{
			Tasks: []*models.Task{
				{
					ID:      1,
					Title:   "Upcoming Task",
					DueDate: &now,
					Status:  models.TaskStatusPending,
				},
			},
			Events: []*models.Event{
				{
					ID:        1,
					Title:     "Upcoming Event",
					StartTime: now,
					EndTime:   now.Add(time.Hour),
				},
			},
			Total: 2,
		}

		mockService.On("GetUpcomingItems", mock.Anything, 7, 20).Return(mockUpcomingItems, nil)

		req, _ := http.NewRequest("GET", "/api/dashboard/upcoming", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		
		var response services.UpcomingItems
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, 2, response.Total)
		assert.Equal(t, 1, len(response.Tasks))
		assert.Equal(t, 1, len(response.Events))
		
		mockService.AssertExpectations(t)
	})

	t.Run("upcoming items with custom parameters", func(t *testing.T) {
		mockUpcomingItems := &services.UpcomingItems{
			Tasks:  []*models.Task{},
			Events: []*models.Event{},
			Total:  0,
		}

		mockService.On("GetUpcomingItems", mock.Anything, 14, 50).Return(mockUpcomingItems, nil)

		req, _ := http.NewRequest("GET", "/api/dashboard/upcoming?days=14&limit=50", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		mockService.AssertExpectations(t)
	})
}

func TestDashboardHandler_GetCalendarView(t *testing.T) {
	router, mockService := setupDashboardTestRouter()

	t.Run("successful calendar view request", func(t *testing.T) {
		now := time.Now()
		mockCalendarData := &services.CalendarViewData{
			Tasks: []*models.Task{
				{
					ID:      1,
					Title:   "Task with due date",
					DueDate: &now,
					Status:  models.TaskStatusPending,
				},
			},
			Events: []*models.Event{
				{
					ID:        1,
					Title:     "Calendar Event",
					StartTime: now,
					EndTime:   now.Add(time.Hour),
				},
			},
			Year:  2024,
			Month: time.January,
		}

		mockService.On("GetCombinedCalendarView", mock.Anything, 2024, time.January).Return(mockCalendarData, nil)

		req, _ := http.NewRequest("GET", "/api/dashboard/calendar?year=2024&month=1", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		
		var response services.CalendarViewData
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, 2024, response.Year)
		assert.Equal(t, time.January, response.Month)
		assert.Equal(t, 1, len(response.Tasks))
		assert.Equal(t, 1, len(response.Events))
		
		mockService.AssertExpectations(t)
	})

	t.Run("invalid year", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/dashboard/calendar?year=1800&month=1", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		
		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "INVALID_YEAR", response.Error.Code)
	})

	t.Run("invalid month", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/dashboard/calendar?year=2024&month=13", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		
		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "INVALID_MONTH", response.Error.Code)
	})
}

func TestDashboardHandler_GetDateRange(t *testing.T) {
	router, mockService := setupDashboardTestRouter()

	t.Run("successful date range request", func(t *testing.T) {
		startDate := time.Now()
		endDate := startDate.AddDate(0, 0, 7)
		
		mockDateRangeData := &services.DateRangeData{
			Tasks: []*models.Task{
				{
					ID:      1,
					Title:   "Task in range",
					DueDate: &startDate,
					Status:  models.TaskStatusPending,
				},
			},
			Events: []*models.Event{
				{
					ID:        1,
					Title:     "Event in range",
					StartTime: startDate,
					EndTime:   startDate.Add(time.Hour),
				},
			},
			StartDate: startDate,
			EndDate:   endDate,
			Total:     2,
		}

		mockService.On("GetItemsByDateRange", mock.Anything, mock.AnythingOfType("time.Time"), mock.AnythingOfType("time.Time")).Return(mockDateRangeData, nil)

		reqURL := fmt.Sprintf("/api/dashboard/daterange?start_date=%s&end_date=%s", 
			url.QueryEscape(startDate.Format(time.RFC3339)), url.QueryEscape(endDate.Format(time.RFC3339)))
		req, _ := http.NewRequest("GET", reqURL, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		
		var response services.DateRangeData
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, 2, response.Total)
		assert.Equal(t, 1, len(response.Tasks))
		assert.Equal(t, 1, len(response.Events))
		
		mockService.AssertExpectations(t)
	})

	t.Run("calendar format request", func(t *testing.T) {
		startDate := time.Now()
		endDate := startDate.AddDate(0, 0, 7)
		
		mockCalendarItems := []*services.CalendarItem{
			{
				ID:    1,
				Title: "Task Item",
				Date:  startDate,
				Type:  "task",
			},
			{
				ID:    2,
				Title: "Event Item",
				Date:  startDate,
				Type:  "event",
			},
		}

		mockService.On("GetCombinedCalendarItems", mock.Anything, mock.AnythingOfType("time.Time"), mock.AnythingOfType("time.Time")).Return(mockCalendarItems, nil)

		reqURL := fmt.Sprintf("/api/dashboard/daterange?start_date=%s&end_date=%s&format=calendar", 
			url.QueryEscape(startDate.Format(time.RFC3339)), url.QueryEscape(endDate.Format(time.RFC3339)))
		req, _ := http.NewRequest("GET", reqURL, nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusOK, w.Code)
		
		var response map[string]interface{}
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "calendar", response["format"])
		assert.Equal(t, float64(2), response["total"])
		
		mockService.AssertExpectations(t)
	})

	t.Run("missing required parameters", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/dashboard/daterange?start_date=2024-01-01T00:00:00Z", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		
		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "VALIDATION_ERROR", response.Error.Code)
	})

	t.Run("invalid date format", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/dashboard/daterange?start_date=invalid&end_date=2024-01-07T00:00:00Z", nil)
		w := httptest.NewRecorder()
		router.ServeHTTP(w, req)

		assert.Equal(t, http.StatusBadRequest, w.Code)
		
		var response ErrorResponse
		err := json.Unmarshal(w.Body.Bytes(), &response)
		assert.NoError(t, err)
		assert.Equal(t, "INVALID_DATE", response.Error.Code)
	})
}

