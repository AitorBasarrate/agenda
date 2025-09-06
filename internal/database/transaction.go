package database

import (
	"context"
	"database/sql"
	"fmt"
	"log"
)

// TxOptions represents transaction options
type TxOptions struct {
	Isolation sql.IsolationLevel
	ReadOnly  bool
}

// DefaultTxOptions returns default transaction options
func DefaultTxOptions() *sql.TxOptions {
	return &sql.TxOptions{
		Isolation: sql.LevelDefault,
		ReadOnly:  false,
	}
}

// ReadOnlyTxOptions returns read-only transaction options
func ReadOnlyTxOptions() *sql.TxOptions {
	return &sql.TxOptions{
		Isolation: sql.LevelReadCommitted,
		ReadOnly:  true,
	}
}

// TransactionManager provides advanced transaction management
type TransactionManager struct {
	db *sql.DB
}

// NewTransactionManager creates a new transaction manager
func NewTransactionManager(db *sql.DB) *TransactionManager {
	return &TransactionManager{db: db}
}

// ExecuteInTransaction executes a function within a transaction with custom options
func (tm *TransactionManager) ExecuteInTransaction(ctx context.Context, opts *sql.TxOptions, fn func(tx *sql.Tx) error) error {
	if opts == nil {
		opts = DefaultTxOptions()
	}
	
	tx, err := tm.db.BeginTx(ctx, opts)
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

// ExecuteReadOnly executes a function within a read-only transaction
func (tm *TransactionManager) ExecuteReadOnly(ctx context.Context, fn func(tx *sql.Tx) error) error {
	return tm.ExecuteInTransaction(ctx, ReadOnlyTxOptions(), fn)
}

// ExecuteWithRetry executes a function within a transaction with retry logic
func (tm *TransactionManager) ExecuteWithRetry(ctx context.Context, maxRetries int, fn func(tx *sql.Tx) error) error {
	var lastErr error
	
	for attempt := 0; attempt <= maxRetries; attempt++ {
		err := tm.ExecuteInTransaction(ctx, DefaultTxOptions(), fn)
		if err == nil {
			return nil
		}
		
		lastErr = err
		
		// Check if error is retryable (e.g., database locked)
		if !isRetryableError(err) {
			break
		}
		
		if attempt < maxRetries {
			log.Printf("Transaction attempt %d failed, retrying: %v", attempt+1, err)
		}
	}
	
	return fmt.Errorf("transaction failed after %d attempts: %w", maxRetries+1, lastErr)
}

// isRetryableError determines if an error is worth retrying
func isRetryableError(err error) bool {
	// For SQLite, database locked errors are typically retryable
	if err == nil {
		return false
	}
	
	errStr := err.Error()
	return errStr == "database is locked" || errStr == "database table is locked"
}

// BatchExecutor helps execute multiple operations in batches within transactions
type BatchExecutor struct {
	tm        *TransactionManager
	batchSize int
}

// NewBatchExecutor creates a new batch executor
func NewBatchExecutor(db *sql.DB, batchSize int) *BatchExecutor {
	if batchSize <= 0 {
		batchSize = 100 // default batch size
	}
	
	return &BatchExecutor{
		tm:        NewTransactionManager(db),
		batchSize: batchSize,
	}
}

// ExecuteBatch executes operations in batches within transactions
func (be *BatchExecutor) ExecuteBatch(ctx context.Context, operations []func(tx *sql.Tx) error) error {
	for i := 0; i < len(operations); i += be.batchSize {
		end := i + be.batchSize
		if end > len(operations) {
			end = len(operations)
		}
		
		batch := operations[i:end]
		err := be.tm.ExecuteInTransaction(ctx, DefaultTxOptions(), func(tx *sql.Tx) error {
			for _, op := range batch {
				if err := op(tx); err != nil {
					return err
				}
			}
			return nil
		})
		
		if err != nil {
			return fmt.Errorf("batch execution failed at batch starting at index %d: %w", i, err)
		}
	}
	
	return nil
}