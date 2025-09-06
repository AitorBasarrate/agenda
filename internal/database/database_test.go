package database

import (
	"database/sql"
	"os"
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

func TestMigrationSystem(t *testing.T) {
	// Create a temporary database file
	dbFile := "test.db"
	defer os.Remove(dbFile)

	// Open database connection
	db, err := sql.Open("sqlite3", dbFile)
	if err != nil {
		t.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Test migration service
	migrationService := NewMigrationService(db)
	err = migrationService.RunMigrations()
	if err != nil {
		t.Fatalf("Failed to run migrations: %v", err)
	}

	// Verify tables were created
	tables := []string{"tasks", "events", "schema_migrations"}
	for _, table := range tables {
		var count int
		query := "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?"
		err := db.QueryRow(query, table).Scan(&count)
		if err != nil {
			t.Fatalf("Failed to check table %s: %v", table, err)
		}
		if count != 1 {
			t.Errorf("Table %s was not created", table)
		}
	}

	// Verify indexes were created
	indexes := []string{"idx_tasks_due_date", "idx_tasks_status", "idx_events_start_time", "idx_events_date_range"}
	for _, index := range indexes {
		var count int
		query := "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name=?"
		err := db.QueryRow(query, index).Scan(&count)
		if err != nil {
			t.Fatalf("Failed to check index %s: %v", index, err)
		}
		if count != 1 {
			t.Errorf("Index %s was not created", index)
		}
	}
}

func TestDatabaseService(t *testing.T) {
	// Set up test database URL
	originalURL := os.Getenv("BLUEPRINT_DB_URL")
	os.Setenv("BLUEPRINT_DB_URL", "test_service.db")
	defer func() {
		os.Setenv("BLUEPRINT_DB_URL", originalURL)
		os.Remove("test_service.db")
	}()

	// Create service
	service := New()
	defer service.Close()

	// Test initialization
	err := service.Initialize()
	if err != nil {
		t.Fatalf("Failed to initialize database: %v", err)
	}

	// Test health check
	health := service.Health()
	if health["status"] != "up" {
		t.Errorf("Expected status 'up', got '%s'", health["status"])
	}
}