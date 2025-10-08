package handlers

import (
	"bytes"
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"agenda/internal/database"
	"agenda/internal/models"
	"agenda/internal/services"
	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	_ "github.com/mattn/go-sqlite3"
)

func setupEventTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("sqlite3", ":memory:")
	require.NoError(t, err)

	// Create events table
	schema := `
	CREATE TABLE events (
		id INTEGER PRIMARY KEY AUTOINCREMENT,
		title TEXT NOT NULL,
		description TEXT,
		start_time DATETIME NOT NULL,
		end_time DATETIME NOT NULL,
		created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
		updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
	);

	CREATE INDEX idx_events_start_time ON events(start_time);
	CREATE INDEX idx_events_date_range ON events(start_time, end_time);
	`
	_, err = db.Exec(schema)
	require.NoError(t, err)

	return db
}

func setupEventTestHandler(t *testing.T) (*EventHandler, *sql.DB) {
	db := setupEventTestDB(t)
	eventRepo := database.NewEventRepository(db)
	eventService := services.NewEventService(eventRepo)
	handler := NewEventHandler(eventService)
	return handler, db
}

func setupEventTestRouter(handler *EventHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	
	api := router.Group("/api")
	events := api.Group("/events")
	{
		events.GET("", handler.ListEvents)
		events.POST("", handler.CreateEvent)
		events.GET("/upcoming", handler.GetUpcomingEvents)
		events.GET("/:id", handler.GetEvent)
		events.PUT("/:id", handler.UpdateEvent)
		events.DELETE("/:id", handler.DeleteEvent)
	}
	
	return router
}

func TestCreateEvent(t *testing.T) {
	handler, db := setupEventTestHandler(t)
	defer db.Close()
	router := setupEventTestRouter(handler)

	now := time.Now()
	startTime := now.Add(1 * time.Hour)
	endTime := startTime.Add(2 * time.Hour)

	tests := []struct {
		name           string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name: "valid event creation",
			requestBody: CreateEventRequest{
				Title:       "Test Event",
				Description: "Test Description",
				StartTime:   startTime,
				EndTime:     endTime,
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name: "event without description",
			requestBody: CreateEventRequest{
				Title:     "Event No Description",
				StartTime: startTime.Add(3 * time.Hour),
				EndTime:   startTime.Add(4 * time.Hour),
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name: "missing title",
			requestBody: CreateEventRequest{
				Description: "Test Description",
				StartTime:   startTime,
				EndTime:     endTime,
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "missing start time",
			requestBody: map[string]interface{}{
				"title":    "Test Event",
				"end_time": endTime,
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "missing end time",
			requestBody: map[string]interface{}{
				"title":      "Test Event",
				"start_time": startTime,
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "invalid time range - end before start",
			requestBody: CreateEventRequest{
				Title:     "Invalid Time Range",
				StartTime: endTime,
				EndTime:   startTime,
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name: "event in the past",
			requestBody: CreateEventRequest{
				Title:     "Past Event",
				StartTime: now.Add(-2 * time.Hour),
				EndTime:   now.Add(-1 * time.Hour),
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "VALIDATION_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest(http.MethodPost, "/api/events", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var errorResp ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &errorResp)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedError, errorResp.Error.Code)
			} else {
				var event models.Event
				err := json.Unmarshal(w.Body.Bytes(), &event)
				require.NoError(t, err)
				assert.NotZero(t, event.ID)
				assert.NotZero(t, event.CreatedAt)
				assert.NotZero(t, event.UpdatedAt)
			}
		})
	}
}

func TestGetEvent(t *testing.T) {
	handler, db := setupEventTestHandler(t)
	defer db.Close()
	router := setupEventTestRouter(handler)

	// Create a test event
	event := createTestEvent(t, handler)

	tests := []struct {
		name           string
		eventID        string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "valid event retrieval",
			eventID:        fmt.Sprintf("%d", event.ID),
			expectedStatus: http.StatusOK,
		},
		{
			name:           "non-existent event",
			eventID:        "999",
			expectedStatus: http.StatusNotFound,
			expectedError:  "EVENT_NOT_FOUND",
		},
		{
			name:           "invalid event ID",
			eventID:        "invalid",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "INVALID_ID",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/events/"+tt.eventID, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var errorResp ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &errorResp)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedError, errorResp.Error.Code)
			} else {
				var retrievedEvent models.Event
				err := json.Unmarshal(w.Body.Bytes(), &retrievedEvent)
				require.NoError(t, err)
				assert.Equal(t, event.ID, retrievedEvent.ID)
				assert.Equal(t, event.Title, retrievedEvent.Title)
			}
		})
	}
}

func TestUpdateEvent(t *testing.T) {
	handler, db := setupEventTestHandler(t)
	defer db.Close()
	router := setupEventTestRouter(handler)

	// Create a test event
	event := createTestEvent(t, handler)
	
	now := time.Now()
	newStartTime := now.Add(5 * time.Hour)
	newEndTime := newStartTime.Add(2 * time.Hour)

	tests := []struct {
		name           string
		eventID        string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name:    "valid event update",
			eventID: fmt.Sprintf("%d", event.ID),
			requestBody: UpdateEventRequest{
				Title:       stringPtr("Updated Event"),
				Description: stringPtr("Updated Description"),
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:    "update event times",
			eventID: fmt.Sprintf("%d", event.ID),
			requestBody: UpdateEventRequest{
				StartTime: &newStartTime,
				EndTime:   &newEndTime,
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "non-existent event",
			eventID:        "999",
			requestBody:    UpdateEventRequest{Title: stringPtr("Updated")},
			expectedStatus: http.StatusNotFound,
			expectedError:  "EVENT_NOT_FOUND",
		},
		{
			name:           "invalid event ID",
			eventID:        "invalid",
			requestBody:    UpdateEventRequest{Title: stringPtr("Updated")},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "INVALID_ID",
		},
		{
			name:    "invalid time range update",
			eventID: fmt.Sprintf("%d", event.ID),
			requestBody: UpdateEventRequest{
				StartTime: &newEndTime,
				EndTime:   &newStartTime,
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "VALIDATION_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest(http.MethodPut, "/api/events/"+tt.eventID, bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var errorResp ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &errorResp)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedError, errorResp.Error.Code)
			} else {
				var updatedEvent models.Event
				err := json.Unmarshal(w.Body.Bytes(), &updatedEvent)
				require.NoError(t, err)
				assert.Equal(t, event.ID, updatedEvent.ID)
			}
		})
	}
}

func TestDeleteEvent(t *testing.T) {
	handler, db := setupEventTestHandler(t)
	defer db.Close()
	router := setupEventTestRouter(handler)

	tests := []struct {
		name           string
		setupEvent     bool
		eventID        string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "valid event deletion",
			setupEvent:     true,
			expectedStatus: http.StatusNoContent,
		},
		{
			name:           "non-existent event",
			setupEvent:     false,
			eventID:        "999",
			expectedStatus: http.StatusNotFound,
			expectedError:  "EVENT_NOT_FOUND",
		},
		{
			name:           "invalid event ID",
			setupEvent:     false,
			eventID:        "invalid",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "INVALID_ID",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var eventID string
			if tt.setupEvent {
				event := createTestEvent(t, handler)
				eventID = fmt.Sprintf("%d", event.ID)
			} else {
				eventID = tt.eventID
			}

			req := httptest.NewRequest(http.MethodDelete, "/api/events/"+eventID, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var errorResp ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &errorResp)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedError, errorResp.Error.Code)
			}
		})
	}
}

func TestListEvents(t *testing.T) {
	handler, db := setupEventTestHandler(t)
	defer db.Close()
	router := setupEventTestRouter(handler)

	// Create test events with different times to avoid conflicts
	now := time.Now()
	createTestEventWithTime(t, handler, now.Add(1*time.Hour), now.Add(2*time.Hour))
	createTestEventWithTime(t, handler, now.Add(3*time.Hour), now.Add(4*time.Hour))

	tests := []struct {
		name           string
		queryParams    string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "list all events",
			queryParams:    "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "list with pagination",
			queryParams:    "?page=1&page_size=10",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "filter by title",
			queryParams:    "?title=Test",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "search events",
			queryParams:    "?search=Event",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "filter by date range",
			queryParams:    fmt.Sprintf("?start_after=%s&start_before=%s", 
				now.Add(30*time.Minute).UTC().Format(time.RFC3339), 
				now.Add(5*time.Hour).UTC().Format(time.RFC3339)),
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid date format",
			queryParams:    "?start_after=invalid-date",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "INVALID_DATE",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/events"+tt.queryParams, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var errorResp ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &errorResp)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedError, errorResp.Error.Code)
			} else {
				var response PaginatedResponse
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				assert.NotNil(t, response.Data)
				assert.GreaterOrEqual(t, response.Total, int64(0))
			}
		})
	}
}

func TestListEventsByMonth(t *testing.T) {
	handler, db := setupEventTestHandler(t)
	defer db.Close()
	router := setupEventTestRouter(handler)

	// Create test events for current month
	now := time.Now()
	createTestEventWithTime(t, handler, now.Add(1*time.Hour), now.Add(3*time.Hour))

	tests := []struct {
		name           string
		queryParams    string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "valid month query",
			queryParams:    fmt.Sprintf("?year=%d&month=%d", now.Year(), int(now.Month())),
			expectedStatus: http.StatusOK,
		},
		{
			name:           "different month",
			queryParams:    fmt.Sprintf("?year=%d&month=%d", now.Year(), int(now.Month())+1),
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid month",
			queryParams:    "?year=2023&month=13",
			expectedStatus: http.StatusInternalServerError, // Service layer validation
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/events"+tt.queryParams, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var errorResp ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &errorResp)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedError, errorResp.Error.Code)
			} else if w.Code == http.StatusOK {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				assert.Contains(t, response, "events")
				assert.Contains(t, response, "year")
				assert.Contains(t, response, "month")
				assert.Contains(t, response, "total")
			}
		})
	}
}

func TestListEventsByDay(t *testing.T) {
	handler, db := setupEventTestHandler(t)
	defer db.Close()
	router := setupEventTestRouter(handler)

	// Create test event for today
	now := time.Now()
	today := time.Date(now.Year(), now.Month(), now.Day(), 10, 0, 0, 0, now.Location())
	createTestEventWithTime(t, handler, today, today.Add(2*time.Hour))

	tests := []struct {
		name           string
		queryParams    string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "valid day query",
			queryParams:    fmt.Sprintf("?day=%s", today.Format("2006-01-02")),
			expectedStatus: http.StatusOK,
		},
		{
			name:           "different day",
			queryParams:    fmt.Sprintf("?day=%s", today.AddDate(0, 0, 1).Format("2006-01-02")),
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid day format",
			queryParams:    "?day=invalid-date",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "INVALID_DATE",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/events"+tt.queryParams, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var errorResp ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &errorResp)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedError, errorResp.Error.Code)
			} else {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				assert.Contains(t, response, "events")
				assert.Contains(t, response, "date")
				assert.Contains(t, response, "total")
			}
		})
	}
}

func TestGetUpcomingEvents(t *testing.T) {
	handler, db := setupEventTestHandler(t)
	defer db.Close()
	router := setupEventTestRouter(handler)

	// Create upcoming test events
	now := time.Now()
	createTestEventWithTime(t, handler, now.Add(1*time.Hour), now.Add(2*time.Hour))
	createTestEventWithTime(t, handler, now.Add(3*time.Hour), now.Add(4*time.Hour))

	tests := []struct {
		name           string
		queryParams    string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "get upcoming events default limit",
			queryParams:    "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "get upcoming events with limit",
			queryParams:    "?limit=5",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "get upcoming events with max limit",
			queryParams:    "?limit=150", // Should be capped at 100
			expectedStatus: http.StatusOK,
		},
		{
			name:           "invalid limit",
			queryParams:    "?limit=invalid",
			expectedStatus: http.StatusOK, // Should default to 10
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/events/upcoming"+tt.queryParams, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var errorResp ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &errorResp)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedError, errorResp.Error.Code)
			} else {
				var response map[string]interface{}
				err := json.Unmarshal(w.Body.Bytes(), &response)
				require.NoError(t, err)
				assert.Contains(t, response, "events")
				assert.Contains(t, response, "limit")
				assert.Contains(t, response, "total")
			}
		})
	}
}

func TestEventTimeConflicts(t *testing.T) {
	handler, db := setupEventTestHandler(t)
	defer db.Close()
	router := setupEventTestRouter(handler)

	// Create an existing event
	now := time.Now()
	startTime := now.Add(3 * time.Hour)  // Start further in the future
	endTime := startTime.Add(2 * time.Hour)
	createTestEventWithTime(t, handler, startTime, endTime)

	tests := []struct {
		name           string
		requestBody    CreateEventRequest
		expectedStatus int
		expectedError  string
	}{
		{
			name: "overlapping event - same time",
			requestBody: CreateEventRequest{
				Title:     "Conflicting Event",
				StartTime: startTime,
				EndTime:   endTime,
			},
			expectedStatus: http.StatusConflict,
			expectedError:  "TIME_CONFLICT",
		},
		{
			name: "overlapping event - partial overlap",
			requestBody: CreateEventRequest{
				Title:     "Partially Overlapping Event",
				StartTime: startTime.Add(30 * time.Minute),
				EndTime:   endTime.Add(30 * time.Minute),
			},
			expectedStatus: http.StatusConflict,
			expectedError:  "TIME_CONFLICT",
		},
		{
			name: "non-overlapping event - before",
			requestBody: CreateEventRequest{
				Title:     "Before Event",
				StartTime: now.Add(1 * time.Hour),  // 1 hour from now
				EndTime:   startTime.Add(-30 * time.Minute), // 30 minutes before existing event
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name: "non-overlapping event - after",
			requestBody: CreateEventRequest{
				Title:     "After Event",
				StartTime: endTime.Add(1 * time.Hour),
				EndTime:   endTime.Add(3 * time.Hour),
			},
			expectedStatus: http.StatusCreated,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest(http.MethodPost, "/api/events", bytes.NewBuffer(body))
			req.Header.Set("Content-Type", "application/json")
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var errorResp ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &errorResp)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedError, errorResp.Error.Code)
			}
		})
	}
}

// Helper functions

func createTestEvent(t *testing.T, handler *EventHandler) *models.Event {
	now := time.Now()
	startTime := now.Add(1 * time.Hour)
	endTime := startTime.Add(2 * time.Hour)
	return createTestEventWithTime(t, handler, startTime, endTime)
}

func createTestEventWithTime(t *testing.T, handler *EventHandler, startTime, endTime time.Time) *models.Event {
	req := services.CreateEventRequest{
		Title:       "Test Event",
		Description: "Test Description",
		StartTime:   startTime,
		EndTime:     endTime,
	}
	event, err := handler.eventService.CreateEvent(context.Background(), req)
	require.NoError(t, err)
	return event
}