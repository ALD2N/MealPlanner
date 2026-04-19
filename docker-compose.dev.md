# DnDMeal Development Environment Setup

## Quick Start

Get the development environment running:

```bash
# Start all services
docker-compose up

# Access services
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# MongoDB: localhost:27017
```

## Services Overview

### Frontend (Client)

- **Service**: `client`
- **Image**: Built from `client/Dockerfile` (dev target)
- **Port**: 3000
- **Framework**: React + Vite
- **Features**:
  - Hot-reload on file changes
  - TypeScript support
  - Development build with source maps
  - CSS modules and Tailwind CSS

### Backend (Server)

- **Service**: `server`
- **Image**: Built from `server/Dockerfile` (dev target)
- **Port**: 5000
- **Framework**: Express.js + Node.js
- **Features**:
  - Hot-reload with nodemon
  - TypeScript compilation
  - Full debugging capability
  - Database access via mongoose

### Database (MongoDB)

- **Service**: `mongo`
- **Image**: `mongo:6.0`
- **Port**: 27017
- **Features**:
  - Development database with auto-init
  - Health checks enabled
  - Persistent volume storage

## Environment Configuration

### Development Environment Variables

```bash
# Backend Configuration
MONGODB_URI=mongodb://mongo:27017/dndmeal  # Must use 'mongo' hostname in Docker
NODE_ENV=development
PORT=5000
JWT_SECRET=dev-secret-key                  # Safe for dev, change in production
JWT_EXPIRE=7d

# Frontend Configuration
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000

# Optional
DISCORD_WEBHOOK_URL=                        # Leave empty for development

# Docker
DOCKER_BUILDKIT=1
```

### Setup Environment

```bash
# Copy example to .env
cp .env.example .env

# Edit if needed (defaults work for development)
# vim .env
```

## Docker Compose File Structure

### Development Configuration (docker-compose.yml)

```yaml
services:
  mongo:                          # MongoDB service
    image: mongo:6.0
    container_name: dndmeal-mongo
    ports:
      - "27017:27017"            # Accessible from host for MongoDB tools
    environment:
      MONGO_INITDB_DATABASE: dndmeal
    volumes:
      - mongodb_data:/data/db    # Persistent data storage
    healthcheck:                  # Health check for dependency management
      test: echo 'db.runCommand("ping").ok' | mongosh localhost:27017/test --quiet
      interval: 10s
      timeout: 5s
      retries: 5

  server:                         # Backend service
    build:
      context: .
      dockerfile: server/Dockerfile
      target: dev                 # Use dev target for hot-reload
    container_name: dndmeal-server
    ports:
      - "5000:5000"              # Backend API
    environment:
      MONGODB_URI: mongodb://mongo:27017/dndmeal
      NODE_ENV: development
      JWT_SECRET: dev-secret-key
      DISCORD_WEBHOOK_URL: ${DISCORD_WEBHOOK_URL:-}
    depends_on:
      mongo:
        condition: service_healthy
    volumes:
      - ./server/src:/app/server/src  # Hot-reload source code
      - ./shared/src:/app/shared/src  # Hot-reload shared code
    networks:
      - dndmeal

  client:                         # Frontend service
    build:
      context: .
      dockerfile: client/Dockerfile
      target: dev                 # Use dev target for hot-reload
    container_name: dndmeal-client
    ports:
      - "3000:3000"              # Frontend dev server
    environment:
      VITE_API_URL: http://localhost:5000
      VITE_WS_URL: ws://localhost:5000
    depends_on:
      - server
    volumes:
      - ./client/src:/app/client/src  # Hot-reload source code
      - ./client/index.html:/app/client/index.html
    networks:
      - dndmeal

volumes:
  mongodb_data:                   # Named volume for persistent data

networks:
  dndmeal:
    driver: bridge              # Internal network for service communication
```

## Starting Development

### First Time Setup

```bash
# Build images and start services
docker-compose up

# Wait for "mongo exited with code 0" message
# Then services will be ready

# In another terminal, verify all services are running
docker-compose ps
```

### Subsequent Starts

```bash
# Services use cache, start quickly
docker-compose up

# Run in background
docker-compose up -d

# Reattach to logs
docker-compose logs -f
```

### Stopping Services

```bash
# Graceful shutdown (preserves data)
docker-compose down

# Stop without removing containers
docker-compose stop

# Stop and remove everything
docker-compose down -v
```

## Volume Mounts for Hot-Reload

### How It Works

Volume mounts sync source code changes to running containers:

```yaml
volumes:
  - ./client/src:/app/client/src  # Local changes appear in container
  - ./server/src:/app/server/src  # Auto-rebuild on changes
```

### Frontend Hot-Reload

When you edit `client/src/`:
1. File changes detected by Vite
2. Hot module replacement applies changes
3. Browser updates automatically (no full reload)
4. See updates instantly in http://localhost:3000

### Backend Hot-Reload

When you edit `server/src/`:
1. File changes detected by nodemon
2. TypeScript recompiles
3. Server restarts automatically
4. API changes take effect immediately

### Shared Code Changes

Changes to `shared/src/` trigger rebuilds in both client and server:

```bash
# When you edit shared code
shared/src/types.ts
  ├─> Server rebuilds
  └─> Client rebuilds
```

## Common Development Tasks

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mongo

# Last 50 lines
docker-compose logs --tail 50 server

# Grep for errors
docker-compose logs | grep -i error
```

### Execute Commands in Running Containers

```bash
# Run npm command in server
docker-compose exec server npm run test

# Run npm command in client
docker-compose exec client npm run test:ui

# MongoDB shell
docker-compose exec mongo mongosh dndmeal

# Server bash shell
docker-compose exec server bash

# Check installed dependencies
docker-compose exec server npm list
```

### Rebuild After Package Changes

If you modify `package.json`:

```bash
# Rebuild images and restart
docker-compose up --build

# Rebuild specific service
docker-compose build server
docker-compose build client
docker-compose up
```

### Rebuild Without Cache

If you encounter dependency issues:

```bash
# Force complete rebuild
docker-compose build --no-cache
docker-compose up
```

### Clear All Data and Start Fresh

```bash
# Remove containers and volumes
docker-compose down -v

# Start fresh
docker-compose up
```

### Reset Database Only

```bash
# Keep containers but reset MongoDB
docker-compose down -v
docker-compose up

# Or just recreate mongo volume
docker volume rm dndmeal_mongodb_data
docker-compose restart mongo
```

## Debugging

### View Container Process

```bash
# List processes in server container
docker-compose exec server ps aux

# Monitor resource usage
docker stats dndmeal-server dndmeal-client dndmeal-mongo
```

### Check Network Communication

```bash
# Test server from client container
docker-compose exec client curl http://server:5000/health

# Test MongoDB from server container
docker-compose exec server mongosh mongodb://mongo:27017

# Test from host
curl http://localhost:5000/health
```

### Enable Verbose Logging

```bash
# Start with debug mode
DEBUG=* docker-compose up

# Or add to environment in docker-compose.yml
environment:
  DEBUG: "express:*,mongoose:*"
```

### Inspect Container Filesystem

```bash
# Browse files in running container
docker-compose exec server ls -la /app/server/src

# Copy file from container
docker-compose exec server cat /app/package.json

# Edit file in container
docker-compose exec server vi /app/server/.env
```

## Port Configuration

### Default Ports

| Service | Port | Purpose |
|---------|------|---------|
| Client | 3000 | Frontend dev server + Vite HMR |
| Server | 5000 | Backend API |
| MongoDB | 27017 | Database |

### Change Ports

If ports are already in use:

```bash
# Edit docker-compose.yml
services:
  server:
    ports:
      - "5001:5000"      # Change host port from 5000 to 5001
  client:
    ports:
      - "3001:3000"      # Change host port from 3000 to 3001
```

Then update environment variables:

```bash
# .env
VITE_API_URL=http://localhost:5001
VITE_WS_URL=ws://localhost:5001
```

## Network Overview

### Service Communication

Services communicate through a Docker network:

```
┌─────────────────────────────────────────┐
│        Host Machine (localhost)         │
│  ┌─────────────────────────────────────┐│
│  │      Docker Network: dndmeal        ││
│  │  ┌──────────┐  ┌──────────┐        ││
│  │  │  Client  │  │  Server  │        ││
│  │  │ :3000    │  │ :5000    │        ││
│  │  └──────────┘  └──────────┘        ││
│  │       ↓          ↓                  ││
│  │  ┌──────────────────────────┐      ││
│  │  │      MongoDB             │      ││
│  │  │  mongo:27017             │      ││
│  │  └──────────────────────────┘      ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### Hostname Resolution

- From client: access server as `http://server:5000`
- From server: access mongo as `mongodb://mongo:27017`
- From host: use `localhost:PORT`

## Health Checks

### Verify Services Are Healthy

```bash
# Check container status
docker-compose ps

# Expected output:
# NAME              COMMAND                  STATUS
# dndmeal-mongo     mongod                   Up (healthy)
# dndmeal-server    npm --prefix server...   Up
# dndmeal-client    npm --prefix client...   Up
```

### Test API Endpoints

```bash
# Health check endpoint
curl http://localhost:5000/health

# Should return: {"status":"ok"}
```

### Monitor Database

```bash
# Connect to MongoDB
docker-compose exec mongo mongosh dndmeal

# In MongoDB shell:
> db.recipes.countDocuments()
> db.users.find().pretty()
> exit
```

## Performance Tips

### Memory Usage

If services are slow:

```bash
# Check resource usage
docker stats

# Increase Docker memory allocation
# Docker Desktop > Preferences > Resources > Memory
```

### Volume Mount Performance

On Docker Desktop for Mac/Windows, volume mounts can be slow:

```bash
# Use native mounts (cached)
volumes:
  - ./client/src:/app/client/src:cached
  - ./server/src:/app/server/src:cached
```

### Build Cache

Speed up rebuilds:

```bash
# Enable BuildKit (faster, better caching)
DOCKER_BUILDKIT=1 docker-compose build

# Check cache usage
docker system df
```

### Cleanup Dangling Resources

```bash
# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Complete cleanup
docker system prune -a
```

## Troubleshooting Development

### Services Won't Start

```bash
# Check logs
docker-compose logs

# Rebuild without cache
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Changes Not Appearing

```bash
# Check volume mounts
docker-compose exec server ls -la /app/server/src

# Restart container
docker-compose restart server

# Or rebuild
docker-compose up --build
```

### Port Already in Use

```bash
# Find process using port
lsof -i :5000      # macOS/Linux
netstat -ano | findstr :5000  # Windows

# Stop the process or change port in docker-compose.yml
```

### Database Connection Issues

```bash
# Check MongoDB is healthy
docker-compose ps

# Test connection from server
docker-compose exec server mongosh mongodb://mongo:27017

# Check logs
docker-compose logs mongo
```

See [DOCKER_TROUBLESHOOTING.md](./DOCKER_TROUBLESHOOTING.md) for more detailed troubleshooting.

## Quick Commands Reference

```bash
# Development workflow
docker-compose up              # Start all services
docker-compose logs -f         # View logs
docker-compose exec server bash # Shell in container
docker-compose restart server  # Restart a service
docker-compose down            # Stop services
docker-compose down -v         # Stop and remove data

# Building
docker-compose build           # Build images
docker-compose build --no-cache # Force rebuild
docker-compose up --build      # Build and start

# Debugging
docker-compose ps              # View container status
docker stats                   # Resource usage
docker-compose exec server npm test # Run tests

# Cleanup
docker system prune            # Remove unused resources
docker volume prune            # Remove unused volumes
docker image prune             # Remove unused images
```

## Next Steps

- Check [DEPLOYMENT.md](./DEPLOYMENT.md) for deployment options
- Read [DOCKER_TROUBLESHOOTING.md](./DOCKER_TROUBLESHOOTING.md) for common issues
- Review [DOCKER_QUICK_REF.md](./DOCKER_QUICK_REF.md) for command reference
- Explore [docker-compose.prod.md](./docker-compose.prod.md) for production setup

---

**Last Updated**: 2026-04-19

For development best practices and additional information, consult the main DEPLOYMENT.md guide.
