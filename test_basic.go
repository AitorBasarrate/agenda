package main

import (
	"agenda/internal/models"
	"fmt"
)

func main() {
	task := &models.Task{
		Title:  "Test",
		Status: models.TaskStatusPending,
	}
	fmt.Printf("Task: %+v\n", task)
}
