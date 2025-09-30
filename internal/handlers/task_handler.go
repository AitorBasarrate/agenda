package handlers

import (
	"net/http"
	"strconv"
	"time"

	"agenda/internal/services"
	"github.com/gin-gonic/gin"
)

// TaskHandler handles HTTP requests for task operations
type TaskHandler struct {
	taskService services.TaskServiceInterface
}

// NewTaskHandler creates a new task handler instance
func NewTaskHandler(taskService services.TaskServiceInterface) *TaskHandler {
	return &TaskHandler{
		taskService: taskService,
	}
}

// CreateTaskRequest represents the HTTP request body for creating a task
type CreateTaskRequest struct {
	Title       string     `json:"title" binding:"required"`
	Description string     `json:"description"`
	DueDate     *time.Time `json:"due_date"`
}

// UpdateTaskRequest represents the HTTP request body for updating a task
type UpdateTaskRequest struct {
	Title       *string    `json:"title"`
	Description *string    `json:"description"`
	DueDate     *time.Time `json:"due_date"`
	Status      *string    `json:"status"`
}

// TaskListQuery represents query parameters for listing tasks
type TaskListQuery struct {
	Status    string `form:"status"`
	DueAfter  string `form:"due_after"`
	DueBefore string `form:"due_before"`
	Search    string `form:"search"`
	Page      int    `form:"page"`
	PageSize  int    `form:"page_size"`
}

// ErrorResponse represents an error response
type ErrorResponse struct {
	Error ErrorDetail `json:"error"`
}

// ErrorDetail contains error information
type ErrorDetail struct {
	Code    string                 `json:"code"`
	Message string                 `json:"message"`
	Details map[string]interface{} `json:"details,omitempty"`
}

// PaginatedResponse represents a paginated response
type PaginatedResponse struct {
	Data       interface{} `json:"data"`
	Total      int64       `json:"total"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	TotalPages int         `json:"total_pages"`
}

// CreateTask handles POST /api/tasks
func (th *TaskHandler) CreateTask(c *gin.Context) {
	var req CreateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		th.handleValidationError(c, err)
		return
	}

	// Convert to service request
	serviceReq := services.CreateTaskRequest{
		Title:       req.Title,
		Description: req.Description,
		DueDate:     req.DueDate,
	}

	task, err := th.taskService.CreateTask(c.Request.Context(), serviceReq)
	if err != nil {
		th.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusCreated, task)
}

// GetTask handles GET /api/tasks/:id
func (th *TaskHandler) GetTask(c *gin.Context) {
	id, err := th.parseTaskID(c)
	if err != nil {
		th.handleError(c, http.StatusBadRequest, "INVALID_ID", "Invalid task ID", nil)
		return
	}

	task, err := th.taskService.GetTaskByID(c.Request.Context(), id)
	if err != nil {
		th.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, task)
}

// UpdateTask handles PUT /api/tasks/:id
func (th *TaskHandler) UpdateTask(c *gin.Context) {
	id, err := th.parseTaskID(c)
	if err != nil {
		th.handleError(c, http.StatusBadRequest, "INVALID_ID", "Invalid task ID", nil)
		return
	}

	var req UpdateTaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		th.handleValidationError(c, err)
		return
	}

	// Convert to service request
	serviceReq := services.UpdateTaskRequest{
		Title:       req.Title,
		Description: req.Description,
		DueDate:     req.DueDate,
		Status:      req.Status,
	}

	task, err := th.taskService.UpdateTask(c.Request.Context(), id, serviceReq)
	if err != nil {
		th.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, task)
}

// DeleteTask handles DELETE /api/tasks/:id
func (th *TaskHandler) DeleteTask(c *gin.Context) {
	id, err := th.parseTaskID(c)
	if err != nil {
		th.handleError(c, http.StatusBadRequest, "INVALID_ID", "Invalid task ID", nil)
		return
	}

	err = th.taskService.DeleteTask(c.Request.Context(), id)
	if err != nil {
		th.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusNoContent, nil)
}

// ListTasks handles GET /api/tasks
func (th *TaskHandler) ListTasks(c *gin.Context) {
	var query TaskListQuery
	if err := c.ShouldBindQuery(&query); err != nil {
		th.handleValidationError(c, err)
		return
	}

	// Parse date filters
	filters := services.TaskListFilters{
		Status:   query.Status,
		Search:   query.Search,
		Page:     query.Page,
		PageSize: query.PageSize,
	}

	if query.DueAfter != "" {
		dueAfter, err := time.Parse(time.RFC3339, query.DueAfter)
		if err != nil {
			th.handleError(c, http.StatusBadRequest, "INVALID_DATE", "Invalid due_after date format", map[string]interface{}{
				"due_after": "Date must be in RFC3339 format (e.g., 2023-01-01T00:00:00Z)",
			})
			return
		}
		filters.DueAfter = &dueAfter
	}

	if query.DueBefore != "" {
		dueBefore, err := time.Parse(time.RFC3339, query.DueBefore)
		if err != nil {
			th.handleError(c, http.StatusBadRequest, "INVALID_DATE", "Invalid due_before date format", map[string]interface{}{
				"due_before": "Date must be in RFC3339 format (e.g., 2023-01-01T00:00:00Z)",
			})
			return
		}
		filters.DueBefore = &dueBefore
	}

	tasks, total, err := th.taskService.ListTasks(c.Request.Context(), filters)
	if err != nil {
		th.handleServiceError(c, err)
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
		Data:       tasks,
		Total:      total,
		Page:       page,
		PageSize:   pageSize,
		TotalPages: totalPages,
	}

	c.JSON(http.StatusOK, response)
}

// CompleteTask handles POST /api/tasks/:id/complete
func (th *TaskHandler) CompleteTask(c *gin.Context) {
	id, err := th.parseTaskID(c)
	if err != nil {
		th.handleError(c, http.StatusBadRequest, "INVALID_ID", "Invalid task ID", nil)
		return
	}

	task, err := th.taskService.CompleteTask(c.Request.Context(), id)
	if err != nil {
		th.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, task)
}

// ReopenTask handles POST /api/tasks/:id/reopen
func (th *TaskHandler) ReopenTask(c *gin.Context) {
	id, err := th.parseTaskID(c)
	if err != nil {
		th.handleError(c, http.StatusBadRequest, "INVALID_ID", "Invalid task ID", nil)
		return
	}

	task, err := th.taskService.ReopenTask(c.Request.Context(), id)
	if err != nil {
		th.handleServiceError(c, err)
		return
	}

	c.JSON(http.StatusOK, task)
}

// parseTaskID extracts and validates the task ID from the URL parameter
func (th *TaskHandler) parseTaskID(c *gin.Context) (int, error) {
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil || id <= 0 {
		return 0, err
	}
	return id, nil
}

// handleValidationError handles validation errors from request binding
func (th *TaskHandler) handleValidationError(c *gin.Context, err error) {
	th.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid request data", map[string]interface{}{
		"validation_error": err.Error(),
	})
}

// handleServiceError handles errors from the service layer
func (th *TaskHandler) handleServiceError(c *gin.Context, err error) {
	switch err {
	case services.ErrTaskNotFound:
		th.handleError(c, http.StatusNotFound, "TASK_NOT_FOUND", "Task not found", nil)
	case services.ErrTaskTitleRequired:
		th.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Task title is required", map[string]interface{}{
			"title": "Title is required",
		})
	case services.ErrTaskTitleTooLong:
		th.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Task title too long", map[string]interface{}{
			"title": "Title cannot exceed 255 characters",
		})
	case services.ErrTaskDescriptionTooLong:
		th.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Task description too long", map[string]interface{}{
			"description": "Description cannot exceed 1000 characters",
		})
	case services.ErrInvalidTaskStatus:
		th.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Invalid task status", map[string]interface{}{
			"status": "Status must be 'pending' or 'completed'",
		})
	case services.ErrDueDateInPast:
		th.handleError(c, http.StatusBadRequest, "VALIDATION_ERROR", "Due date cannot be in the past", map[string]interface{}{
			"due_date": "Due date must be in the future",
		})
	case services.ErrTaskAlreadyCompleted:
		th.handleError(c, http.StatusConflict, "TASK_ALREADY_COMPLETED", "Task is already completed", nil)
	case services.ErrTaskAlreadyPending:
		th.handleError(c, http.StatusConflict, "TASK_ALREADY_PENDING", "Task is already pending", nil)
	default:
		th.handleError(c, http.StatusInternalServerError, "INTERNAL_ERROR", "Internal server error", nil)
	}
}

// handleError creates a standardized error response
func (th *TaskHandler) handleError(c *gin.Context, statusCode int, code, message string, details map[string]interface{}) {
	response := ErrorResponse{
		Error: ErrorDetail{
			Code:    code,
			Message: message,
			Details: details,
		},
	}
	c.JSON(statusCode, response)
}