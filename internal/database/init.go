package database

import (
	"database/sql"
	"log"
)

// InitializeDatabase sets up the database with the required schema
func InitializeDatabase(db *sql.DB) error {
	migrationService := NewMigrationService(db)
	if err := migrationService.RunMigrations(); err != nil {
		return err
	}
	
	log.Println("Database initialized successfully")
	return nil
}

// SetupDatabase is a convenience function to create and initialize the database
func SetupDatabase() (Service, error) {
	service := New()
	if err := service.Initialize(); err != nil {
		return nil, err
	}
	return service, nil
}