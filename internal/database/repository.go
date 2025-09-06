package database

import (
	"context"
	"database/sql"
)

// BaseRepository defines common CRUD operations that all repositories should implement
type BaseRepository interface {
	// Create inserts a new record and returns the generated ID
	Create(ctx context.Context, query string, args ...interface{}) (int64, error)
	
	// GetByID retrieves a single record by its ID
	GetByID(ctx context.Context, dest interface{}, query string, id interface{}) error
	
	// Update modifies an existing record
	Update(ctx context.Context, query string, args ...interface{}) error
	
	// Delete removes a record by ID
	Delete(ctx context.Context, query string, id interface{}) error
	
	// List retrieves multiple records with optional filtering
	List(ctx context.Context, dest interface{}, query string, args ...interface{}) error
	
	// Count returns the total number of records matching the criteria
	Count(ctx context.Context, query string, args ...interface{}) (int64, error)
	
	// Exists checks if a record exists
	Exists(ctx context.Context, query string, args ...interface{}) (bool, error)
}

// TransactionRepository extends BaseRepository with transaction support
type TransactionRepository interface {
	BaseRepository
	
	// WithTransaction executes a function within a database transaction
	WithTransaction(ctx context.Context, fn func(tx *sql.Tx) error) error
	
	// BeginTx starts a new transaction
	BeginTx(ctx context.Context) (*sql.Tx, error)
}

// Repository provides the base implementation for database operations
type Repository struct {
	db *sql.DB
}

// NewRepository creates a new repository instance
func NewRepository(db *sql.DB) *Repository {
	return &Repository{
		db: db,
	}
}

// Create inserts a new record and returns the generated ID
func (r *Repository) Create(ctx context.Context, query string, args ...interface{}) (int64, error) {
	result, err := r.db.ExecContext(ctx, query, args...)
	if err != nil {
		return 0, err
	}
	
	id, err := result.LastInsertId()
	if err != nil {
		return 0, err
	}
	
	return id, nil
}

// GetByID retrieves a single record by its ID
func (r *Repository) GetByID(ctx context.Context, dest interface{}, query string, id interface{}) error {
	row := r.db.QueryRowContext(ctx, query, id)
	return scanRow(row, dest)
}

// Update modifies an existing record
func (r *Repository) Update(ctx context.Context, query string, args ...interface{}) error {
	_, err := r.db.ExecContext(ctx, query, args...)
	return err
}

// Delete removes a record by ID
func (r *Repository) Delete(ctx context.Context, query string, id interface{}) error {
	_, err := r.db.ExecContext(ctx, query, id)
	return err
}

// List retrieves multiple records with optional filtering
func (r *Repository) List(ctx context.Context, dest interface{}, query string, args ...interface{}) error {
	rows, err := r.db.QueryContext(ctx, query, args...)
	if err != nil {
		return err
	}
	defer rows.Close()
	
	return scanRows(rows, dest)
}

// Count returns the total number of records matching the criteria
func (r *Repository) Count(ctx context.Context, query string, args ...interface{}) (int64, error) {
	var count int64
	row := r.db.QueryRowContext(ctx, query, args...)
	err := row.Scan(&count)
	return count, err
}

// Exists checks if a record exists
func (r *Repository) Exists(ctx context.Context, query string, args ...interface{}) (bool, error) {
	var exists bool
	row := r.db.QueryRowContext(ctx, query, args...)
	err := row.Scan(&exists)
	if err == sql.ErrNoRows {
		return false, nil
	}
	return exists, err
}

// WithTransaction executes a function within a database transaction
func (r *Repository) WithTransaction(ctx context.Context, fn func(tx *sql.Tx) error) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	
	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		} else if err != nil {
			tx.Rollback()
		} else {
			err = tx.Commit()
		}
	}()
	
	err = fn(tx)
	return err
}

// BeginTx starts a new transaction
func (r *Repository) BeginTx(ctx context.Context) (*sql.Tx, error) {
	return r.db.BeginTx(ctx, nil)
}