package database

import (
	"context"
	"database/sql"
	"testing"
	"time"

	_ "github.com/mattn/go-sqlite3"
)

// TestModel represents a simple model for testing
type TestModel struct {
	ID        int       `db:"id"`
	Name      string    `db:"name"`
	Email     string    `db:"email"`
	CreatedAt time.Time `db:"created_at"`
}

// setupTestDB creates an in-memory SQLite database for testing
func setupTestDB(t *testing.T) *sql.DB {
	db, err := sql.Open("sqlite3", ":memory:")
	if err != nil {
		t.Fatalf("Failed to open test database: %v", err)
	}
	
	// Create test table
	_, err = db.Exec(`
		CREATE TABLE test_models (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			name TEXT NOT NULL,
			email TEXT NOT NULL,
			created_at DATETIME DEFAULT CURRENT_TIMESTAMP
		)
	`)
	if err != nil {
		t.Fatalf("Failed to create test table: %v", err)
	}
	
	return db
}

func TestRepository_Create(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	
	repo := NewRepository(db)
	ctx := context.Background()
	
	query := "INSERT INTO test_models (name, email) VALUES (?, ?)"
	id, err := repo.Create(ctx, query, "John Doe", "john@example.com")
	
	if err != nil {
		t.Fatalf("Create failed: %v", err)
	}
	
	if id != 1 {
		t.Errorf("Expected ID 1, got %d", id)
	}
}

func TestRepository_GetByID(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	
	repo := NewRepository(db)
	ctx := context.Background()
	
	// Insert test data
	_, err := db.Exec("INSERT INTO test_models (name, email) VALUES (?, ?)", "John Doe", "john@example.com")
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}
	
	var model TestModel
	query := "SELECT id, name, email, created_at FROM test_models WHERE id = ?"
	err = repo.GetByID(ctx, &model, query, 1)
	
	if err != nil {
		t.Fatalf("GetByID failed: %v", err)
	}
	
	if model.Name != "John Doe" {
		t.Errorf("Expected name 'John Doe', got '%s'", model.Name)
	}
	
	if model.Email != "john@example.com" {
		t.Errorf("Expected email 'john@example.com', got '%s'", model.Email)
	}
}

func TestRepository_Update(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	
	repo := NewRepository(db)
	ctx := context.Background()
	
	// Insert test data
	_, err := db.Exec("INSERT INTO test_models (name, email) VALUES (?, ?)", "John Doe", "john@example.com")
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}
	
	query := "UPDATE test_models SET name = ?, email = ? WHERE id = ?"
	err = repo.Update(ctx, query, "Jane Doe", "jane@example.com", 1)
	
	if err != nil {
		t.Fatalf("Update failed: %v", err)
	}
	
	// Verify update
	var name, email string
	err = db.QueryRow("SELECT name, email FROM test_models WHERE id = 1").Scan(&name, &email)
	if err != nil {
		t.Fatalf("Failed to verify update: %v", err)
	}
	
	if name != "Jane Doe" {
		t.Errorf("Expected name 'Jane Doe', got '%s'", name)
	}
	
	if email != "jane@example.com" {
		t.Errorf("Expected email 'jane@example.com', got '%s'", email)
	}
}

func TestRepository_Delete(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	
	repo := NewRepository(db)
	ctx := context.Background()
	
	// Insert test data
	_, err := db.Exec("INSERT INTO test_models (name, email) VALUES (?, ?)", "John Doe", "john@example.com")
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}
	
	query := "DELETE FROM test_models WHERE id = ?"
	err = repo.Delete(ctx, query, 1)
	
	if err != nil {
		t.Fatalf("Delete failed: %v", err)
	}
	
	// Verify deletion
	var count int
	err = db.QueryRow("SELECT COUNT(*) FROM test_models WHERE id = 1").Scan(&count)
	if err != nil {
		t.Fatalf("Failed to verify deletion: %v", err)
	}
	
	if count != 0 {
		t.Errorf("Expected count 0, got %d", count)
	}
}

func TestRepository_Count(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	
	repo := NewRepository(db)
	ctx := context.Background()
	
	// Insert test data
	_, err := db.Exec("INSERT INTO test_models (name, email) VALUES (?, ?)", "John Doe", "john@example.com")
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}
	
	query := "SELECT COUNT(*) FROM test_models"
	count, err := repo.Count(ctx, query)
	
	if err != nil {
		t.Fatalf("Count failed: %v", err)
	}
	
	if count != 1 {
		t.Errorf("Expected count 1, got %d", count)
	}
}

func TestRepository_Exists(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	
	repo := NewRepository(db)
	ctx := context.Background()
	
	// Insert test data
	_, err := db.Exec("INSERT INTO test_models (name, email) VALUES (?, ?)", "John Doe", "john@example.com")
	if err != nil {
		t.Fatalf("Failed to insert test data: %v", err)
	}
	
	query := "SELECT EXISTS(SELECT 1 FROM test_models WHERE id = ?)"
	exists, err := repo.Exists(ctx, query, 1)
	
	if err != nil {
		t.Fatalf("Exists failed: %v", err)
	}
	
	if !exists {
		t.Error("Expected record to exist")
	}
	
	// Test non-existent record
	exists, err = repo.Exists(ctx, query, 999)
	if err != nil {
		t.Fatalf("Exists failed for non-existent record: %v", err)
	}
	
	if exists {
		t.Error("Expected record to not exist")
	}
}

func TestRepository_WithTransaction(t *testing.T) {
	db := setupTestDB(t)
	defer db.Close()
	
	repo := NewRepository(db)
	ctx := context.Background()
	
	// Test successful transaction
	err := repo.WithTransaction(ctx, func(tx *sql.Tx) error {
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
	
	// Test failed transaction (should rollback)
	err = repo.WithTransaction(ctx, func(tx *sql.Tx) error {
		_, err := tx.Exec("INSERT INTO test_models (name, email) VALUES (?, ?)", "Jane Doe", "jane@example.com")
		if err != nil {
			return err
		}
		// Force an error to trigger rollback
		return sql.ErrTxDone
	})
	
	if err == nil {
		t.Fatal("Expected transaction to fail")
	}
	
	// Verify rollback - count should still be 1
	err = db.QueryRow("SELECT COUNT(*) FROM test_models").Scan(&count)
	if err != nil {
		t.Fatalf("Failed to verify rollback: %v", err)
	}
	
	if count != 1 {
		t.Errorf("Expected count 1 after rollback, got %d", count)
	}
}