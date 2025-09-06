package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"time"

	_ "github.com/mattn/go-sqlite3"
	_ "github.com/joho/godotenv/autoload"
)

// Service represents a service that interacts with a database.
type Service interface {
	// Health returns a map of health status information.
	// The keys and values in the map are service-specific.
	Health() map[string]string

	// Close terminates the database connection.
	// It returns an error if the connection cannot be closed.
	Close() error

	// GetDB returns the underlying database connection
	GetDB() *sql.DB

	// Initialize sets up the database schema and runs migrations
	Initialize() error

	// Ping checks if the database connection is alive
	Ping(ctx context.Context) error

	// WithTransaction executes a function within a database transaction
	WithTransaction(ctx context.Context, fn func(tx *sql.Tx) error) error

	// GetRepository returns a new repository instance
	GetRepository() TransactionRepository
}

type service struct {
	db *sql.DB
}

var (
	dburl = os.Getenv("BLUEPRINT_DB_URL")
	dbInstance *service
)

func New() Service {
	// Reuse Connection
	if dbInstance != nil {
		return dbInstance
	}

	db, err := sql.Open("sqlite3", dburl)
	if err != nil {
		// This will not be a connection error, but a DSN parse error or
		// another initialization error.
		log.Fatal(err)
	}

	// Configure connection pool settings
	configureConnectionPool(db)

	// Test the connection
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	
	if err := db.PingContext(ctx); err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}

	dbInstance = &service{
		db: db,
	}
	return dbInstance
}

// configureConnectionPool sets up optimal connection pool settings for SQLite
func configureConnectionPool(db *sql.DB) {
	// SQLite doesn't benefit from multiple connections due to its file-based nature
	// Set max open connections to 1 to avoid database locked errors
	db.SetMaxOpenConns(1)
	
	// Set max idle connections
	db.SetMaxIdleConns(1)
	
	// Set connection lifetime
	db.SetConnMaxLifetime(time.Hour)
	
	// Set connection idle time
	db.SetConnMaxIdleTime(time.Minute * 30)
}

// GetDB returns the underlying database connection
func (s *service) GetDB() *sql.DB {
	return s.db
}

// Initialize sets up the database schema and runs migrations
func (s *service) Initialize() error {
	migrationService := NewMigrationService(s.db)
	return migrationService.RunMigrations()
}

// Health checks the health of the database connection by pinging the database.
// It returns a map with keys indicating various health statistics.
func (s *service) Health() map[string]string {
	ctx, cancel := context.WithTimeout(context.Background(), 1*time.Second)
	defer cancel()

	stats := make(map[string]string)

	// Ping the database
	err := s.db.PingContext(ctx)
	if err != nil {
		stats["status"] = "down"
		stats["error"] = fmt.Sprintf("db down: %v", err)
		log.Fatalf("db down: %v", err)  // Log the error and terminate the program
		return stats
	}

	// Database is up, add more statistics
	stats["status"] = "up"
	stats["message"] = "It's healthy"

	// Get database stats (like open connections, in use, idle, etc.)
	dbStats := s.db.Stats()
	stats["open_connections"] = strconv.Itoa(dbStats.OpenConnections)
	stats["in_use"] = strconv.Itoa(dbStats.InUse)
	stats["idle"] = strconv.Itoa(dbStats.Idle)
	stats["wait_count"] = strconv.FormatInt(dbStats.WaitCount, 10)
	stats["wait_duration"] = dbStats.WaitDuration.String()
	stats["max_idle_closed"] = strconv.FormatInt(dbStats.MaxIdleClosed, 10)
	stats["max_lifetime_closed"] = strconv.FormatInt(dbStats.MaxLifetimeClosed, 10)

	// Evaluate stats to provide a health message
	if dbStats.OpenConnections > 40 { // Assuming 50 is the max for this example
		stats["message"] = "The database is experiencing heavy load."
	}

	if dbStats.WaitCount > 1000 {
		stats["message"] = "The database has a high number of wait events, indicating potential bottlenecks."
	}

	if dbStats.MaxIdleClosed > int64(dbStats.OpenConnections)/2 {
		stats["message"] = "Many idle connections are being closed, consider revising the connection pool settings."
	}

	if dbStats.MaxLifetimeClosed > int64(dbStats.OpenConnections)/2 {
		stats["message"] = "Many connections are being closed due to max lifetime, consider increasing max lifetime or revising the connection usage pattern."
	}

	return stats
}

// Close closes the database connection.
// It logs a message indicating the disconnection from the specific database.
// If the connection is successfully closed, it returns nil.
// If an error occurs while closing the connection, it returns the error.
func (s *service) Close() error {
	log.Printf("Disconnected from database: %s", dburl)
	return s.db.Close()
}

// Ping checks if the database connection is alive
func (s *service) Ping(ctx context.Context) error {
	return s.db.PingContext(ctx)
}

// WithTransaction executes a function within a database transaction
func (s *service) WithTransaction(ctx context.Context, fn func(tx *sql.Tx) error) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}
	
	defer func() {
		if p := recover(); p != nil {
			if rollbackErr := tx.Rollback(); rollbackErr != nil {
				log.Printf("Failed to rollback transaction after panic: %v", rollbackErr)
			}
			panic(p)
		} else if err != nil {
			if rollbackErr := tx.Rollback(); rollbackErr != nil {
				log.Printf("Failed to rollback transaction: %v", rollbackErr)
			}
		} else {
			if commitErr := tx.Commit(); commitErr != nil {
				err = fmt.Errorf("failed to commit transaction: %w", commitErr)
			}
		}
	}()
	
	err = fn(tx)
	return err
}

// GetRepository returns a new repository instance
func (s *service) GetRepository() TransactionRepository {
	return NewRepository(s.db)
}
