package database

import (
	"context"
	"database/sql"
	"fmt"
	"time"
)

// ConnectionConfig holds database connection configuration
type ConnectionConfig struct {
	MaxOpenConns    int
	MaxIdleConns    int
	ConnMaxLifetime time.Duration
	ConnMaxIdleTime time.Duration
	PingTimeout     time.Duration
}

// DefaultConnectionConfig returns default connection configuration for SQLite
func DefaultConnectionConfig() *ConnectionConfig {
	return &ConnectionConfig{
		MaxOpenConns:    1,  // SQLite works best with single connection
		MaxIdleConns:    1,
		ConnMaxLifetime: time.Hour,
		ConnMaxIdleTime: time.Minute * 30,
		PingTimeout:     time.Second * 5,
	}
}

// ConfigureConnection applies connection configuration to a database instance
func ConfigureConnection(db *sql.DB, config *ConnectionConfig) {
	if config == nil {
		config = DefaultConnectionConfig()
	}
	
	db.SetMaxOpenConns(config.MaxOpenConns)
	db.SetMaxIdleConns(config.MaxIdleConns)
	db.SetConnMaxLifetime(config.ConnMaxLifetime)
	db.SetConnMaxIdleTime(config.ConnMaxIdleTime)
}

// TestConnection verifies that a database connection is working
func TestConnection(ctx context.Context, db *sql.DB) error {
	if err := db.PingContext(ctx); err != nil {
		return fmt.Errorf("database ping failed: %w", err)
	}
	
	// Test a simple query
	var result int
	err := db.QueryRowContext(ctx, "SELECT 1").Scan(&result)
	if err != nil {
		return fmt.Errorf("test query failed: %w", err)
	}
	
	if result != 1 {
		return fmt.Errorf("test query returned unexpected result: %d", result)
	}
	
	return nil
}

// ConnectionStats returns detailed connection statistics
type ConnectionStats struct {
	OpenConnections     int
	InUse              int
	Idle               int
	WaitCount          int64
	WaitDuration       time.Duration
	MaxIdleClosed      int64
	MaxLifetimeClosed  int64
}

// GetConnectionStats returns current connection pool statistics
func GetConnectionStats(db *sql.DB) ConnectionStats {
	stats := db.Stats()
	return ConnectionStats{
		OpenConnections:   stats.OpenConnections,
		InUse:            stats.InUse,
		Idle:             stats.Idle,
		WaitCount:        stats.WaitCount,
		WaitDuration:     stats.WaitDuration,
		MaxIdleClosed:    stats.MaxIdleClosed,
		MaxLifetimeClosed: stats.MaxLifetimeClosed,
	}
}

// IsHealthy checks if the database connection is healthy based on statistics
func IsHealthy(stats ConnectionStats) (bool, string) {
	// Check for high wait count indicating contention
	if stats.WaitCount > 1000 {
		return false, "High number of connection waits detected"
	}
	
	// Check for excessive connection churn
	if stats.MaxIdleClosed > int64(stats.OpenConnections)*2 {
		return false, "High number of idle connections being closed"
	}
	
	if stats.MaxLifetimeClosed > int64(stats.OpenConnections)*2 {
		return false, "High number of connections closed due to max lifetime"
	}
	
	return true, "Connection pool is healthy"
}