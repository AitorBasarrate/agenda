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

	// Create router without default middleware to have full control
	router := gin.New()

	// Add middleware in order of execution
	router.Use(middleware.RequestLogger()) // Log requests first
	router.Use(middleware.ErrorHandler())  // Handle panics and errors
	router.Use(middleware.Security())      // Add security headers
	router.Use(middleware.CORS())          // Handle CORS for frontend integration
	router.Use(middleware.RateLimitInfo()) // Add rate limiting info headers

	// Initialize repositories
	taskRepo := database.NewTaskRepository(db)
	eventRepo := database.NewEventRepository(db)

	// Initialize services
	taskService := services.NewTaskService(taskRepo)
	eventService := services.NewEventService(eventRepo)
	dashboardService := services.NewDashboardService(taskService, eventService)

	// Initialize handlers
	taskHandler := handlers.NewTaskHandler(taskService)
	eventHandler := handlers.NewEventHandler(eventService)
	dashboardHandler := handlers.NewDashboardHandler(dashboardService)

	// API routes with additional middleware
	api := router.Group("/api")
	api.Use(middleware.APIVersioning())         // Add API versioning
	api.Use(middleware.ContentTypeValidation()) // Validate content-type for POST/PUT
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

		// Dashboard routes
		dashboard := api.Group("/dashboard")
		{
			dashboard.GET("", dashboardHandler.GetDashboard)
			dashboard.GET("/stats", dashboardHandler.GetDashboardStats)
			dashboard.GET("/upcoming", dashboardHandler.GetUpcomingItems)
			dashboard.GET("/calendar", dashboardHandler.GetCalendarView)
			dashboard.GET("/daterange", dashboardHandler.GetDateRange)
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
