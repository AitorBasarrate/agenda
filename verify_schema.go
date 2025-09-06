package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"

	"agenda/internal/database"
	_ "github.com/mattn/go-sqlite3"
)

func main() {
	// Create a test database
	dbFile := "verify_test.db"
	defer os.Remove(dbFile)

	db, err := sql.Open("sqlite3", dbFile)
	if err != nil {
		log.Fatalf("Failed to open database: %v", err)
	}
	defer db.Close()

	// Test migration system
	migrationService := database.NewMigrationService(db)
	err = migrationService.RunMigrations()
	if err != nil {
		log.Fatalf("Failed to run migrations: %v", err)
	}

	// Verify tables exist
	tables := []string{"tasks", "events", "schema_migrations"}
	for _, table := range tables {
		var count int
		query := "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?"
		err := db.QueryRow(query, table).Scan(&count)
		if err != nil {
			log.Fatalf("Failed to check table %s: %v", table, err)
		}
		if count == 1 {
			fmt.Printf("✓ Table %s created successfully\n", table)
		} else {
			fmt.Printf("✗ Table %s not found\n", table)
		}
	}

	// Verify indexes exist
	indexes := []string{"idx_tasks_due_date", "idx_tasks_status", "idx_events_start_time", "idx_events_date_range"}
	for _, index := range indexes {
		var count int
		query := "SELECT COUNT(*) FROM sqlite_master WHERE type='index' AND name=?"
		err := db.QueryRow(query, index).Scan(&count)
		if err != nil {
			log.Fatalf("Failed to check index %s: %v", index, err)
		}
		if count == 1 {
			fmt.Printf("✓ Index %s created successfully\n", index)
		} else {
			fmt.Printf("✗ Index %s not found\n", index)
		}
	}

	fmt.Println("\nDatabase schema verification completed!")
}