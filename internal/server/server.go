package server

import (
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
)

func NewServer() *http.Server {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := gin.Default()
	
	// Basic health check endpoint
	router.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	server := &http.Server{
		Addr:    ":" + port,
		Handler: router,
	}

	return server
}