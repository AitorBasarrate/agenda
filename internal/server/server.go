package server

import (
	"database/sql"
	"net/http"
	"os"

	"agenda/internal/database"
	"agenda/internal/handlers"
	"agenda/internal/middleware"
	"agenda/internal/services"
	"github.com/gin-gonic/gin"
)

func NewServer(db *sql.DB) *http.Server {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	router := gin.Default()
	
	// Add middleware
	router.Use(middleware.CORS())
	router.Use(middleware.ErrorHandler())
	router.Use(middleware.RequestLogger())

	// Initialize repositories
	taskRepo := database.NewTaskRepository(db)
	eventRepo := database.NewEventRepository(db)

	// Initialize services
	taskService := services.NewTaskService(taskRepo)
	eventService := services.NewEventService(eventRepo)

	// Initialize handlers
	taskHandler := handlers.NewTaskHandler(taskService)
	eventHandler := handlers.NewEventHandler(eventService)

	// API routes
	api := router.Group("/api")
	{
		// Task routes
		tasks := api.Group("/tasks")
		{
			tasks.GET("", taskHandler.ListTasks)
			tasks.POST("", taskHandler.CreateTask)
			tasks.GET("/:id", taskHandler.GetTask)
			tasks.PUT("/:id", taskHandler.UpdateTask)
			tasks.DELETE("/:id", taskHandler.DeleteTask)
			tasks.POST("/:id/complete", taskHandler.CompleteTask)
			tasks.POST("/:id/reopen", taskHandler.ReopenTask)
		}

		// Event routes
		events := api.Group("/events")
		{
			events.GET("", eventHandler.ListEvents)
			events.POST("", eventHandler.CreateEvent)
			events.GET("/upcoming", eventHandler.GetUpcomingEvents)
			events.GET("/:id", eventHandler.GetEvent)
			events.PUT("/:id", eventHandler.UpdateEvent)
			events.DELETE("/:id", eventHandler.DeleteEvent)
		}
	}

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