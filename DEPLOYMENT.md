# DnDMeal Deployment Guide

## Overview

DnDMeal is a full-stack meal planning application built with React (frontend), Node.js (backend), and MongoDB (database). This guide covers deploying DnDMeal using Docker, supporting local development, staging, and production environments.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Prerequisites](#prerequisites)
3. [Configuration](#configuration)
4. [Running Locally with Docker](#running-locally-with-docker)
5. [Production Deployment](#production-deployment)
6. [Health Checks](#health-checks)
7. [Monitoring](#monitoring)
8. [Backup & Restore](#backup--restore)
9. [Troubleshooting](#troubleshooting)
10. [Support](#support)

## Quick Start

Get DnDMeal running in 5 minutes:

```bash
# 1. Clone the repository (or extract from archive)
cd DnDMeal

# 2. Create environment configuration
cp .env.example .env

# 3. Start all services
docker-compose up

# 4. Access the application
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Health Check: curl http://localhost:5000/health
```

## Prerequisites

### Required Software

- **Docker**: 20.10 or higher
  - Install: https://docs.docker.com/get-docker/
  - Verify: `docker --version`

- **Docker Compose**: 2.0 or higher
  - Usually included with Docker Desktop
  - Verify: `docker-compose --version`

### System Requirements

- **CPU**: 2+ cores recommended
- **RAM**: 2GB minimum (4GB recommended for production)
- **Disk**: 500MB for images + storage for MongoDB data
- **Network**: Internet access for image pulls, outbound for Discord webhooks (optional)

### Check Your Setup

Run the verification script:

```bash
./scripts/docker-verify.sh
```

This will check:
- Docker installation
- Docker Compose version
- Environment configuration
- Required files
- Image build capability

## Configuration

### Environment Variables

Create `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```bash
# Backend Configuration
MONGODB_URI=mongodb://mongo:27017/dndmeal  # For Docker, use 'mongo' as hostname
NODE_ENV=development                        # development | production
PORT=5000
JWT_SECRET=your-super-secret-key-change-this  # Generate a strong random string
JWT_EXPIRE=7d

# Frontend Configuration
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000

# Optional: Discord Integration
DISCORD_WEBHOOK_URL=

# Docker Optimization
DOCKER_BUILDKIT=1
```

### Environment Variable Notes

| Variable | Purpose | Development | Production |
|----------|---------|-------------|-----------|
| `MONGODB_URI` | Database connection | `mongodb://mongo:27017/dndmeal` | MongoDB Atlas URI |
| `NODE_ENV` | Runtime environment | `development` | `production` |
| `JWT_SECRET` | Token signing key | Simple key fine | MUST be strong/random |
| `VITE_API_URL` | Backend endpoint | `http://localhost:5000` | Your domain URL |
| `VITE_WS_URL` | WebSocket endpoint | `ws://localhost:5000` | Your domain URL (wss://) |
| `DISCORD_WEBHOOK_URL` | Discord notifications | Optional | Optional |

### Generating JWT Secret

Create a secure random string for production:

```bash
# Using OpenSSL
openssl rand -base64 32

# Using Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Running Locally with Docker

### Start Development Environment

```bash
# First time: build and start services
docker-compose up

# Subsequent times: just start
docker-compose up

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mongo
```

### Service Endpoints

Once running, access:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MongoDB**: localhost:27017 (internal only)
- **Health Check**: curl http://localhost:5000/health

### Common Development Tasks

#### Rebuild after package.json changes

```bash
docker-compose up --build
```

#### View container status

```bash
docker-compose ps
```

#### Stop services gracefully

```bash
docker-compose down
```

#### Stop and remove all data (reset database)

```bash
docker-compose down -v
docker-compose up
```

#### Execute command in running container

```bash
# Execute in server
docker-compose exec server npm run dev

# Execute in client
docker-compose exec client npm run dev

# MongoDB shell
docker-compose exec mongo mongosh
```

#### View file in container

```bash
docker-compose exec server cat /app/package.json
```

## Production Deployment

### Using Production Docker Compose File

```bash
# Create production environment file
cp .env.example .env.production
# Edit .env.production with production values
```

### Production Configuration Example

```bash
# .env.production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dndmeal
NODE_ENV=production
JWT_SECRET=<your-secure-random-key>
VITE_API_URL=https://yourdomain.com
VITE_WS_URL=wss://yourdomain.com
DISCORD_WEBHOOK_URL=https://discordapp.com/api/webhooks/...
```

### Deploy with Production Compose File

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services in background
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down
```

### Production Deployment Steps

1. **Prepare Server**
   - Install Docker and Docker Compose
   - Run `./scripts/docker-verify.sh`
   - Configure firewall (ports 80, 443, 5000)

2. **Setup Application**
   ```bash
   cd /var/www/dndmeal  # or your deployment directory
   git clone <repo-url> .
   cp .env.example .env.production
   # Edit .env.production with production values
   ```

3. **Deploy**
   ```bash
   # Build and start services
   docker-compose -f docker-compose.prod.yml up -d
   
   # Wait for services to be healthy
   sleep 10
   
   # Verify deployment
   curl https://yourdomain.com/health
   ```

4. **Setup Reverse Proxy (Nginx)**
   ```nginx
   # /etc/nginx/sites-available/dndmeal
   upstream backend {
       server localhost:5000;
   }
   
   server {
       listen 80;
       server_name yourdomain.com;
       
       # Redirect HTTP to HTTPS
       return 301 https://$server_name$request_uri;
   }
   
   server {
       listen 443 ssl http2;
       server_name yourdomain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       ssl_protocols TLSv1.2 TLSv1.3;
       ssl_ciphers HIGH:!aNULL:!MD5;
       
       # Frontend (served by Nginx in container)
       location / {
           proxy_pass http://localhost:80;
       }
       
       # Backend API
       location /api {
           proxy_pass http://backend;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection "upgrade";
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```

### SSL/TLS Considerations

For production, use HTTPS:

- **Option 1: Let's Encrypt (Free)**
  ```bash
  sudo apt-get install certbot python3-certbot-nginx
  sudo certbot certonly --standalone -d yourdomain.com
  ```

- **Option 2: Self-signed (Development)**
  ```bash
  openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
  ```

- **Option 3: Cloud Provider**
  - AWS Certificate Manager
  - Google Cloud Armor
  - Azure Application Gateway

## Health Checks

### Check API Health

```bash
# Basic health check
curl http://localhost:5000/health

# With verbose output
curl -v http://localhost:5000/health

# Check response code (should be 200)
curl -o /dev/null -s -w "%{http_code}\n" http://localhost:5000/health
```

### Verify Service Status

```bash
# View container status
docker-compose ps

# Check service logs for errors
docker-compose logs server | grep -i error
docker-compose logs client | grep -i error
docker-compose logs mongo | grep -i error

# Test database connection
docker-compose exec server npm run test:db

# Test API endpoints
curl http://localhost:5000/recipes  # Should return 401 (auth required)
curl http://localhost:5000/health   # Should return 200
```

### Automated Health Monitoring

Docker Compose includes health checks:

```bash
# View health status
docker-compose ps

# Sample output:
# NAME              STATUS         PORTS
# dndmeal-mongo     Up (healthy)   27017/tcp
# dndmeal-server    Up (healthy)   5000/tcp
# dndmeal-client    Up             3000/tcp
```

## Monitoring

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mongo

# Last N lines
docker-compose logs --tail 100 server

# Follow new logs only
docker-compose logs -f --tail 0 server
```

### Monitor Container Resources

```bash
# Real-time resource usage
docker stats

# One-time snapshot
docker stats --no-stream

# Watch specific containers
docker stats dndmeal-server dndmeal-client dndmeal-mongo
```

### Common Monitoring Tasks

#### Check disk usage of MongoDB volume

```bash
docker system df
```

#### Check container uptime

```bash
docker-compose ps
```

#### Monitor application metrics

For production, consider:
- **Prometheus** + **Grafana**: Metrics collection and visualization
- **ELK Stack**: Elasticsearch, Logstash, Kibana for log aggregation
- **Datadog**: Third-party monitoring and alerting
- **New Relic**: Application performance monitoring

## Backup & Restore

### Backup MongoDB Data

#### Automated daily backup

```bash
# Create backup script: scripts/backup-mongodb.sh
#!/bin/bash
BACKUP_DIR="/backups/mongodb"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

docker-compose exec -T mongo mongodump --out /dump/$TIMESTAMP
docker cp dndmeal-mongo:/dump/$TIMESTAMP $BACKUP_DIR/$TIMESTAMP

echo "Backup completed: $BACKUP_DIR/$TIMESTAMP"

# Remove backups older than 7 days
find $BACKUP_DIR -type d -mtime +7 -exec rm -rf {} \;
```

#### Manual backup

```bash
# Create backup
docker-compose exec mongo mongodump --out /dump

# Copy from container
docker cp dndmeal-mongo:/dump ./backup

# Backup to compressed file
tar -czf backup_$(date +%Y%m%d).tar.gz ./backup
```

### Restore MongoDB Data

#### From mongodump

```bash
# Copy backup into container
docker cp ./backup dndmeal-mongo:/restore

# Restore database
docker-compose exec mongo mongorestore /restore
```

#### Restore specific database

```bash
docker-compose exec mongo mongorestore --db dndmeal /dump/dndmeal
```

### Backup Other Data

#### Application files and configuration

```bash
# Backup .env and configuration
tar -czf config_backup_$(date +%Y%m%d).tar.gz .env .env.example

# Backup entire application
tar -czf dndmeal_backup_$(date +%Y%m%d).tar.gz \
  --exclude=node_modules \
  --exclude=dist \
  --exclude=.git \
  .
```

## Scaling Considerations

### Horizontal Scaling

For production with high traffic:

```yaml
# docker-compose.prod.yml with multiple server instances
version: '3.8'

services:
  server:
    deploy:
      replicas: 3
    # ... other config
```

### Load Balancing

Use Nginx as reverse proxy:

```nginx
upstream backend {
    server localhost:5000;
    server localhost:5001;
    server localhost:5002;
}

server {
    listen 443 ssl http2;
    
    location /api {
        proxy_pass http://backend;
    }
}
```

### Database Scaling

- **Read Replicas**: MongoDB replica sets
- **Clustering**: MongoDB Atlas for managed service
- **Sharding**: For very large datasets

## Troubleshooting

See [DOCKER_TROUBLESHOOTING.md](./DOCKER_TROUBLESHOOTING.md) for detailed troubleshooting guide covering:

- Port conflicts
- Volume permission issues
- Image build failures
- MongoDB connection problems
- Environment variable issues
- Network connectivity
- Memory and resource constraints

### Quick Troubleshooting

```bash
# Verify setup
./scripts/docker-verify.sh

# Clean up and restart
./scripts/docker-clean.sh
docker-compose up --build

# Check logs for errors
docker-compose logs --tail 100 | grep -i error

# Reset everything
docker-compose down -v
docker-compose up
```

## Support

### Getting Help

1. **Check Documentation**
   - [DEPLOYMENT.md](./DEPLOYMENT.md) - This file
   - [docker-compose.dev.md](./docker-compose.dev.md) - Dev setup
   - [docker-compose.prod.md](./docker-compose.prod.md) - Prod setup
   - [DOCKER_TROUBLESHOOTING.md](./DOCKER_TROUBLESHOOTING.md) - Common issues
   - [DOCKER_QUICK_REF.md](./DOCKER_QUICK_REF.md) - Quick commands

2. **Run Verification**
   ```bash
   ./scripts/docker-verify.sh
   ```

3. **Check Logs**
   ```bash
   docker-compose logs -f
   ```

4. **Useful Commands**
   - Build scripts: `./scripts/docker-build.sh`
   - Cleanup script: `./scripts/docker-clean.sh`
   - Verify setup: `./scripts/docker-verify.sh`

### Useful Links

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [React Documentation](https://react.dev/)

### Reporting Issues

When reporting issues, include:
1. Output of `./scripts/docker-verify.sh`
2. `docker-compose logs` output
3. `.env` file (without sensitive values)
4. OS and Docker version
5. What you were trying to do
6. Expected vs actual behavior

---

**Last Updated**: 2026-04-19

For the latest updates and information, check the project repository.
