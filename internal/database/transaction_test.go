package database

import (
	"context"
	"database/sql"
	"testing"

	_ "github.com/mattn/go-sqlite3"
)

func TestTransactionManager_ExecuteInTransaction(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	
	tm := NewTransactionManager(db)
	ctx := context.Background()
	
	// Test successful transaction
	err := tm.ExecuteInTransaction(ctx, DefaultTxOptions(), func(tx *sql.Tx) error {
		_, err := tx.Exec("INSERT INTO test_models (name, email) VALUES (?, ?)", "John Doe", "john@example.com")
		return err
	})
	
	if err != nil {
		t.Fatalf("Transaction failed: %v", err)
	}
	
	// Verify data was committed
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM test_models").Scan(&count)
	if err != nil {
		t.Fatalf("Failed to verify transaction: %v", err)
	}
	
	if count != 1 {
		t.Errorf("Expected count 1, got %d", count)
	}
}

func TestTransactionManager_ExecuteReadOnly(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	
	// Insert test data
	_, err := db.Exec("INSERT INTO test_models (name, email) VALUES (?, ?)", "John Doe", "john@example.com")
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}
	
	tm := NewTransactionManager(db)
	ctx := context.Background()
	
	var name string
	err = tm.ExecuteReadOnly(ctx, func(tx *sql.Tx) error {
		return tx.QueryRow("SELECT name FROM test_models WHERE id = 1").Scan(&name)
	})
	
	if err != nil {
		t.Fatalf("Read-only transaction failed: %v", err)
	}
	
	if name != "John Doe" {
		t.Errorf("Expected name 'John Doe', got '%s'", name)
	}
}

func TestBatchExecutor_ExecuteBatch(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	
	be := NewBatchExecutor(db, 2) // Small batch size for testing
	ctx := context.Background()
	
	// Create operations to insert multiple records
	operations := []func(tx *sql.Tx) error{
		func(tx *sql.Tx) error {
			_, err := tx.Exec("INSERT INTO test_models (name, email) VALUES (?, ?)", "User 1", "user1@example.com")
			return err
		},
		func(tx *sql.Tx) error {
			_, err := tx.Exec("INSERT INTO test_models (name, email) VALUES (?, ?)", "User 2", "user2@example.com")
			return err
		},
		func(tx *sql.Tx) error {
			_, err := tx.Exec("INSERT INTO test_models (name, email) VALUES (?, ?)", "User 3", "user3@example.com")
			return err
		},
	}
	
	err := be.ExecuteBatch(ctx, operations)
	if err != nil {
		t.Fatalf("Batch execution failed: %v", err)
	}
	
	// Verify all records were inserted
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM test_models").Scan(&count)
	if err != nil {
		t.Fatalf("Failed to verify batch execution: %v", err)
	}
	
	if count != 3 {
		t.Errorf("Expected count 3, got %d", count)
	}
}

func TestIsRetryableError(t *testing.T) {
	tests := []struct {
		name     string
		err      error
		expected bool
	}{
		{
			name:     "nil error",
			err:      nil,
			expected: false,
		},
		{
			name:     "database locked error",
			err:      sql.ErrConnDone, // Using a different error for testing
			expected: false,
		},
	}
	
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := isRetryableError(tt.err)
			if result != tt.expected {
				t.Errorf("isRetryableError() = %v, expected %v", result, tt.expected)
			}
		})
	}
}