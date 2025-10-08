package server

import (
	"database/sql"
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"agenda/internal/database"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMain(m *testing.M) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)
	os.Exit(m.Run())
}

func setupTestDB(t *testing.T) *sql.DB {
	// Create in-memory SQLite database for testing
	db, err := sql.Open("sqlite3", ":memory:")
	require.NoError(t, err)

	// Initialize database schema manually for testing
	migrationService := database.NewMigrationService(db)
	err = migrationService.RunMigrations()
	require.NoError(t, err)

	return db
}

func TestServerRouting(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	server := NewServer(db)

	tests := []struct {
		name           string
		method         string
		path           string
		body           string
		contentType    string
		expectedStatus int
		checkHeaders   map[string]string
	}{
		{
			name:           "Health check endpoint",
			method:         "GET",
			path:           "/health",
			expectedStatus: http.StatusOK,
			checkHeaders: map[string]string{
				"X-Content-Type-Options": "nosniff",
				"X-Frame-Options":        "DENY",
			},
		},
		{
			name:           "List tasks endpoint",
			method:         "GET",
			path:           "/api/tasks",
			expectedStatus: http.StatusOK,
			checkHeaders: map[string]string{
				"X-API-Version": "v1",
			},
		},
		{
			name:           "Create task with valid JSON",
			method:         "POST",
			path:           "/api/tasks",
			body:           `{"title": "Test Task", "description": "Test Description"}`,
			contentType:    "application/json",
			expectedStatus: http.StatusCreated,
		},
		{
			name:           "Create task with invalid content-type",
			method:         "POST",
			path:           "/api/tasks",
			body:           `{"title": "Test Task"}`,
			contentType:    "text/plain",
			expectedStatus: http.StatusUnsupportedMediaType,
		},
		{
			name:           "List events endpoint",
			method:         "GET",
			path:           "/api/events",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Dashboard endpoint",
			method:         "GET",
			path:           "/api/dashboard",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Dashboard stats endpoint",
			method:         "GET",
			path:           "/api/dashboard/stats",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "OPTIONS request for CORS",
			method:         "OPTIONS",
			path:           "/api/tasks",
			expectedStatus: http.StatusNoContent,
			checkHeaders: map[string]string{
				"Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
			},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req *http.Request
			if tt.body != "" {
				req = httptest.NewRequest(tt.method, tt.path, strings.NewReader(tt.body))
			} else {
				req = httptest.NewRequest(tt.method, tt.path, nil)
			}

			if tt.contentType != "" {
				req.Header.Set("Content-Type", tt.contentType)
			}

			// Add origin header for CORS testing
			req.Header.Set("Origin", "http://localhost:3000")

			w := httptest.NewRecorder()
			server.Handler.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code, "Status code mismatch for %s %s", tt.method, tt.path)

			// Check specific headers if provided
			for header, expectedValue := range tt.checkHeaders {
				actualValue := w.Header().Get(header)
				assert.Contains(t, actualValue, expectedValue, "Header %s should contain %s, got %s", header, expectedValue, actualValue)
			}
		})
	}
}

func TestServerMiddlewareOrder(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	server := NewServer(db)

	// Test that middleware is applied in correct order
	req := httptest.NewRequest("GET", "/api/tasks", nil)
	req.Header.Set("Origin", "http://localhost:3000")

	w := httptest.NewRecorder()
	server.Handler.ServeHTTP(w, req)

	// Check that all middleware headers are present
	assert.Equal(t, http.StatusOK, w.Code)
	assert.NotEmpty(t, w.Header().Get("X-API-Version"))
	assert.NotEmpty(t, w.Header().Get("X-Content-Type-Options"))
	assert.NotEmpty(t, w.Header().Get("Access-Control-Allow-Origin"))
	assert.NotEmpty(t, w.Header().Get("X-RateLimit-Limit"))
}

func TestAPIVersioningMiddleware(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()

	server := NewServer(db)

	tests := []struct {
		name           string
		clientVersion  string
		expectedStatus int
	}{
		{
			name:           "No version header",
			clientVersion:  "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Valid version v1",
			clientVersion:  "v1",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid version v2",
			clientVersion:  "v2",
			expectedStatus: http.StatusBadRequest,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/api/tasks", nil)
			if tt.clientVersion != "" {
				req.Header.Set("X-API-Version", tt.clientVersion)
			}

			w := httptest.NewRecorder()
			server.Handler.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			assert.Equal(t, "v1", w.Header().Get("X-API-Version"))
		})
	}
}
