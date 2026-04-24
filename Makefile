# Simple Makefile for a Go project

# Build the application
all: build test-backend test-frontend

build:
	@echo "Building..."


	@CGO_ENABLED=1 GOOS=linux go build -o main cmd/api/main.go

# Run the application
run:
	@go run cmd/api/main.go &
	@pnpm -C frontend install --prefer-offline
	@pnpm -C frontend dev
# Docker operations
docker-build:
	@echo "Building Docker image..."
	@docker build -t task-calendar-manager .

docker-run:
	@echo "Starting application with Docker Compose..."
	@docker compose --profile prod up --build -d

docker-dev:
	@echo "Starting development environment..."
	@docker compose --profile dev up --build -d

docker-down:
	@echo "Stopping Docker containers..."
	@docker compose down

docker-logs:
	@docker compose logs -f

docker-clean:
	@echo "Cleaning up Docker resources..."
	@docker compose down -v
	@docker system prune -f

# Test the application
test-backend:
	@echo "Testing backend..."
	@go test ./... -v

test-frontend:
	@echo "Testing frontend..."
	@pnpm -C frontend run test

# Clean the binary
clean:
	@echo "Cleaning..."
	@rm -f main

# Live Reload
watch:
	@if command -v air > /dev/null; then \
            air; \
            echo "Watching...";\
        else \
            read -p "Go's 'air' is not installed on your machine. Do you want to install it? [Y/n] " choice; \
            if [ "$$choice" != "n" ] && [ "$$choice" != "N" ]; then \
                go install github.com/air-verse/air@latest; \
                air; \
                echo "Watching...";\
            else \
                echo "You chose not to install air. Exiting..."; \
                exit 1; \
            fi; \
        fi

.PHONY: all build run test clean watch
