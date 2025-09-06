# Database Package

This package provides database functionality for the Task and Calendar Manager application.

## Components

### Models
- `internal/models/task.go` - Task model with JSON and database tags
- `internal/models/event.go` - Event model with JSON and database tags

### Database Schema
- `schema.sql` - Complete database schema with tables and indexes
- `migrations/001_initial_schema.sql` - Initial migration file

### Migration System
- `migrations.go` - Migration service for database versioning
- `init.go` - Database initialization utilities

## Usage

### Initialize Database
```go
import "agenda/internal/database"

// Create and initialize database service
service, err := database.SetupDatabase()
if err != nil {
    log.Fatal(err)
}
defer service.Close()
```

### Run Migrations
```go
// Get database connection
db := service.GetDB()

// Create migration service
migrationService := database.NewMigrationService(db)

// Run all pending migrations
err := migrationService.RunMigrations()
if err != nil {
    log.Fatal(err)
}
```

## Database Schema

### Tasks Table
- `id` - Primary key (auto-increment)
- `title` - Task title (required)
- `description` - Task description (optional)
- `due_date` - Due date (optional)
- `status` - Task status ("pending" or "completed")
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Events Table
- `id` - Primary key (auto-increment)
- `title` - Event title (required)
- `description` - Event description (optional)
- `start_time` - Event start time (required)
- `end_time` - Event end time (required)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Indexes
- `idx_tasks_due_date` - Index on tasks.due_date
- `idx_tasks_status` - Index on tasks.status
- `idx_events_start_time` - Index on events.start_time
- `idx_events_date_range` - Composite index on events.start_time and end_time

## Migration System

The migration system tracks applied migrations in the `schema_migrations` table and ensures migrations are applied in order. Migration files should be named with a numeric prefix (e.g., `001_initial_schema.sql`) and placed in the `migrations/` directory.