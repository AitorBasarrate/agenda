package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"strings"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestMain(m *testing.M) {
	// Set Gin to test mode
	gin.SetMode(gin.TestMode)
	os.Exit(m.Run())
}

func TestCORS(t *testing.T) {
	router := gin.New()
	router.Use(CORS())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "test"})
	})

	tests := []struct {
		name           string
		origin         string
		method         string
		expectedStatus int
		expectCORS     bool
	}{
		{
			name:           "Valid origin in debug mode",
			origin:         "http://localhost:3000",
			method:         "GET",
			expectedStatus: http.StatusOK,
			expectCORS:     true,
		},
		{
			name:           "OPTIONS request",
			origin:         "http://localhost:3000",
			method:         "OPTIONS",
			expectedStatus: http.StatusNoContent,
			expectCORS:     true,
		},
		{
			name:           "No origin header",
			origin:         "",
			method:         "GET",
			expectedStatus: http.StatusOK,
			expectCORS:     true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/test", nil)
			if tt.origin != "" {
				req.Header.Set("Origin", tt.origin)
			}

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)

			if tt.expectCORS {
				assert.NotEmpty(t, w.Header().Get("Access-Control-Allow-Methods"))
				assert.NotEmpty(t, w.Header().Get("Access-Control-Allow-Headers"))
			}
		})
	}
}

func TestSecurity(t *testing.T) {
	router := gin.New()
	router.Use(Security())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "test"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "nosniff", w.Header().Get("X-Content-Type-Options"))
	assert.Equal(t, "DENY", w.Header().Get("X-Frame-Options"))
	assert.Equal(t, "1; mode=block", w.Header().Get("X-XSS-Protection"))
	assert.Equal(t, "strict-origin-when-cross-origin", w.Header().Get("Referrer-Policy"))
}

func TestContentTypeValidation(t *testing.T) {
	router := gin.New()
	router.Use(ContentTypeValidation())
	router.POST("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "test"})
	})
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "test"})
	})

	tests := []struct {
		name           string
		method         string
		contentType    string
		body           string
		expectedStatus int
	}{
		{
			name:           "Valid JSON content-type",
			method:         "POST",
			contentType:    "application/json",
			body:           `{"test": "data"}`,
			expectedStatus: http.StatusOK,
		},
		{
			name:           "Invalid content-type",
			method:         "POST",
			contentType:    "text/plain",
			body:           "test data",
			expectedStatus: http.StatusUnsupportedMediaType,
		},
		{
			name:           "GET request (no validation)",
			method:         "GET",
			contentType:    "",
			body:           "",
			expectedStatus: http.StatusOK,
		},
		{
			name:           "POST with empty body",
			method:         "POST",
			contentType:    "",
			body:           "",
			expectedStatus: http.StatusOK,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			req := httptest.NewRequest(tt.method, "/test", strings.NewReader(tt.body))
			if tt.contentType != "" {
				req.Header.Set("Content-Type", tt.contentType)
			}

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

func TestAPIVersioning(t *testing.T) {
	router := gin.New()
	router.Use(APIVersioning())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "test"})
	})

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
			req := httptest.NewRequest("GET", "/test", nil)
			if tt.clientVersion != "" {
				req.Header.Set("X-API-Version", tt.clientVersion)
			}

			w := httptest.NewRecorder()
			router.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
			assert.Equal(t, "v1", w.Header().Get("X-API-Version"))
		})
	}
}

func TestRateLimitInfo(t *testing.T) {
	router := gin.New()
	router.Use(RateLimitInfo())
	router.GET("/test", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"message": "test"})
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()
	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "1000", w.Header().Get("X-RateLimit-Limit"))
	assert.Equal(t, "999", w.Header().Get("X-RateLimit-Remaining"))
	assert.Equal(t, "3600", w.Header().Get("X-RateLimit-Reset"))
}
