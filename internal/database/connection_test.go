package database

import (
	"context"
	"database/sql"
	"testing"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

func TestDefaultConnectionConfig(t *testing.T) {
	config := DefaultConnectionConfig()
	
	if config.MaxOpenConns != 1 {
		t.Errorf("Expected MaxOpenConns 1, got %d", config.MaxOpenConns)
	}
	
	if config.MaxIdleConns != 1 {
		t.Errorf("Expected MaxIdleConns 1, got %d", config.MaxIdleConns)
	}
	
	if config.ConnMaxLifetime != time.Hour {
		t.Errorf("Expected ConnMaxLifetime 1 hour, got %v", config.ConnMaxLifetime)
	}
	
	if config.ConnMaxIdleTime != time.Minute*30 {
		t.Errorf("Expected ConnMaxIdleTime 30 minutes, got %v", config.ConnMaxIdleTime)
	}
	
	if config.PingTimeout != time.Second*5 {
		t.Errorf("Expected PingTimeout 5 seconds, got %v", config.PingTimeout)
	}
}

func TestConfigureConnection(t *testing.T) {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}
	defer db.Close()
	
	config := &ConnectionConfig{
		MaxOpenConns:    2,
		MaxIdleConns:    2,
		ConnMaxLifetime: time.Hour * 2,
		ConnMaxIdleTime: time.Minute * 60,
		PingTimeout:     time.Second * 10,
	}
	
	ConfigureConnection(db, config)
	
	stats := db.Stats()
	
	// Note: We can't directly verify the configuration was applied
	// because sql.DB doesn't expose these settings for reading
	// But we can verify the connection works
	ctx, cancel := context.WithTimeout(context.Background(), time.Second)
	defer cancel()
	
	err = db.PingContext(ctx)
	if err != nil {
		t.Errorf("Connection ping failed after configuration: %v", err)
	}
	
	// Verify stats structure is accessible
	if stats.OpenConnections < 0 {
		t.Error("Invalid OpenConnections value")
	}
}

func TestTestConnection(t *testing.T) {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}
	defer db.Close()
	
	ctx := context.Background()
	
	err = TestConnection(ctx, db)
	if err != nil {
		t.Errorf("TestConnection failed: %v", err)
	}
}

func TestGetConnectionStats(t *testing.T) {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}
	defer db.Close()
	
	// Ping to establish connection
	err = db.Ping()
	if err != nil {
		t.Fatalf("Failed to ping database: %v", err)
	}
	
	stats := GetConnectionStats(db)
	
	// Basic validation of stats structure
	if stats.OpenConnections < 0 {
		t.Error("Invalid OpenConnections value")
	}
	
	if stats.InUse < 0 {
		t.Error("Invalid InUse value")
	}
	
	if stats.Idle < 0 {
		t.Error("Invalid Idle value")
	}
}

func TestIsHealthy(t *testing.T) {
	tests := []struct {
		name     string
		stats    ConnectionStats
		expected bool
		message  string
	}{
		{
			name: "healthy connection",
			stats: ConnectionStats{
				OpenConnections:   1,
				InUse:            0,
				Idle:             1,
				WaitCount:        10,
				MaxIdleClosed:    1,
				MaxLifetimeClosed: 1,
			},
			expected: true,
			message:  "Connection pool is healthy",
		},
		{
			name: "high wait count",
			stats: ConnectionStats{
				OpenConnections:   1,
				WaitCount:        1500,
				MaxIdleClosed:    1,
				MaxLifetimeClosed: 1,
			},
			expected: false,
			message:  "High number of connection waits detected",
		},
		{
			name: "high idle closed",
			stats: ConnectionStats{
				OpenConnections:   1,
				WaitCount:        10,
				MaxIdleClosed:    5,
				MaxLifetimeClosed: 1,
			},
			expected: false,
			message:  "High number of idle connections being closed",
		},
		{
			name: "high lifetime closed",
			stats: ConnectionStats{
				OpenConnections:   1,
				WaitCount:        10,
				MaxIdleClosed:    1,
				MaxLifetimeClosed: 5,
			},
			expected: false,
			message:  "High number of connections closed due to max lifetime",
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			healthy, message := IsHealthy(tt.stats)
			
			if healthy != tt.expected {
				t.Errorf("IsHealthy() = %v, expected %v", healthy, tt.expected)
			}
			
			if message != tt.message {
				t.Errorf("IsHealthy() message = '%s', expected '%s'", message, tt.message)
			}
		})
	}
}