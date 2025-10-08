package middleware

import (
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
)

// getAllowedOrigins returns the list of allowed origins from environment or defaults
func getAllowedOrigins() map[string]struct{} {
	origins := make(map[string]struct{})

	// Get allowed origins from environment variable
	allowedOriginsEnv := os.Getenv("ALLOWED_ORIGINS")
	if allowedOriginsEnv != "" {
		originsList := strings.Split(allowedOriginsEnv, ",")
		for _, origin := range originsList {
			origins[strings.TrimSpace(origin)] = struct{}{}
		}
	} else {
		// Default allowed origins for development
		origins["http://localhost:3000"] = struct{}{}
		origins["http://localhost:5173"] = struct{}{}
		origins["http://127.0.0.1:3000"] = struct{}{}
		origins["http://127.0.0.1:5173"] = struct{}{}
	}

	return origins
}

// CORS middleware handles Cross-Origin Resource Sharing
func CORS() gin.HandlerFunc {
	allowedOrigins := getAllowedOrigins()

	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")

		// Check if origin is allowed
		if _, ok := allowedOrigins[origin]; ok {
			c.Header("Access-Control-Allow-Origin", origin)
		} else if gin.Mode() == gin.DebugMode {
			// In debug mode, allow all origins for development
			c.Header("Access-Control-Allow-Origin", "*")
		}

		c.Header("Vary", "Origin")
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Origin, Content-Type, Content-Length, Accept-Encoding, X-CSRF-Token, Authorization, accept, origin, Cache-Control, X-Requested-With")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400")

		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}

		c.Next()
	}
}
