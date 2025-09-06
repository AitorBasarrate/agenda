# Build stage for frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

# Copy package files first for better caching
COPY frontend/package*.json ./
RUN npm ci --silent

# Copy frontend source and build
COPY frontend/ ./
RUN npm run build

# Build stage for backend
FROM golang:1.25.1-alpine AS backend-builder

# Install build dependencies
RUN apk add --no-cache gcc musl-dev sqlite-dev git

WORKDIR /app

# Copy go mod files first for better caching
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY cmd/ ./cmd/
COPY internal/ ./internal/

# Build the application with optimizations
RUN CGO_ENABLED=1 GOOS=linux go build \
    -a -installsuffix cgo \
    -ldflags="-s -w -extldflags '-static'" \
    -o main cmd/api/main.go

# Final stage - use distroless for smaller, more secure image
FROM gcr.io/distroless/static-debian12:latest

# Copy the binary from builder stage
COPY --from=backend-builder /app/main /main

# Copy frontend build from frontend builder
COPY --from=frontend-builder /app/frontend/dist /frontend/dist

# Set environment variables
ENV BLUEPRINT_DB_URL=/data/app.db
ENV PORT=8080
ENV GIN_MODE=release

# Expose port
EXPOSE 8080

# Run the application
ENTRYPOINT ["/main"]