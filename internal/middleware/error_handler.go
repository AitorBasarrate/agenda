package middleware

import (
	"fmt"
	"log"
	"net/http"

	"agenda/internal/api"
	"github.com/gin-gonic/gin"
)

// ErrorHandler middleware handles panics and provides consistent error responses
func ErrorHandler() gin.HandlerFunc {
	return gin.CustomRecovery(func(c *gin.Context, recovered interface{}) {
		if err, ok := recovered.(string); ok {
			log.Printf("Panic recovered: %s", err)
		} else {
			log.Printf("Panic recovered: %v", recovered)
		}

		response := api.ErrorResponse{
			Error: api.ErrorDetail{
				Code:    "INTERNAL_ERROR",
				Message: "Internal server error",
			},
		}

		c.JSON(http.StatusInternalServerError, response)
		c.Abort()
	})
}

// RequestLogger middleware logs incoming requests
func RequestLogger() gin.HandlerFunc {
	return gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format("02/Jan/2006:15:04:05 -0700"),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	})
}

