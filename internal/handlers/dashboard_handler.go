package handlers

import (
	"net/http"
	"time"

	"agenda/internal/services"
	"github.com/gin-gonic/gin"
)

// DashboardHandler handles HTTP requests for dashboard operations
type DashboardHandler struct {
	dashboardService services.DashboardServiceInterface
}

// NewDashboardHandler creates a new dashboard handler instance
func NewDashboardHandler(dashboardService services.DashboardServiceInterface) *DashboardHandler {
	return &DashboardHandler{
		dashboardService: dashboardService,
	}
}

// DashboardQuery represents query parameters for dashboard requests
type DashboardQuery struct {
	StartDate     string `form:"start_date"`
	EndDate       string `form:"end_date"`
	IncludeTasks  string `form:"include_tasks"`
	IncludeEvents string `form:"include_events"`
	TaskStatus    string `form:"task_status"`
}

// CalendarViewQuery represents query parameters for calendar view requests
type CalendarViewQuery struct {
	Year  int `form:"year" binding:"required"`
	Month int `form:"month" binding:"required"`
}

// DateRangeQuery represents query parameters for date range requests
type DateRangeQuery struct {
	StartDate string `form:"start_date" binding:"required"`
	EndDate   string `form:"end_date" binding:"required"`
	Format    string `form:"format"` // "items" or "calendar" (default: "items")
}

// UpcomingQuery represents query parameters for upcoming items requests
type UpcomingQuery struct {
	Days  int `form:"days"`
	Limit int `form:"limit"`
}

// GetDashboard handles GET /api/dashboard
func (dh *DashboardHandler) GetDashboard(c *gin.Context) {
	var query DashboardQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		dh.handleValidationError(c, err)
		return
	}

	// Parse filters
	filters := services.DashboardFilters{
		TaskStatus:    query.TaskStatus,
		IncludeTasks:  query.IncludeTasks != "false", // Default to true
		IncludeEvents: query.IncludeEvents != "false", // Default to true
	}

	// Parse start date
	if query.StartDate != "" {
		startDate, err := time.Parse(time.RFC3339, query.StartDate)
		if err != nil {
			dh.handleError(c, http.StatusBadRequest, "INVALID_DATE", "Invalid start_date format", map[string]interface{}{
				"start_date": "Date must be in RFC3339 format (e.g., 2023-01-01T00:00:00Z)",
			})
			return
		}
		filters.StartDate = &startDate
	}

	// Parse end date
	if query.EndDate != "" {
		endDate, err := time.Parse(time.RFC3339, query.EndDate)
		if err != nil {
			dh.handleError(c, http.StatusBadRequest, "INVALID_DATE", "Invalid end_date format", map[string]interface{}{
				"end_date": "Date must be in RFC3339 format (e.g., 2023-01-01T00:00:00Z)",
			})
			return
		}
		filters.EndDate = &endDate
	}

	// Get dashboard data
	dashboardData, err := dh.dashboardService.GetDashboardData(c.Request.Context(), filters)
	if err != nil {
		dh.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, dashboardData)
}

// GetDashboardStats handles GET /api/dashboard/stats
func (dh *DashboardHandler) GetDashboardStats(c *gin.Context) {
	stats, err := dh.dashboardService.GetDashboardStats(c.Request.Context())
	if err != nil {
		dh.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, stats)
}

// GetUpcomingItems handles GET /api/dashboard/upcoming
func (dh *DashboardHandler) GetUpcomingItems(c *gin.Context) {
	var query UpcomingQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		dh.handleValidationError(c, err)
		return
	}

	// Set defaults
	if query.Days <= 0 {
		query.Days = 7
	}
	if query.Limit <= 0 {
		query.Limit = 20
	}

	// Validate limits
	if query.Days > 365 {
		query.Days = 365
	}
	if query.Limit > 100 {
		query.Limit = 100
	}

	upcomingItems, err := dh.dashboardService.GetUpcomingItems(c.Request.Context(), query.Days, query.Limit)
	if err != nil {
		dh.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, upcomingItems)
}

// GetCalendarView handles GET /api/dashboard/calendar
func (dh *DashboardHandler) GetCalendarView(c *gin.Context) {
	var query CalendarViewQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		dh.handleValidationError(c, err)
		return
	}

	// Validate year and month
	if query.Year < 1900 || query.Year > 2100 {
		dh.handleError(c, http.StatusBadRequest, "INVALID_YEAR", "Invalid year", map[string]interface{}{
			"year": "Year must be between 1900 and 2100",
		})
		return
	}
	if query.Month < 1 || query.Month > 12 {
		dh.handleError(c, http.StatusBadRequest, "INVALID_MONTH", "Invalid month", map[string]interface{}{
			"month": "Month must be between 1 and 12",
		})
		return
	}

	calendarData, err := dh.dashboardService.GetCombinedCalendarView(c.Request.Context(), query.Year, time.Month(query.Month))
	if err != nil {
		dh.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, calendarData)
}

// GetDateRange handles GET /api/dashboard/daterange
func (dh *DashboardHandler) GetDateRange(c *gin.Context) {
	var query DateRangeQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		dh.handleValidationError(c, err)
		return
	}

	// Parse dates
	startDate, err := time.Parse(time.RFC3339, query.StartDate)
	if err != nil {
		dh.handleError(c, http.StatusBadRequest, "INVALID_DATE", "Invalid start_date format", map[string]interface{}{
			"start_date": "Date must be in RFC3339 format (e.g., 2023-01-01T00:00:00Z)",
		})
		return
	}

	endDate, err := time.Parse(time.RFC3339, query.EndDate)
	if err != nil {
		dh.handleError(c, http.StatusBadRequest, "INVALID_DATE", "Invalid end_date format", map[string]interface{}{
			"end_date": "Date must be in RFC3339 format (e.g., 2023-01-01T00:00:00Z)",
		})
		return
	}

	// Handle different response formats
	if query.Format == "calendar" {
		// Return unified calendar items
		calendarItems, err := dh.dashboardService.GetCombinedCalendarItems(c.Request.Context(), startDate, endDate)
		if err != nil {
			dh.handleServiceError(c, err)
			return
		}

		c.JSON(http.StatusOK, map[string]interface{}{
			"items":      calendarItems,
			"start_date": startDate,
			"end_date":   endDate,
			"total":      len(calendarItems),
			"format":     "calendar",
		})
	} else {
		// Return separate tasks and events
		dateRangeData, err := dh.dashboardService.GetItemsByDateRange(c.Request.Context(), startDate, endDate)
		if err != nil {
			dh.handleServiceError(c, err)
			return
		}

		c.JSON(http.StatusOK, dateRangeData)
	}
}

// handleValidationError handles validation errors from request binding
func (dh *DashboardHandler) handleValidationError(c *gin.Context, err error) {
	dh.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid request data", map[string]interface{}{
		"validation_error": err.Error(),
	})
}

// handleServiceError handles errors from the service layer
func (dh *DashboardHandler) handleServiceError(c *gin.Context, err error) {
	switch err {
	case services.ErrInvalidDateRange:
		dh.handleError(c, http.StatusBadRequest, "INVALID_DATE_RANGE", "End date must be after start date", nil)
	case services.ErrInvalidMonth:
		dh.handleError(c, http.StatusBadRequest, "INVALID_MONTH", "Invalid month", map[string]interface{}{
			"month": "Month must be between 1 and 12",
		})
	case services.ErrInvalidYear:
		dh.handleError(c, http.StatusBadRequest, "INVALID_YEAR", "Invalid year", map[string]interface{}{
			"year": "Year must be between 1900 and 2100",
		})
	default:
		dh.handleError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error", nil)
	}
}

// handleError creates a standardized error response
func (dh *DashboardHandler) handleError(c *gin.Context, statusCode int, code, message string, details map[string]interface{}) {
	response := ErrorResponse{
		Error: ErrorDetail{
			Code:    code,
			Message: message,
			Details: details,
		},
	}
	c.JSON(statusCode, response)
}