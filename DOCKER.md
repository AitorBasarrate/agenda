# Docker Setup

This guide covers how to run the Task Calendar Manager using Docker.

## Quick Start

### Production Mode

1. **Build and run the application:**
   ```bash
   make docker-run
   ```
   Or manually:
   ```bash
   docker compose --profile prod up --build -d
   ```

2. **Access the application:**
   - Application: http://localhost:8080
   - Health check: http://localhost:8080/health

### Development Mode

1. **Start development environment with hot reload:**
   ```bash
   make docker-dev
   ```
   Or manually:
   ```bash
   docker compose --profile dev up --build -d
   ```

2. **Access the application:**
   - Backend: http://localhost:8080
   - Frontend dev server: http://localhost:3000

## Available Commands

```bash
# Build Docker image
make docker-build

# Start production containers
make docker-run

# Start development environment
make docker-dev

# Stop containers
make docker-down

# View logs
make docker-logs

# Clean up (removes volumes and unused images)
make docker-clean
```

## Docker Images

### Production Image (`Dockerfile`)
- Multi-stage build for optimal size
- Uses distroless base image for security
- Includes compiled Go binary and built frontend
- ~20MB final image size

### Development Image (`Dockerfile.dev`)
- Includes development tools (air for hot reload)
- Mounts source code as volume
- Supports both backend and frontend hot reload
- Larger image but better for development

## Environment Variables

The following environment variables can be configured:

| Variable | Description | Default |
|----------|-------------|---------|
| `BLUEPRINT_DB_URL` | Database file path | `/data/app.db` |
| `PORT` | Server port | `8080` |
| `GIN_MODE` | Gin framework mode | `release` |

## Volumes

- `app_data`: Persistent storage for the SQLite database
- Development mode also mounts source code for hot reload

## Health Checks

The production container includes health checks that verify the application is responding on the `/health` endpoint.

## Troubleshooting

### Container won't start
```bash
# Check logs
make docker-logs

# Check if port is already in use
docker ps
netstat -tlnp | grep :8080
```

### Database issues
```bash
# Check volume permissions
docker compose exec app ls -la /data

# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up --build
```

## Security Considerations

- The production image uses distroless base for minimal attack surface
- No shell or package manager in production image
- Database stored in named volume (not in container)
- Health checks ensure application availability