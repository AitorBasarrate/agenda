package database

import (
	"context"
	"database/sql"
	"strings"
	"testing"
	"time"

	"agenda/internal/models"

	_ "github.com/mattn/go-sqlite3"
)

func setupEventTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}

	// Create events table
	schema := `
		CREATE TABLE events (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			title TEXT NOT NULL,
			description TEXT,
			start_time DATETIME NOT NULL,
			end_time DATETIME NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
			updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
		);

		CREATE INDEX idx_events_start_time ON events(start_time);
		CREATE INDEX idx_events_date_range ON events(start_time, end_time);
	`

	if _, err := db.Exec(schema); err != nil {
		t.Fatalf("Failed to create test schema: %v", err)
	}

	return db
}

func createTestEvent(title, description string, startTime, endTime time.Time) *models.Event {
	return &models.Event{
		Title:       title,
		Description: description,
		StartTime:   startTime,
		EndTime:     endTime,
	}
}

func TestEventRepository_CreateEvent(t *testing.T) {
	db := setupEventTestDB(t)
	defer db.Close()

	repo := NewEventRepository(db)
	ctx := context.Background()

	startTime := time.Now().Add(time.Hour)
	endTime := startTime.Add(2 * time.Hour)

	tests := []struct {
		name        string
		event       *models.Event
		expectError bool
		errorMsg    string
	}{
		{
			name:        "valid event",
			event:       createTestEvent("Meeting", "Team meeting", startTime, endTime),
			expectError: false,
		},
		{
			name:        "event with empty title",
			event:       createTestEvent("", "Description", startTime, endTime),
			expectError: false, // Empty string is allowed, only NULL is not
		},
		{
			name:        "event with invalid time range",
			event:       createTestEvent("Invalid", "End before start", endTime, startTime),
			expectError: true,
			errorMsg:    "invalid time range",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := repo.CreateEvent(ctx, tt.event)

			if tt.expectError {
				if err == nil {
					t.Errorf("Expected error but got none")
				}
				if tt.errorMsg != "" && err != nil {
					if !strings.Contains(err.Error(), tt.errorMsg) {
						t.Errorf("Expected error to contain '%s', got: %v", tt.errorMsg, err)
					}
				}
				return
			}

			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}

			if result.ID == 0 {
				t.Error("Expected event ID to be set")
			}

			if result.Title != tt.event.Title {
				t.Errorf("Expected title %s, got %s", tt.event.Title, result.Title)
			}

			if result.CreatedAt.IsZero() {
				t.Error("Expected CreatedAt to be set")
			}

			if result.UpdatedAt.IsZero() {
				t.Error("Expected UpdatedAt to be set")
			}
		})
	}
}

func TestEventRepository_GetEventByID(t *testing.T) {
	db := setupEventTestDB(t)
	defer db.Close()

	repo := NewEventRepository(db)
	ctx := context.Background()

	// Create a test event
	startTime := time.Now().Add(time.Hour)
	endTime := startTime.Add(2 * time.Hour)
	event := createTestEvent("Test Event", "Test Description", startTime, endTime)

	created, err := repo.CreateEvent(ctx, event)
	if err != nil {
		t.Fatalf("Failed to create test event: %v", err)
	}

	tests := []struct {
		name        string
		id          int
		expectError bool
	}{
		{
			name:        "existing event",
			id:          created.ID,
			expectError: false,
		},
		{
			name:        "non-existing event",
			id:          999,
			expectError: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := repo.GetEventByID(ctx, tt.id)

			if tt.expectError {
				if err == nil {
					t.Error("Expected error but got none")
				}
				return
			}

			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}

			if result.ID != tt.id {
				t.Errorf("Expected ID %d, got %d", tt.id, result.ID)
			}

			if result.Title != created.Title {
				t.Errorf("Expected title %s, got %s", created.Title, result.Title)
			}
		})
	}
}

func TestEventRepository_UpdateEvent(t *testing.T) {
	db := setupEventTestDB(t)
	defer db.Close()

	repo := NewEventRepository(db)
	ctx := context.Background()

	// Create a test event
	startTime := time.Now().Add(time.Hour)
	endTime := startTime.Add(2 * time.Hour)
	event := createTestEvent("Original Title", "Original Description", startTime, endTime)

	created, err := repo.CreateEvent(ctx, event)
	if err != nil {
		t.Fatalf("Failed to create test event: %v", err)
	}

	// Update the event
	created.Title = "Updated Title"
	created.Description = "Updated Description"
	newEndTime := startTime.Add(3 * time.Hour)
	created.EndTime = newEndTime

	err = repo.UpdateEvent(ctx, created)
	if err != nil {
		t.Errorf("Unexpected error updating event: %v", err)
	}

	// Verify the update
	updated, err := repo.GetEventByID(ctx, created.ID)
	if err != nil {
		t.Fatalf("Failed to get updated event: %v", err)
	}

	if updated.Title != "Updated Title" {
		t.Errorf("Expected title 'Updated Title', got %s", updated.Title)
	}

	if updated.Description != "Updated Description" {
		t.Errorf("Expected description 'Updated Description', got %s", updated.Description)
	}

	if !updated.EndTime.Equal(newEndTime) {
		t.Errorf("Expected end time %v, got %v", newEndTime, updated.EndTime)
	}
}

func TestEventRepository_UpdateEvent_InvalidTimeRange(t *testing.T) {
	db := setupEventTestDB(t)
	defer db.Close()

	repo := NewEventRepository(db)
	ctx := context.Background()

	// Create a test event
	startTime := time.Now().Add(time.Hour)
	endTime := startTime.Add(2 * time.Hour)
	event := createTestEvent("Test Event", "Test Description", startTime, endTime)

	created, err := repo.CreateEvent(ctx, event)
	if err != nil {
		t.Fatalf("Failed to create test event: %v", err)
	}

	// Try to update with invalid time range
	created.EndTime = created.StartTime.Add(-time.Hour) // End before start

	err = repo.UpdateEvent(ctx, created)
	if err == nil {
		t.Error("Expected error for invalid time range")
	}

	if !strings.Contains(err.Error(), "invalid time range") {
		t.Errorf("Expected error to contain 'invalid time range', got: %v", err)
	}
}

func TestEventRepository_DeleteEvent(t *testing.T) {
	db := setupEventTestDB(t)
	defer db.Close()

	repo := NewEventRepository(db)
	ctx := context.Background()

	// Create a test event
	startTime := time.Now().Add(time.Hour)
	endTime := startTime.Add(2 * time.Hour)
	event := createTestEvent("Test Event", "Test Description", startTime, endTime)

	created, err := repo.CreateEvent(ctx, event)
	if err != nil {
		t.Fatalf("Failed to create test event: %v", err)
	}

	// Delete the event
	err = repo.DeleteEvent(ctx, created.ID)
	if err != nil {
		t.Errorf("Unexpected error deleting event: %v", err)
	}

	// Verify deletion
	_, err = repo.GetEventByID(ctx, created.ID)
	if err == nil {
		t.Error("Expected error when getting deleted event")
	}
}

func TestEventRepository_ListEvents(t *testing.T) {
	db := setupEventTestDB(t)
	defer db.Close()

	repo := NewEventRepository(db)
	ctx := context.Background()

	// Create test events
	now := time.Now()
	events := []*models.Event{
		createTestEvent("Event 1", "Description 1", now.Add(time.Hour), now.Add(2*time.Hour)),
		createTestEvent("Event 2", "Description 2", now.Add(2*time.Hour), now.Add(3*time.Hour)),
		createTestEvent("Meeting", "Team meeting", now.Add(3*time.Hour), now.Add(4*time.Hour)),
	}

	for _, event := range events {
		_, err := repo.CreateEvent(ctx, event)
		if err != nil {
			t.Fatalf("Failed to create test event: %v", err)
		}
	}

	tests := []struct {
		name           string
		filters        EventFilters
		expectedCount  int
		expectedTitles []string
	}{
		{
			name:           "no filters",
			filters:        EventFilters{},
			expectedCount:  3,
			expectedTitles: []string{"Event 1", "Event 2", "Meeting"},
		},
		{
			name:           "filter by title",
			filters:        EventFilters{Title: "Event 1"},
			expectedCount:  1,
			expectedTitles: []string{"Event 1"},
		},
		{
			name:           "search filter",
			filters:        EventFilters{Search: "Event"},
			expectedCount:  2,
			expectedTitles: []string{"Event 1", "Event 2"},
		},
		{
			name:          "limit filter",
			filters:       EventFilters{Limit: 2},
			expectedCount: 2,
		},
		{
			name: "date range filter",
			filters: EventFilters{
				StartAfter:  &now,
				StartBefore: &[]time.Time{now.Add(2*time.Hour + 30*time.Minute)}[0],
			},
			expectedCount:  2,
			expectedTitles: []string{"Event 1", "Event 2"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			results, err := repo.ListEvents(ctx, tt.filters)
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}

			if len(results) != tt.expectedCount {
				t.Errorf("Expected %d events, got %d", tt.expectedCount, len(results))
			}

			if tt.expectedTitles != nil {
				for i, expectedTitle := range tt.expectedTitles {
					if i >= len(results) {
						t.Errorf("Expected title %s at index %d, but not enough results", expectedTitle, i)
						continue
					}
					if results[i].Title != expectedTitle {
						t.Errorf("Expected title %s at index %d, got %s", expectedTitle, i, results[i].Title)
					}
				}
			}
		})
	}
}

func TestEventRepository_CountEvents(t *testing.T) {
	db := setupEventTestDB(t)
	defer db.Close()

	repo := NewEventRepository(db)
	ctx := context.Background()

	// Create test events
	now := time.Now()
	events := []*models.Event{
		createTestEvent("Event 1", "Description 1", now.Add(time.Hour), now.Add(2*time.Hour)),
		createTestEvent("Event 2", "Description 2", now.Add(2*time.Hour), now.Add(3*time.Hour)),
		createTestEvent("Meeting", "Team meeting", now.Add(3*time.Hour), now.Add(4*time.Hour)),
	}

	for _, event := range events {
		_, err := repo.CreateEvent(ctx, event)
		if err != nil {
			t.Fatalf("Failed to create test event: %v", err)
		}
	}

	tests := []struct {
		name          string
		filters       EventFilters
		expectedCount int64
	}{
		{
			name:          "no filters",
			filters:       EventFilters{},
			expectedCount: 3,
		},
		{
			name:          "filter by title",
			filters:       EventFilters{Title: "Event 1"},
			expectedCount: 1,
		},
		{
			name:          "search filter",
			filters:       EventFilters{Search: "Event"},
			expectedCount: 2,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			count, err := repo.CountEvents(ctx, tt.filters)
			if err != nil {
				t.Errorf("Unexpected error: %v", err)
				return
			}

			if count != tt.expectedCount {
				t.Errorf("Expected count %d, got %d", tt.expectedCount, count)
			}
		})
	}
}

func TestEventRepository_GetEventsByDateRange(t *testing.T) {
	db := setupEventTestDB(t)
	defer db.Close()

	repo := NewEventRepository(db)
	ctx := context.Background()

	// Create test events
	now := time.Now()
	events := []*models.Event{
		createTestEvent("Event 1", "Description 1", now.Add(time.Hour), now.Add(2*time.Hour)),
		createTestEvent("Event 2", "Description 2", now.Add(25*time.Hour), now.Add(26*time.Hour)), // Next day
		createTestEvent("Event 3", "Description 3", now.Add(49*time.Hour), now.Add(50*time.Hour)), // Day after
	}

	for _, event := range events {
		_, err := repo.CreateEvent(ctx, event)
		if err != nil {
			t.Fatalf("Failed to create test event: %v", err)
		}
	}

	// Test date range query
	startDate := now
	endDate := now.Add(30 * time.Hour) // Should include first two events

	results, err := repo.GetEventsByDateRange(ctx, startDate, endDate)
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	if len(results) != 2 {
		t.Errorf("Expected 2 events in date range, got %d", len(results))
	}

	expectedTitles := []string{"Event 1", "Event 2"}
	for i, expectedTitle := range expectedTitles {
		if i >= len(results) {
			t.Errorf("Expected title %s at index %d, but not enough results", expectedTitle, i)
			continue
		}
		if results[i].Title != expectedTitle {
			t.Errorf("Expected title %s at index %d, got %s", expectedTitle, i, results[i].Title)
		}
	}
}

func TestEventRepository_GetEventsByMonth(t *testing.T) {
	db := setupEventTestDB(t)
	defer db.Close()

	repo := NewEventRepository(db)
	ctx := context.Background()

	// Create test events for different months
	jan2024 := time.Date(2024, time.January, 15, 10, 0, 0, 0, time.UTC)
	feb2024 := time.Date(2024, time.February, 15, 10, 0, 0, 0, time.UTC)

	events := []*models.Event{
		createTestEvent("January Event", "Description", jan2024, jan2024.Add(time.Hour)),
		createTestEvent("February Event", "Description", feb2024, feb2024.Add(time.Hour)),
		// Event spanning across months
		createTestEvent("Spanning Event", "Description", 
			time.Date(2024, time.January, 31, 23, 0, 0, 0, time.UTC),
			time.Date(2024, time.February, 1, 1, 0, 0, 0, time.UTC)),
	}

	for _, event := range events {
		_, err := repo.CreateEvent(ctx, event)
		if err != nil {
			t.Fatalf("Failed to create test event: %v", err)
		}
	}

	// Test January 2024
	results, err := repo.GetEventsByMonth(ctx, 2024, time.January)
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	if len(results) != 2 { // January Event + Spanning Event
		t.Errorf("Expected 2 events for January 2024, got %d", len(results))
	}

	// Test February 2024
	results, err = repo.GetEventsByMonth(ctx, 2024, time.February)
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	if len(results) != 2 { // February Event + Spanning Event
		t.Errorf("Expected 2 events for February 2024, got %d", len(results))
	}
}

func TestEventRepository_GetEventsByDay(t *testing.T) {
	db := setupEventTestDB(t)
	defer db.Close()

	repo := NewEventRepository(db)
	ctx := context.Background()

	// Create test events for specific day
	targetDate := time.Date(2024, time.January, 15, 0, 0, 0, 0, time.UTC)
	otherDate := time.Date(2024, time.January, 16, 0, 0, 0, 0, time.UTC)

	events := []*models.Event{
		createTestEvent("Morning Event", "Description", 
			targetDate.Add(9*time.Hour), targetDate.Add(10*time.Hour)),
		createTestEvent("Evening Event", "Description", 
			targetDate.Add(18*time.Hour), targetDate.Add(19*time.Hour)),
		createTestEvent("Other Day Event", "Description", 
			otherDate.Add(10*time.Hour), otherDate.Add(11*time.Hour)),
		// Event spanning across days
		createTestEvent("Spanning Event", "Description", 
			targetDate.Add(23*time.Hour), targetDate.Add(25*time.Hour)),
	}

	for _, event := range events {
		_, err := repo.CreateEvent(ctx, event)
		if err != nil {
			t.Fatalf("Failed to create test event: %v", err)
		}
	}

	// Test target date
	results, err := repo.GetEventsByDay(ctx, targetDate)
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	if len(results) != 3 { // Morning, Evening, and Spanning events
		t.Errorf("Expected 3 events for target date, got %d", len(results))
	}

	// Test other date
	results, err = repo.GetEventsByDay(ctx, otherDate)
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	if len(results) != 2 { // Other Day Event + Spanning Event
		t.Errorf("Expected 2 events for other date, got %d", len(results))
	}
}

func TestEventRepository_GetUpcomingEvents(t *testing.T) {
	db := setupEventTestDB(t)
	defer db.Close()

	repo := NewEventRepository(db)
	ctx := context.Background()

	// Create test events
	now := time.Now()
	events := []*models.Event{
		createTestEvent("Past Event", "Description", now.Add(-2*time.Hour), now.Add(-time.Hour)),
		createTestEvent("Future Event 1", "Description", now.Add(time.Hour), now.Add(2*time.Hour)),
		createTestEvent("Future Event 2", "Description", now.Add(3*time.Hour), now.Add(4*time.Hour)),
		createTestEvent("Future Event 3", "Description", now.Add(5*time.Hour), now.Add(6*time.Hour)),
	}

	for _, event := range events {
		_, err := repo.CreateEvent(ctx, event)
		if err != nil {
			t.Fatalf("Failed to create test event: %v", err)
		}
	}

	// Test upcoming events with limit
	results, err := repo.GetUpcomingEvents(ctx, 2)
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	if len(results) != 2 {
		t.Errorf("Expected 2 upcoming events, got %d", len(results))
	}

	// Verify they are in chronological order
	if len(results) >= 2 {
		if results[0].StartTime.After(results[1].StartTime) {
			t.Error("Expected events to be ordered by start time")
		}
	}

	// Verify no past events are included
	for _, event := range results {
		if event.StartTime.Before(now) {
			t.Errorf("Found past event in upcoming results: %s", event.Title)
		}
	}
}

func TestEventRepository_GetEventsByTitle(t *testing.T) {
	db := setupEventTestDB(t)
	defer db.Close()

	repo := NewEventRepository(db)
	ctx := context.Background()

	// Create test events
	now := time.Now()
	events := []*models.Event{
		createTestEvent("Meeting", "Team meeting", now.Add(time.Hour), now.Add(2*time.Hour)),
		createTestEvent("Meeting", "Client meeting", now.Add(3*time.Hour), now.Add(4*time.Hour)),
		createTestEvent("Workshop", "Training workshop", now.Add(5*time.Hour), now.Add(6*time.Hour)),
	}

	for _, event := range events {
		_, err := repo.CreateEvent(ctx, event)
		if err != nil {
			t.Fatalf("Failed to create test event: %v", err)
		}
	}

	// Test getting events by title
	results, err := repo.GetEventsByTitle(ctx, "Meeting")
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	if len(results) != 2 {
		t.Errorf("Expected 2 events with title 'Meeting', got %d", len(results))
	}

	for _, event := range results {
		if event.Title != "Meeting" {
			t.Errorf("Expected title 'Meeting', got %s", event.Title)
		}
	}

	// Test non-existing title
	results, err = repo.GetEventsByTitle(ctx, "NonExisting")
	if err != nil {
		t.Errorf("Unexpected error: %v", err)
	}

	if len(results) != 0 {
		t.Errorf("Expected 0 events for non-existing title, got %d", len(results))
	}
}

