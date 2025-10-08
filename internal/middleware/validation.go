package middleware

import (
	"net/http"
	"strings"

	"agenda/internal/api"

	"github.com/gin-gonic/gin"
)

// ContentTypeValidation middleware validates content-type for POST/PUT requests
func ContentTypeValidation() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Only validate content-type for requests with body
		if c.Request.Method == http.MethodPost || c.Request.Method == http.MethodPut {
			contentType := c.GetHeader("Content-Type")

			// Allow empty content-type for requests without body
			if c.Request.ContentLength == 0 {
				c.Next()
				return
			}

			// Check if content-type is JSON
			if !strings.HasPrefix(contentType, "application/json") {
				response := api.ErrorResponse{
					Error: api.ErrorDetail{
						Code:    "INVALID_CONTENT_TYPE",
						Message: "Content-Type must be application/json",
						Details: map[string]interface{}{
							"received": contentType,
							"expected": "application/json",
						},
					},
				}
				c.JSON(http.StatusUnsupportedMediaType, response)
				c.Abort()
				return
			}
		}

		c.Next()
	}
}

// APIVersioning middleware adds API version information
func APIVersioning() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Add API version header
		c.Header("X-API-Version", "v1")

		// Accept version from client (for future use)
		clientVersion := c.GetHeader("X-API-Version")
		if clientVersion != "" && clientVersion != "v1" {
			response := api.ErrorResponse{
				Error: api.ErrorDetail{
					Code:    "UNSUPPORTED_API_VERSION",
					Message: "Unsupported API version",
					Details: map[string]interface{}{
						"requested": clientVersion,
						"supported": []string{"v1"},
					},
				},
			}
			c.JSON(http.StatusBadRequest, response)
			c.Abort()
			return
		}

		c.Next()
	}
}
