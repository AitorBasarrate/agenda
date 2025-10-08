package middleware

import (
	"fmt"
	"log"
	"net/http"
	"runtime/debug"

	"agenda/internal/api"

	"github.com/gin-gonic/gin"
)

// ErrorHandler middleware handles panics and provides consistent error responses
func ErrorHandler() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		// Log the panic with stack trace
		if err, ok := recovered.(string); ok {
			log.Printf("Panic recovered: %s\nStack trace:\n%s", err, debug.Stack())
		} else {
			log.Printf("Panic recovered: %v\nStack trace:\n%s", recovered, debug.Stack())
		}

		// Create standardized error response
		response := api.ErrorResponse{
			Error: api.ErrorDetail{
				Code:    "INTERNAL_ERROR",
				Message: "Internal server error",
			},
		}

		// In debug mode, include more details
		if gin.Mode() == gin.DebugMode {
			response.Error.Details = map[string]interface{}{
				"panic": fmt.Sprintf("%v", recovered),
			}
		}

		c.JSON(http.StatusInternalServerError, response)
		c.Abort()
	})
}

// RequestLogger middleware logs incoming requests with enhanced formatting
func RequestLogger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		// Enhanced log format with more details
		statusColor := getStatusColor(param.StatusCode)
		methodColor := getMethodColor(param.Method)
		resetColor := "\033[0m"

		if gin.Mode() == gin.ReleaseMode {
			// Simplified logging for production
			return fmt.Sprintf("[%s] %s %s %d %s\n",
				param.TimeStamp.Format("2006/01/02 - 15:04:05"),
				param.Method,
				param.Path,
				param.StatusCode,
				param.Latency,
			)
		}

		// Detailed logging for development
		return fmt.Sprintf("[GIN] %s |%s %3d %s| %13v | %15s |%s %-7s %s %s\n%s",
			param.TimeStamp.Format("2006/01/02 - 15:04:05"),
			statusColor, param.StatusCode, resetColor,
			param.Latency,
			param.ClientIP,
			methodColor, param.Method, resetColor,
			param.Path,
			param.ErrorMessage,
		)
	})
}

// getStatusColor returns ANSI color code based on HTTP status code
func getStatusColor(code int) string {
	switch {
	case code >= http.StatusOK && code < http.StatusMultipleChoices:
		return "\033[97;42m" // Green background
	case code >= http.StatusMultipleChoices && code < http.StatusBadRequest:
		return "\033[90;47m" // White background
	case code >= http.StatusBadRequest && code < http.StatusInternalServerError:
		return "\033[90;43m" // Yellow background
	default:
		return "\033[97;41m" // Red background
	}
}

// getMethodColor returns ANSI color code based on HTTP method
func getMethodColor(method string) string {
	switch method {
	case http.MethodGet:
		return "\033[97;44m" // Blue background
	case http.MethodPost:
		return "\033[97;42m" // Green background
	case http.MethodPut:
		return "\033[97;43m" // Yellow background
	case http.MethodDelete:
		return "\033[97;41m" // Red background
	case http.MethodPatch:
		return "\033[97;45m" // Magenta background
	case http.MethodHead:
		return "\033[97;46m" // Cyan background
	case http.MethodOptions:
		return "\033[90;47m" // White background
	default:
		return "\033[0m" // Reset
	}
}
