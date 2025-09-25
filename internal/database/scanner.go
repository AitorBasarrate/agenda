package database

import (
	"database/sql"
	"fmt"
	"reflect"
)

// scanRow scans a single row into a destination struct
func scanRow(row *sql.Row, dest interface{}) error {
	// Get reflection info about the destination
	destValue := reflect.ValueOf(dest)
	if destValue.Kind() != reflect.Ptr {
		return fmt.Errorf("destination must be a pointer")
	}
	
	destValue = destValue.Elem()
	if destValue.Kind() != reflect.Struct {
		return fmt.Errorf("destination must be a pointer to a struct")
	}
	
	// Get field pointers for scanning
	fields := getStructFields(destValue)
	
	// Scan the row
	return row.Scan(fields...)
}

// scanRows scans multiple rows into a slice of structs
func scanRows(rows *sql.Rows, dest interface{}) error {
	// Get reflection info about the destination slice
	destValue := reflect.ValueOf(dest)
	if destValue.Kind() != reflect.Ptr {
		return fmt.Errorf("destination must be a pointer")
	}
	
	destValue = destValue.Elem()
	if destValue.Kind() != reflect.Slice {
		return fmt.Errorf("destination must be a pointer to a slice")
	}
	
	// Get the element type of the slice
	elemType := destValue.Type().Elem()
	
	// Create a new slice to hold results
	results := reflect.MakeSlice(destValue.Type(), 0, 0)
	
	for rows.Next() {
		var elem reflect.Value
		var fields []interface{}
		
		// Handle pointer types vs value types
		if elemType.Kind() == reflect.Ptr {
			// For pointer types, create a new instance and get its fields
			elem = reflect.New(elemType.Elem())
			fields = getStructFields(elem.Elem())
		} else {
			// For value types, create a new instance directly
			elem = reflect.New(elemType).Elem()
			fields = getStructFields(elem)
		}
		
		// Scan the row
		if err := rows.Scan(fields...); err != nil {
			return err
		}
		
		// Append to results
		results = reflect.Append(results, elem)
	}
	
	// Set the destination slice to our results
	destValue.Set(results)
	
	return rows.Err()
}

// getStructFields returns pointers to struct fields for scanning
func getStructFields(structValue reflect.Value) []interface{} {
	var fields []interface{}
	
	structType := structValue.Type()
	for i := 0; i < structValue.NumField(); i++ {
		field := structValue.Field(i)
		fieldType := structType.Field(i)
		
		// Skip unexported fields
		if !field.CanSet() {
			continue
		}
		
		// Check for db tag to determine if field should be scanned
		dbTag := fieldType.Tag.Get("db")
		if dbTag == "-" {
			continue
		}
		
		// Add field pointer to scan targets
		fields = append(fields, field.Addr().Interface())
	}
	
	return fields
}