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

func setupTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("sqlite3", ":memory:")
	require.NoError(t, err)

	// Create tables
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
	`
	_, err = db.Exec(schema)
	require.NoError(t, err)

	return db
}

func setupTestHandler(t *testing.T) (*TaskHandler, *sql.DB) {
	db := setupTestDB(t)
	taskRepo := database.NewTaskRepository(db)
	taskService := services.NewTaskService(taskRepo)
	handler := NewTaskHandler(taskService)
	return handler, db
}

func setupTestRouter(handler *TaskHandler) *gin.Engine {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	
	api := router.Group("/api")
	tasks := api.Group("/tasks")
	{
		tasks.GET("", handler.ListTasks)
		tasks.POST("", handler.CreateTask)
		tasks.GET("/:id", handler.GetTask)
		tasks.PUT("/:id", handler.UpdateTask)
		tasks.DELETE("/:id", handler.DeleteTask)
		tasks.POST("/:id/complete", handler.CompleteTask)
		tasks.POST("/:id/reopen", handler.ReopenTask)
	}
	
	return router
}

func TestCreateTask(t *testing.T) {
	handler, db := setupTestHandler(t)
	defer db.Close()
	router := setupTestRouter(handler)

	tests := []struct {
		name           string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name: "valid task creation",
			requestBody: CreateTaskRequest{
				Title:       "Test Task",
				Description: "Test Description",
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name: "task with due date",
			requestBody: CreateTaskRequest{
				Title:       "Task with Due Date",
				Description: "Test Description",
				DueDate:     timePtr(time.Now().Add(24 * time.Hour)),
			},
			expectedStatus: http.StatusCreated,
		},
		{
			name: "missing title",
			requestBody: CreateTaskRequest{
				Description: "Test Description",
			},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "VALIDATION_ERROR",
		},
		{
			name:           "empty request body",
			requestBody:    map[string]interface{}{},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "VALIDATION_ERROR",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest(http.MethodPost, "/api/tasks", bytes.NewBuffer(body))
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
				var task models.Task
				err := json.Unmarshal(w.Body.Bytes(), &task)
				require.NoError(t, err)
				assert.NotZero(t, task.ID)
				assert.NotZero(t, task.CreatedAt)
				assert.NotZero(t, task.UpdatedAt)
			}
		})
	}
}

func TestGetTask(t *testing.T) {
	handler, db := setupTestHandler(t)
	defer db.Close()
	router := setupTestRouter(handler)

	// Create a test task
	task := createTestTask(t, handler)

	tests := []struct {
		name           string
		taskID         string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "valid task retrieval",
			taskID:         fmt.Sprintf("%d", task.ID),
			expectedStatus: http.StatusOK,
		},
		{
			name:           "non-existent task",
			taskID:         "999",
			expectedStatus: http.StatusNotFound,
			expectedError:  "TASK_NOT_FOUND",
		},
		{
			name:           "invalid task ID",
			taskID:         "invalid",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "INVALID_ID",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/tasks/"+tt.taskID, nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var errorResp ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &errorResp)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedError, errorResp.Error.Code)
			} else {
				var retrievedTask models.Task
				err := json.Unmarshal(w.Body.Bytes(), &retrievedTask)
				require.NoError(t, err)
				assert.Equal(t, task.ID, retrievedTask.ID)
				assert.Equal(t, task.Title, retrievedTask.Title)
			}
		})
	}
}

func TestUpdateTask(t *testing.T) {
	handler, db := setupTestHandler(t)
	defer db.Close()
	router := setupTestRouter(handler)

	// Create a test task
	task := createTestTask(t, handler)

	tests := []struct {
		name           string
		taskID         string
		requestBody    interface{}
		expectedStatus int
		expectedError  string
	}{
		{
			name:   "valid task update",
			taskID: fmt.Sprintf("%d", task.ID),
			requestBody: UpdateTaskRequest{
				Title:       stringPtr("Updated Task"),
				Description: stringPtr("Updated Description"),
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:   "update task status",
			taskID: fmt.Sprintf("%d", task.ID),
			requestBody: UpdateTaskRequest{
				Status: stringPtr("completed"),
			},
			expectedStatus: http.StatusOK,
		},
		{
			name:           "non-existent task",
			taskID:         "999",
			requestBody:    UpdateTaskRequest{Title: stringPtr("Updated")},
			expectedStatus: http.StatusNotFound,
			expectedError:  "TASK_NOT_FOUND",
		},
		{
			name:           "invalid task ID",
			taskID:         "invalid",
			requestBody:    UpdateTaskRequest{Title: stringPtr("Updated")},
			expectedStatus: http.StatusBadRequest,
			expectedError:  "INVALID_ID",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			body, _ := json.Marshal(tt.requestBody)
			req := httptest.NewRequest(http.MethodPut, "/api/tasks/"+tt.taskID, bytes.NewBuffer(body))
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
				var updatedTask models.Task
				err := json.Unmarshal(w.Body.Bytes(), &updatedTask)
				require.NoError(t, err)
				assert.Equal(t, task.ID, updatedTask.ID)
			}
		})
	}
}

func TestDeleteTask(t *testing.T) {
	handler, db := setupTestHandler(t)
	defer db.Close()
	router := setupTestRouter(handler)

	// Create a test task
	task := createTestTask(t, handler)

	tests := []struct {
		name           string
		taskID         string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "valid task deletion",
			taskID:         fmt.Sprintf("%d", task.ID),
			expectedStatus: http.StatusNoContent,
		},
		{
			name:           "non-existent task",
			taskID:         "999",
			expectedStatus: http.StatusNotFound,
			expectedError:  "TASK_NOT_FOUND",
		},
		{
			name:           "invalid task ID",
			taskID:         "invalid",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "INVALID_ID",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Create a new task for each test (except the first one)
			if tt.name != "valid task deletion" {
				task = createTestTask(t, handler)
				if tt.name == "valid task deletion" {
					tt.taskID = fmt.Sprintf("%d", task.ID)
				}
			}

			req := httptest.NewRequest(http.MethodDelete, "/api/tasks/"+tt.taskID, nil)
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

func TestListTasks(t *testing.T) {
	handler, db := setupTestHandler(t)
	defer db.Close()
	router := setupTestRouter(handler)

	// Create test tasks
	createTestTask(t, handler)
	createTestTask(t, handler)

	tests := []struct {
		name           string
		queryParams    string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "list all tasks",
			queryParams:    "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "list with pagination",
			queryParams:    "?page=1&page_size=10",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "filter by status",
			queryParams:    "?status=pending",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "search tasks",
			queryParams:    "?search=Test",
			expectedStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodGet, "/api/tasks"+tt.queryParams, nil)
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

func TestCompleteTask(t *testing.T) {
	handler, db := setupTestHandler(t)
	defer db.Close()
	router := setupTestRouter(handler)

	// Create a test task
	task := createTestTask(t, handler)

	tests := []struct {
		name           string
		taskID         string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "complete pending task",
			taskID:         fmt.Sprintf("%d", task.ID),
			expectedStatus: http.StatusOK,
		},
		{
			name:           "complete non-existent task",
			taskID:         "999",
			expectedStatus: http.StatusNotFound,
			expectedError:  "TASK_NOT_FOUND",
		},
		{
			name:           "invalid task ID",
			taskID:         "invalid",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "INVALID_ID",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/tasks/"+tt.taskID+"/complete", nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var errorResp ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &errorResp)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedError, errorResp.Error.Code)
			} else {
				var completedTask models.Task
				err := json.Unmarshal(w.Body.Bytes(), &completedTask)
				require.NoError(t, err)
				assert.Equal(t, models.TaskStatusCompleted, completedTask.Status)
			}
		})
	}
}

func TestReopenTask(t *testing.T) {
	handler, db := setupTestHandler(t)
	defer db.Close()
	router := setupTestRouter(handler)

	// Create and complete a test task
	task := createTestTask(t, handler)
	_, err := handler.taskService.CompleteTask(context.Background(), task.ID)
	require.NoError(t, err)

	tests := []struct {
		name           string
		taskID         string
		expectedStatus int
		expectedError  string
	}{
		{
			name:           "reopen completed task",
			taskID:         fmt.Sprintf("%d", task.ID),
			expectedStatus: http.StatusOK,
		},
		{
			name:           "reopen non-existent task",
			taskID:         "999",
			expectedStatus: http.StatusNotFound,
			expectedError:  "TASK_NOT_FOUND",
		},
		{
			name:           "invalid task ID",
			taskID:         "invalid",
			expectedStatus: http.StatusBadRequest,
			expectedError:  "INVALID_ID",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(http.MethodPost, "/api/tasks/"+tt.taskID+"/reopen", nil)
			w := httptest.NewRecorder()

			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectedError != "" {
				var errorResp ErrorResponse
				err := json.Unmarshal(w.Body.Bytes(), &errorResp)
				require.NoError(t, err)
				assert.Equal(t, tt.expectedError, errorResp.Error.Code)
			} else {
				var reopenedTask models.Task
				err := json.Unmarshal(w.Body.Bytes(), &reopenedTask)
				require.NoError(t, err)
				assert.Equal(t, models.TaskStatusPending, reopenedTask.Status)
			}
		})
	}
}

// Helper functions

func createTestTask(t *testing.T, handler *TaskHandler) *models.Task {
	req := services.CreateTaskRequest{
		Title:       "Test Task",
		Description: "Test Description",
	}
	task, err := handler.taskService.CreateTask(context.Background(), req)
	require.NoError(t, err)
	return task
}

func timePtr(t time.Time) *time.Time {
	return &t
}

func stringPtr(s string) *string {
	return &s
}