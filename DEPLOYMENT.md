# Deployment Guide

This guide covers different deployment strategies for the Task Calendar Manager application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [GitHub Actions Setup](#github-actions-setup)
3. [Docker Deployment](#docker-deployment)
4. [Traditional Server Deployment](#traditional-server-deployment)
5. [Environment Variables](#environment-variables)
6. [Monitoring and Maintenance](#monitoring-and-maintenance)

## Prerequisites

- Go 1.25.1 or later
- Node.js 20 or later
- Docker (for containerized deployment)
- Git

## GitHub Actions Setup

### Required Secrets

Configure the following secrets in your GitHub repository settings:

#### Docker Hub (for container registry)
- `DOCKER_USERNAME` - Your Docker Hub username
- `DOCKER_PASSWORD` - Your Docker Hub password or access token

#### Server Deployment
- `STAGING_HOST` - Staging server hostname/IP
- `STAGING_USER` - SSH username for staging server
- `STAGING_SSH_KEY` - Private SSH key for staging server
- `STAGING_PORT` - SSH port (default: 22)
- `PRODUCTION_HOST` - Production server hostname/IP
- `PRODUCTION_USER` - SSH username for production server
- `PRODUCTION_SSH_KEY` - Private SSH key for production server
- `PRODUCTION_PORT` - SSH port (default: 22)

#### Optional
- `CODECOV_TOKEN` - For code coverage reporting
- `SLACK_WEBHOOK_URL` - For deployment notifications

### Workflow Overview

The CI/CD pipeline includes three main workflows:

1. **CI Pipeline** (`.github/workflows/ci.yml`)
   - Runs on every push and PR
   - Tests Go backend and React frontend
   - Security scanning
   - Builds and pushes Docker images

2. **Deployment** (`.github/workflows/deploy.yml`)
   - Deploys to staging on main branch pushes
   - Deploys to production on tag pushes or manual trigger
   - Includes rollback capabilities

3. **Release** (`.github/workflows/release.yml`)
   - Creates GitHub releases with binaries
   - Builds multi-platform binaries
   - Updates Docker Hub descriptions

## Docker Deployment

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd task-calendar-manager
   ```

2. **Build and run with Docker Compose:**
   ```bash
   docker-compose up -d
   ```

3. **Access the application:**
   - Application: http://localhost:8080
   - Health check: http://localhost:8080/health

### Production Docker Deployment

1. **Use the production profile:**
   ```bash
   docker-compose --profile production up -d
   ```

2. **Configure SSL certificates:**
   ```bash
   # Create SSL directory
   mkdir ssl
   
   # Add your certificates
   cp your-cert.pem ssl/cert.pem
   cp your-key.pem ssl/key.pem
   ```

### Environment Variables

Create a `.env` file:

```env
BLUEPRINT_DB_URL=/data/app.db
PORT=8080
GIN_MODE=release
```

## Traditional Server Deployment

### Server Setup

1. **Run the server setup script:**
   ```bash
   sudo ./scripts/setup-server.sh
   ```

   This script will:
   - Install required packages
   - Configure firewall and security
   - Set up nginx reverse proxy
   - Create application user and directories
   - Configure monitoring and backups

### Application Deployment

1. **Build the application:**
   ```bash
   make build
   ```

2. **Deploy using the deployment script:**
   ```bash
   sudo ./scripts/deploy.sh
   ```

### Manual Deployment Steps

If you prefer manual deployment:

1. **Create application user:**
   ```bash
   sudo useradd --system --home-dir /opt/task-calendar-manager --shell /bin/false app
   ```

2. **Create directories:**
   ```bash
   sudo mkdir -p /opt/task-calendar-manager/{data,logs}
   sudo chown -R app:app /opt/task-calendar-manager
   ```

3. **Copy application files:**
   ```bash
   sudo cp main /opt/task-calendar-manager/
   sudo cp -r frontend/dist /opt/task-calendar-manager/frontend
   sudo chown -R app:app /opt/task-calendar-manager
   ```

4. **Create systemd service:**
   ```bash
   sudo cp scripts/task-calendar-manager.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable task-calendar-manager
   sudo systemctl start task-calendar-manager
   ```

## Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `BLUEPRINT_DB_URL` | SQLite database file path | `./app.db` | No |
| `PORT` | Server port | `8080` | No |
| `GIN_MODE` | Gin framework mode | `debug` | No |

## Monitoring and Maintenance

### Health Checks

The application provides a health endpoint:
```bash
curl http://localhost:8080/health
```

### Logs

- **Docker:** `docker-compose logs -f app`
- **Systemd:** `journalctl -u task-calendar-manager -f`
- **File logs:** `/opt/task-calendar-manager/logs/`

### Database Backups

Automated backups are configured to run daily at 2 AM:
```bash
# Manual backup
sudo -u app /opt/task-calendar-manager/backup.sh

# View backup logs
sudo -u app tail -f /opt/task-calendar-manager/logs/backup.log
```

### Service Management

```bash
# Check status
sudo systemctl status task-calendar-manager

# Restart service
sudo systemctl restart task-calendar-manager

# View logs
sudo journalctl -u task-calendar-manager -f

# Stop service
sudo systemctl stop task-calendar-manager
```

### Updates

1. **Using GitHub Actions:**
   - Push to main branch for staging deployment
   - Create a tag for production deployment

2. **Manual update:**
   ```bash
   git pull origin main
   make build
   sudo ./scripts/deploy.sh
   ```

### SSL Certificate Setup (Let's Encrypt)

1. **Install Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain certificate:**
   ```bash
   sudo certbot --nginx -d your-domain.com
   ```

3. **Auto-renewal:**
   ```bash
   sudo crontab -e
   # Add: 0 12 * * * /usr/bin/certbot renew --quiet
   ```

## Troubleshooting

### Common Issues

1. **Service won't start:**
   ```bash
   sudo journalctl -u task-calendar-manager -n 50
   ```

2. **Database permission issues:**
   ```bash
   sudo chown -R app:app /opt/task-calendar-manager/data
   ```

3. **Port already in use:**
   ```bash
   sudo netstat -tlnp | grep :8080
   sudo systemctl stop <conflicting-service>
   ```

4. **Frontend not loading:**
   - Check if frontend files exist in `/opt/task-calendar-manager/frontend`
   - Verify nginx configuration
   - Check nginx error logs: `sudo tail -f /var/log/nginx/error.log`

### Performance Tuning

1. **Database optimization:**
   - Regular VACUUM operations
   - Monitor database size and query performance

2. **Nginx optimization:**
   - Enable gzip compression
   - Configure proper caching headers
   - Use HTTP/2

3. **Application optimization:**
   - Monitor memory usage
   - Configure appropriate worker processes
   - Use production build for frontend

## Security Considerations

1. **Firewall configuration**
2. **Regular security updates**
3. **SSL/TLS encryption**
4. **Database access restrictions**
5. **Log monitoring and alerting**
6. **Regular backups and disaster recovery testing**