package services

import (
	"context"
	"errors"
	"fmt"
	"time"

	"agenda/internal/models"
)

// DashboardServiceInterface defines the contract for dashboard business logic operations
type DashboardServiceInterface interface {
	// Dashboard aggregation operations
	GetDashboardData(ctx context.Context, filters DashboardFilters) (*DashboardData, error)
	GetUpcomingItems(ctx context.Context, days int, limit int) (*UpcomingItems, error)
	GetDashboardStats(ctx context.Context) (*DashboardStats, error)
	
	// Combined view operations
	GetCombinedCalendarView(ctx context.Context, year int, month time.Month) (*CalendarViewData, error)
	GetItemsByDateRange(ctx context.Context, startDate, endDate time.Time) (*DateRangeData, error)
	GetCombinedCalendarItems(ctx context.Context, startDate, endDate time.Time) ([]*CalendarItem, error)
}

// DashboardService implements DashboardServiceInterface
type DashboardService struct {
	taskService  TaskServiceInterface
	eventService EventServiceInterface
}

// NewDashboardService creates a new dashboard service instance
func NewDashboardService(taskService TaskServiceInterface, eventService EventServiceInterface) DashboardServiceInterface {
	return &DashboardService{
		taskService:  taskService,
		eventService: eventService,
	}
}

// DashboardFilters represents filtering options for dashboard data
type DashboardFilters struct {
	StartDate *time.Time
	EndDate   *time.Time
	TaskStatus string
	IncludeTasks bool
	IncludeEvents bool
}

// DashboardData represents the aggregated data for the dashboard view
type DashboardData struct {
	UpcomingTasks  []*models.Task  `json:"upcoming_tasks"`
	UpcomingEvents []*models.Event `json:"upcoming_events"`
	OverdueTasks   []*models.Task  `json:"overdue_tasks"`
	TodayEvents    []*models.Event `json:"today_events"`
	Stats          *DashboardStats `json:"stats"`
}

// UpcomingItems represents upcoming tasks and events
type UpcomingItems struct {
	Tasks  []*models.Task  `json:"tasks"`
	Events []*models.Event `json:"events"`
	Total  int             `json:"total"`
}

// DashboardStats represents statistics for the dashboard
type DashboardStats struct {
	TotalTasks       int64 `json:"total_tasks"`
	CompletedTasks   int64 `json:"completed_tasks"`
	PendingTasks     int64 `json:"pending_tasks"`
	OverdueTasks     int64 `json:"overdue_tasks"`
	TotalEvents      int64 `json:"total_events"`
	TodayEvents      int64 `json:"today_events"`
	UpcomingEvents   int64 `json:"upcoming_events"`
	CompletionRate   float64 `json:"completion_rate"`
}

// CalendarViewData represents combined tasks and events for calendar view
type CalendarViewData struct {
	Tasks  []*models.Task  `json:"tasks"`
	Events []*models.Event `json:"events"`
	Year   int             `json:"year"`
	Month  time.Month      `json:"month"`
}

// DateRangeData represents tasks and events within a specific date range
type DateRangeData struct {
	Tasks     []*models.Task  `json:"tasks"`
	Events    []*models.Event `json:"events"`
	StartDate time.Time       `json:"start_date"`
	EndDate   time.Time       `json:"end_date"`
	Total     int             `json:"total"`
}

// CalendarItem represents a unified item for calendar display (task or event)
type CalendarItem struct {
	ID          int       `json:"id"`
	Title       string    `json:"title"`
	Description string    `json:"description"`
	Date        time.Time `json:"date"`
	Type        string    `json:"type"` // "task" or "event"
	Status      string    `json:"status,omitempty"` // For tasks
	StartTime   *time.Time `json:"start_time,omitempty"` // For events
	EndTime     *time.Time `json:"end_time,omitempty"` // For events
}

// Validation errors
var (
	ErrInvalidDateRange = errors.New("end date must be after start date")
	ErrInvalidMonth     = errors.New("invalid month")
	ErrInvalidYear      = errors.New("invalid year")
)

// GetDashboardData retrieves aggregated data for the dashboard view
func (ds *DashboardService) GetDashboardData(ctx context.Context, filters DashboardFilters) (*DashboardData, error) {
	dashboardData := &DashboardData{}

	// Set default filters if not provided
	if filters.StartDate == nil {
		now := time.Now()
		startDate := now.Truncate(24 * time.Hour)
		filters.StartDate = &startDate
	}
	if filters.EndDate == nil {
		endDate := filters.StartDate.AddDate(0, 0, 30) // Default to 30 days
		filters.EndDate = &endDate
	}
	if !filters.IncludeTasks && !filters.IncludeEvents {
		filters.IncludeTasks = true
		filters.IncludeEvents = true
	}

	// Validate date range
	if filters.EndDate.Before(*filters.StartDate) {
		return nil, ErrInvalidDateRange
	}

	// Get upcoming tasks (next 7 days)
	if filters.IncludeTasks {
		upcomingTasks, err := ds.taskService.GetUpcomingTasks(ctx, 7)
		if err != nil {
			return nil, fmt.Errorf("failed to get upcoming tasks: %w", err)
		}
		dashboardData.UpcomingTasks = upcomingTasks

		// Get overdue tasks
		overdueTasks, err := ds.taskService.GetOverdueTasks(ctx)
		if err != nil {
			return nil, fmt.Errorf("failed to get overdue tasks: %w", err)
		}
		dashboardData.OverdueTasks = overdueTasks
	}

	// Get upcoming events (next 7 days)
	if filters.IncludeEvents {
		upcomingEvents, err := ds.eventService.GetUpcomingEvents(ctx, 10)
		if err != nil {
			return nil, fmt.Errorf("failed to get upcoming events: %w", err)
		}
		dashboardData.UpcomingEvents = upcomingEvents

		// Get today's events
		nowLocal := time.Now()
		today := time.Date(nowLocal.Year(), nowLocal.Month(), nowLocal.Day(), 0, 0, 0, 0, nowLocal.Location())
		todayEvents, err := ds.eventService.GetEventsByDay(ctx, today)
		if err != nil {
			return nil, fmt.Errorf("failed to get today's events: %w", err)
		}
		dashboardData.TodayEvents = todayEvents
	}

	// Get dashboard statistics
	stats, err := ds.GetDashboardStats(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get dashboard stats: %w", err)
	}
	dashboardData.Stats = stats

	return dashboardData, nil
}

// GetUpcomingItems retrieves upcoming tasks and events within specified days
func (ds *DashboardService) GetUpcomingItems(ctx context.Context, days int, limit int) (*UpcomingItems, error) {
	if days <= 0 {
		days = 7 // Default to 7 days
	}
	if limit <= 0 {
		limit = 20 // Default limit
	}

	upcomingItems := &UpcomingItems{}

	// Get upcoming tasks
	tasks, err := ds.taskService.GetUpcomingTasks(ctx, days)
	if err != nil {
		return nil, fmt.Errorf("failed to get upcoming tasks: %w", err)
	}

	// Get upcoming events
	events, err := ds.eventService.GetUpcomingEvents(ctx, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to get upcoming events: %w", err)
	}

	// Filter events to only include those within the specified days
	now := time.Now()
	endDate := now.AddDate(0, 0, days)
	var filteredEvents []*models.Event
	for _, event := range events {
		if event.StartTime.Before(endDate) {
			filteredEvents = append(filteredEvents, event)
		}
	}

	// Apply limit to tasks and events combined
	totalItems := len(tasks) + len(filteredEvents)
	if totalItems > limit {
		// Proportionally limit tasks and events
		taskLimit := (len(tasks) * limit) / totalItems
		eventLimit := limit - taskLimit
		
		if len(tasks) > taskLimit {
			tasks = tasks[:taskLimit]
		}
		if len(filteredEvents) > eventLimit {
			filteredEvents = filteredEvents[:eventLimit]
		}
	}

	upcomingItems.Tasks = tasks
	upcomingItems.Events = filteredEvents
	upcomingItems.Total = len(tasks) + len(filteredEvents)

	return upcomingItems, nil
}

// GetDashboardStats calculates and returns dashboard statistics
func (ds *DashboardService) GetDashboardStats(ctx context.Context) (*DashboardStats, error) {
	stats := &DashboardStats{}

	// Get task statistics (user totals; avoid sampling)
	_, totalTasks, err := ds.taskService.ListTasks(ctx, TaskListFilters{PageSize: 1})
	if err != nil {
		return nil, fmt.Errorf("failed to get task statistics: %w", err)
	}
	stats.TotalTasks = totalTasks

	// Total per status
 	if _, completedTotal, err := ds.taskService.ListTasks(ctx, TaskListFilters{Status: models.TaskStatusCompleted, PageSize: 1}); err == nil {
	    stats.CompletedTasks = completedTotal
	} else {
	    return nil, fmt.Errorf("failed to count completed tasks: %w", err)
	}
	if _, pendingTotal, err := ds.taskService.ListTasks(ctx, TaskListFilters{Status: models.TaskStatusPending, PageSize: 1}); err == nil {
    	stats.PendingTasks = pendingTotal
	} else {
    	return nil, fmt.Errorf("failed to count pending tasks: %w", err)
	}

	// var completedCount, pendingCount int64
	// for _, task := range allTasks {
	// 	if task.Status == models.TaskStatusCompleted {
	// 		completedCount++
	// 	} else {
	// 		pendingCount++
	// 	}
	// }

	// stats.CompletedTasks = completedCount
	// stats.PendingTasks = pendingCount

	// Calculate completion rate
	if stats.TotalTasks > 0 {
		stats.CompletionRate = float64(stats.CompletedTasks) / float64(stats.TotalTasks) * 100
	}

	// Get overdue tasks count
	overdueTasks, err := ds.taskService.GetOverdueTasks(ctx)
	if err != nil {
		return nil, fmt.Errorf("failed to get overdue tasks: %w", err)
	}
	stats.OverdueTasks = int64(len(overdueTasks))

	// Get event statistics
	now := time.Now()
	endOfYear := time.Date(now.Year(), 12, 31, 23, 59, 59, 0, now.Location())
	allEvents, totalEvents, err := ds.eventService.ListEvents(ctx, EventListFilters{
		StartBefore: &endOfYear,
		PageSize:    1000,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to get event statistics: %w", err)
	}
	stats.TotalEvents = totalEvents

	// Count today's events
	today := now.Truncate(24 * time.Hour)
	tomorrow := today.AddDate(0, 0, 1)
	var todayCount, upcomingCount int64
	for _, event := range allEvents {
		if !event.StartTime.Before(today) && event.StartTime.Before(tomorrow) {
			todayCount++
		} else if event.StartTime.After(now) {
			upcomingCount++
		}
	}
	stats.TodayEvents = todayCount
	stats.UpcomingEvents = upcomingCount

	return stats, nil
}

// GetCombinedCalendarView retrieves tasks and events for calendar view (Requirement 3.2)
func (ds *DashboardService) GetCombinedCalendarView(ctx context.Context, year int, month time.Month) (*CalendarViewData, error) {
	// Validate input
	if year < 1900 || year > 2100 {
		return nil, ErrInvalidYear
	}
	if month < 1 || month > 12 {
		return nil, ErrInvalidMonth
	}

	calendarData := &CalendarViewData{
		Year:  year,
		Month: month,
	}

	// Get events for the month
	events, err := ds.eventService.GetEventsByMonth(ctx, year, month)
	if err != nil {
		return nil, fmt.Errorf("failed to get events for calendar view: %w", err)
	}
	calendarData.Events = events

	// Get tasks with due dates in the month (Requirement 3.2)
	startOfMonth := time.Date(year, month, 1, 0, 0, 0, 0, time.UTC)
	endOfMonth := startOfMonth.AddDate(0, 1, 0).Add(-time.Nanosecond)

	taskFilters := TaskListFilters{
		DueAfter:  &startOfMonth,
		DueBefore: &endOfMonth,
		PageSize:  1000, // Get all tasks for the month
	}

	tasks, _, err := ds.taskService.ListTasks(ctx, taskFilters)
	if err != nil {
		return nil, fmt.Errorf("failed to get tasks for calendar view: %w", err)
	}

	// Filter tasks that have due dates
	var tasksWithDueDates []*models.Task
	for _, task := range tasks {
		if task.DueDate != nil {
			tasksWithDueDates = append(tasksWithDueDates, task)
		}
	}
	calendarData.Tasks = tasksWithDueDates

	return calendarData, nil
}

// GetItemsByDateRange retrieves tasks and events within a specific date range (Requirement 3.3)
func (ds *DashboardService) GetItemsByDateRange(ctx context.Context, startDate, endDate time.Time) (*DateRangeData, error) {
	// Validate date range
	if endDate.Before(startDate) {
		return nil, ErrInvalidDateRange
	}

	dateRangeData := &DateRangeData{
		StartDate: startDate,
		EndDate:   endDate,
	}

	// Get events in the date range
	events, err := ds.eventService.GetEventsByDateRange(ctx, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get events by date range: %w", err)
	}
	dateRangeData.Events = events

	// Get tasks with due dates in the date range
	taskFilters := TaskListFilters{
		DueAfter:  &startDate,
		DueBefore: &endDate,
		PageSize:  1000, // Get all tasks in the range
	}

	tasks, _, err := ds.taskService.ListTasks(ctx, taskFilters)
	if err != nil {
		return nil, fmt.Errorf("failed to get tasks by date range: %w", err)
	}

	// Filter tasks that have due dates
	var tasksWithDueDates []*models.Task
	for _, task := range tasks {
		if task.DueDate != nil {
			tasksWithDueDates = append(tasksWithDueDates, task)
		}
	}
	dateRangeData.Tasks = tasksWithDueDates
	dateRangeData.Total = len(dateRangeData.Events) + len(dateRangeData.Tasks)

	return dateRangeData, nil
}

// GetCombinedCalendarItems converts tasks and events to unified calendar items for consistent display (Requirement 3.4)
func (ds *DashboardService) GetCombinedCalendarItems(ctx context.Context, startDate, endDate time.Time) ([]*CalendarItem, error) {
	// Get data for the date range
	dateRangeData, err := ds.GetItemsByDateRange(ctx, startDate, endDate)
	if err != nil {
		return nil, fmt.Errorf("failed to get items by date range: %w", err)
	}

	var calendarItems []*CalendarItem

	// Convert tasks to calendar items
	for _, task := range dateRangeData.Tasks {
		if task.DueDate != nil {
			item := &CalendarItem{
				ID:          task.ID,
				Title:       task.Title,
				Description: task.Description,
				Date:        *task.DueDate,
				Type:        "task",
				Status:      task.Status,
			}
			calendarItems = append(calendarItems, item)
		}
	}

	// Convert events to calendar items
	for _, event := range dateRangeData.Events {
		item := &CalendarItem{
			ID:          event.ID,
			Title:       event.Title,
			Description: event.Description,
			Date:        event.StartTime,
			Type:        "event",
			StartTime:   &event.StartTime,
			EndTime:     &event.EndTime,
		}
		calendarItems = append(calendarItems, item)
	}

	return calendarItems, nil
}