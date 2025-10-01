package handlers

import (
	"net/http"
	"strconv"
	"time"

	"agenda/internal/services"
	"github.com/gin-gonic/gin"
)

// EventHandler handles HTTP requests for event operations
type EventHandler struct {
	eventService services.EventServiceInterface
}

// NewEventHandler creates a new event handler instance
func NewEventHandler(eventService services.EventServiceInterface) *EventHandler {
	return &EventHandler{
		eventService: eventService,
	}
}

// CreateEventRequest represents the HTTP request body for creating an event
type CreateEventRequest struct {
	Title       string    `json:"title" binding:"required"`
	Description string    `json:"description"`
	StartTime   time.Time `json:"start_time" binding:"required"`
	EndTime     time.Time `json:"end_time" binding:"required"`
}

// UpdateEventRequest represents the HTTP request body for updating an event
type UpdateEventRequest struct {
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	StartTime   *time.Time `json:"start_time"`
	EndTime     *time.Time `json:"end_time"`
}

// EventListQuery represents query parameters for listing events
type EventListQuery struct {
	Title       string `form:"title"`
	StartAfter  string `form:"start_after"`
	StartBefore string `form:"start_before"`
	EndAfter    string `form:"end_after"`
	EndBefore   string `form:"end_before"`
	Search      string `form:"search"`
	Year        int    `form:"year"`
	Month       int    `form:"month"`
	Day         string `form:"day"`
	Page        int    `form:"page"`
	PageSize    int    `form:"page_size"`
}

// CreateEvent handles POST /api/events
func (eh *EventHandler) CreateEvent(c *gin.Context) {
	var req CreateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		eh.handleValidationError(c, err)
		return
	}

	// Convert to service request
	serviceReq := services.CreateEventRequest{
		Title:       req.Title,
		Description: req.Description,
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
	}

	event, err := eh.eventService.CreateEvent(c.Request.Context(), serviceReq)
	if err != nil {
		eh.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, event)
}

// GetEvent handles GET /api/events/:id
func (eh *EventHandler) GetEvent(c *gin.Context) {
	id, err := eh.parseEventID(c)
	if err != nil {
		eh.handleError(c, http.StatusBadRequest, "INVALID_ID", "Invalid event ID", nil)
		return
	}

	event, err := eh.eventService.GetEventByID(c.Request.Context(), id)
	if err != nil {
		eh.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, event)
}

// UpdateEvent handles PUT /api/events/:id
func (eh *EventHandler) UpdateEvent(c *gin.Context) {
	id, err := eh.parseEventID(c)
	if err != nil {
		eh.handleError(c, http.StatusBadRequest, "INVALID_ID", "Invalid event ID", nil)
		return
	}

	var req UpdateEventRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		eh.handleValidationError(c, err)
		return
	}

	// Convert to service request
	serviceReq := services.UpdateEventRequest{
		Title:       req.Title,
		Description: req.Description,
		StartTime:   req.StartTime,
		EndTime:     req.EndTime,
	}

	event, err := eh.eventService.UpdateEvent(c.Request.Context(), id, serviceReq)
	if err != nil {
		eh.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, event)
}

// DeleteEvent handles DELETE /api/events/:id
func (eh *EventHandler) DeleteEvent(c *gin.Context) {
	id, err := eh.parseEventID(c)
	if err != nil {
		eh.handleError(c, http.StatusBadRequest, "INVALID_ID", "Invalid event ID", nil)
		return
	}

	err = eh.eventService.DeleteEvent(c.Request.Context(), id)
	if err != nil {
		eh.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ListEvents handles GET /api/events with various filtering options
func (eh *EventHandler) ListEvents(c *gin.Context) {
	var query EventListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		eh.handleValidationError(c, err)
		return
	}

	// Handle special calendar month query
	if query.Year > 0 && query.Month > 0 {
		eh.getEventsByMonth(c, query.Year, time.Month(query.Month))
		return
	}

	// Handle day query
	if query.Day != "" {
		eh.getEventsByDay(c, query.Day)
		return
	}

	// Parse date filters for general listing
	filters := services.EventListFilters{
		Title:    query.Title,
		Search:   query.Search,
		Page:     query.Page,
		PageSize: query.PageSize,
	}

	if query.StartAfter != "" {
		startAfter, err := time.Parse(time.RFC3339, query.StartAfter)
		if err != nil {
			eh.handleError(c, http.StatusBadRequest, "INVALID_DATE", "Invalid start_after date format", map[string]interface{}{
				"start_after": "Date must be in RFC3339 format (e.g., 2023-01-01T00:00:00Z)",
			})
			return
		}
		filters.StartAfter = &startAfter
	}

	if query.StartBefore != "" {
		startBefore, err := time.Parse(time.RFC3339, query.StartBefore)
		if err != nil {
			eh.handleError(c, http.StatusBadRequest, "INVALID_DATE", "Invalid start_before date format", map[string]interface{}{
				"start_before": "Date must be in RFC3339 format (e.g., 2023-01-01T00:00:00Z)",
			})
			return
		}
		filters.StartBefore = &startBefore
	}

	if query.EndAfter != "" {
		endAfter, err := time.Parse(time.RFC3339, query.EndAfter)
		if err != nil {
			eh.handleError(c, http.StatusBadRequest, "INVALID_DATE", "Invalid end_after date format", map[string]interface{}{
				"end_after": "Date must be in RFC3339 format (e.g., 2023-01-01T00:00:00Z)",
			})
			return
		}
		filters.EndAfter = &endAfter
	}

	if query.EndBefore != "" {
		endBefore, err := time.Parse(time.RFC3339, query.EndBefore)
		if err != nil {
			eh.handleError(c, http.StatusBadRequest, "INVALID_DATE", "Invalid end_before date format", map[string]interface{}{
				"end_before": "Date must be in RFC3339 format (e.g., 2023-01-01T00:00:00Z)",
			})
			return
		}
		filters.EndBefore = &endBefore
	}

	events, total, err := eh.eventService.ListEvents(c.Request.Context(), filters)
	if err != nil {
		eh.handleServiceError(c, err)
		return
	}

	// Calculate pagination info
	page := filters.Page
	if page < 1 {
		page = 1
	}
	pageSize := filters.PageSize
	if pageSize <= 0 {
		pageSize = 20
	}

	totalPages := int((total + int64(pageSize) - 1) / int64(pageSize))

	response := PaginatedResponse{
		Data:       events,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}

	c.JSON(http.StatusOK, response)
}

// getEventsByMonth handles calendar month view queries
func (eh *EventHandler) getEventsByMonth(c *gin.Context, year int, month time.Month) {
	events, err := eh.eventService.GetEventsByMonth(c.Request.Context(), year, month)
	if err != nil {
		eh.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, map[string]interface{}{
		"events": events,
		"year":   year,
		"month":  int(month),
		"total":  len(events),
	})
}

// getEventsByDay handles single day queries
func (eh *EventHandler) getEventsByDay(c *gin.Context, dayStr string) {
	day, err := time.Parse("2006-01-02", dayStr)
	if err != nil {
		eh.handleError(c, http.StatusBadRequest, "INVALID_DATE", "Invalid day format", map[string]interface{}{
			"day": "Date must be in YYYY-MM-DD format (e.g., 2023-01-01)",
		})
		return
	}

	events, err := eh.eventService.GetEventsByDay(c.Request.Context(), day)
	if err != nil {
		eh.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, map[string]interface{}{
		"events": events,
		"date":   dayStr,
		"total":  len(events),
	})
}

// GetUpcomingEvents handles GET /api/events/upcoming
func (eh *EventHandler) GetUpcomingEvents(c *gin.Context) {
	limitStr := c.DefaultQuery("limit", "10")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit <= 0 {
		limit = 10
	}
	if limit > 100 {
		limit = 100
	}

	events, err := eh.eventService.GetUpcomingEvents(c.Request.Context(), limit)
	if err != nil {
		eh.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, map[string]interface{}{
		"events": events,
		"limit":  limit,
		"total":  len(events),
	})
}

// parseEventID extracts and validates the event ID from the URL parameter
func (eh *EventHandler) parseEventID(c *gin.Context) (int, error) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return 0, err
	}
	return id, nil
}

// handleValidationError handles validation errors from request binding
func (eh *EventHandler) handleValidationError(c *gin.Context, err error) {
	eh.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid request data", map[string]interface{}{
		"validation_error": err.Error(),
	})
}

// handleServiceError handles errors from the service layer
func (eh *EventHandler) handleServiceError(c *gin.Context, err error) {
	switch err {
	case services.ErrEventNotFound:
		eh.handleError(c, http.StatusNotFound, "EVENT_NOT_FOUND", "Event not found", nil)
	case services.ErrEventTitleRequired:
		eh.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Event title is required", map[string]interface{}{
			"title": "Title is required",
		})
	case services.ErrEventTitleTooLong:
		eh.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Event title too long", map[string]interface{}{
			"title": "Title cannot exceed 255 characters",
		})
	case services.ErrEventDescriptionTooLong:
		eh.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Event description too long", map[string]interface{}{
			"description": "Description cannot exceed 1000 characters",
		})
	case services.ErrInvalidTimeRange:
		eh.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid time range", map[string]interface{}{
			"time_range": "End time must be after start time",
		})
	case services.ErrEventInPast:
		eh.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Event cannot be in the past", map[string]interface{}{
			"start_time": "Event start time cannot be in the past",
		})
	case services.ErrEventTooLong:
		eh.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Event duration too long", map[string]interface{}{
			"duration": "Event duration cannot exceed 24 hours",
		})
	case services.ErrTimeConflict:
		eh.handleError(c, http.StatusConflict, "TIME_CONFLICT", "Event conflicts with existing events", nil)
	default:
		eh.handleError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error", nil)
	}
}

// handleError creates a standardized error response
func (eh *EventHandler) handleError(c *gin.Context, statusCode int, code, message string, details map[string]interface{}) {
	response := ErrorResponse{
		Error: ErrorDetail{
			Code:    code,
			Message: message,
			Details: details,
		},
	}
	c.JSON(statusCode, response)
}