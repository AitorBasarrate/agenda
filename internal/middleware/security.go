package middleware

import (
	"github.com/gin-gonic/gin"
)

// Security middleware adds security headers to responses
func Security() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Security headers
		c.Header("X-Content-Type-Options", "nosniff")
		c.Header("X-Frame-Options", "DENY")
		c.Header("X-XSS-Protection", "1; mode=block")
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")

		// Only add HSTS in production with HTTPS
		if gin.Mode() == gin.ReleaseMode && c.Request.TLS != nil {
			c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
		}

		c.Next()
	}
}

// RateLimitInfo middleware adds rate limiting information headers
func RateLimitInfo() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Add rate limiting headers (placeholder for future implementation)
		c.Header("X-RateLimit-Limit", "1000")
		c.Header("X-RateLimit-Remaining", "999")
		c.Header("X-RateLimit-Reset", "3600")

		c.Next()
	}
}
