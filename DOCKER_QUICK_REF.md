# DnDMeal Docker Quick Reference

One-page command reference for common Docker and Docker Compose operations.

## Getting Started

```bash
# First time
docker-compose up

# View live logs
docker-compose logs -f

# Stop when done
docker-compose down
```

## Service Access

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web interface |
| Backend API | http://localhost:5000 | API endpoints |
| MongoDB | localhost:27017 | Database (internal) |
| Health Check | http://localhost:5000/health | Status check |

## Essential Commands

### Start/Stop Services

```bash
# Start all services (build first time)
docker-compose up

# Start in background
docker-compose up -d

# Stop services (keep data)
docker-compose stop

# Stop and remove containers (keep data)
docker-compose down

# Stop, remove containers, and delete volumes
docker-compose down -v
```

### View Status

```bash
# Container status
docker-compose ps

# Real-time resource usage
docker stats

# All services status
docker-compose ps -a
```

### View Logs

```bash
# All services, follow output
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f mongo

# Last 100 lines
docker-compose logs --tail 100

# Search logs for errors
docker-compose logs | grep -i error
```

### Building

```bash
# Build all images
docker-compose build

# Rebuild without cache
docker-compose build --no-cache

# Build and start
docker-compose up --build

# Build specific service
docker-compose build server
docker-compose build client
```

## Development Tasks

### Working with Code

```bash
# Hot-reload automatically watches for changes
docker-compose up

# Manually restart service after changes
docker-compose restart server
docker-compose restart client

# Clear frontend cache
docker-compose restart client

# Reset database (delete all data)
docker-compose down -v
docker-compose up
```

### Running Commands in Containers

```bash
# Server shell
docker-compose exec server bash

# Client shell
docker-compose exec client bash

# Run npm command in server
docker-compose exec server npm install package-name

# Run npm command in client
docker-compose exec client npm run build

# MongoDB shell
docker-compose exec mongo mongosh dndmeal
```

### Testing

```bash
# Server tests
docker-compose exec server npm test

# Client tests
docker-compose exec client npm test

# With coverage
docker-compose exec server npm test -- --coverage
docker-compose exec client npm test -- --coverage

# UI mode (client only)
docker-compose exec client npm run test:ui
```

## Troubleshooting

### Quick Diagnostics

```bash
# Verify setup
./scripts/docker-verify.sh

# Check service status
docker-compose ps

# View errors
docker-compose logs | grep -i error

# Full system info
docker system df
```

### Common Fixes

```bash
# Port already in use
lsof -i :3000           # Find process
kill -9 <PID>           # Kill it

# Start fresh
docker-compose down -v
docker-compose up

# Rebuild everything
docker-compose build --no-cache
docker-compose up

# Stop all Docker containers
docker stop $(docker ps -q)
```

### Database Access

```bash
# MongoDB shell
docker-compose exec mongo mongosh dndmeal

# List collections
> show collections

# Count documents
> db.recipes.countDocuments()

# Query
> db.recipes.find({name: "Pasta"})

# Exit
> exit
```

## Production

### Using Production Compose File

```bash
# Build production images
docker-compose -f docker-compose.prod.yml build

# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Stop services
docker-compose -f docker-compose.prod.yml down

# Health check
curl https://yourdomain.com/health
```

### Backup

```bash
# Backup MongoDB
./scripts/backup-mongodb.sh

# Manual backup
docker-compose exec mongo mongodump --out /backup
docker cp dndmeal-mongo:/backup ./backup_$(date +%Y%m%d).tar.gz
```

## Cleanup Commands

```bash
# Remove stopped containers
docker container prune

# Remove unused images
docker image prune

# Remove unused volumes
docker volume prune

# Remove everything unused
docker system prune -a

# Specific cleanup
docker rm container-name              # Remove container
docker rmi image-name                 # Remove image
docker volume rm volume-name          # Remove volume
```

## Helper Scripts

```bash
# Verify setup
./scripts/docker-verify.sh

# Build images
./scripts/docker-build.sh

# Clean up
./scripts/docker-clean.sh
```

## Environment Configuration

```bash
# Create from example
cp .env.example .env

# Edit configuration
nano .env

# Key variables
MONGODB_URI=mongodb://mongo:27017/dndmeal
NODE_ENV=development
JWT_SECRET=dev-secret-key
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

## Common Workflows

### Complete Development Cycle

```bash
# 1. Start services
docker-compose up -d

# 2. Make code changes (hot-reload active)

# 3. Run tests
docker-compose exec server npm test
docker-compose exec client npm test

# 4. View logs for debugging
docker-compose logs -f

# 5. Check database
docker-compose exec mongo mongosh dndmeal

# 6. Stop when done
docker-compose down
```

### Debugging Issue

```bash
# 1. Verify setup
./scripts/docker-verify.sh

# 2. Check status
docker-compose ps

# 3. View logs
docker-compose logs -f

# 4. Get shell access
docker-compose exec server bash

# 5. Test database
docker-compose exec mongo mongosh

# 6. Clean and restart if needed
docker-compose down -v
docker-compose up
```

### Update After Code Changes

```bash
# 1. Pull latest code
git pull origin main

# 2. Rebuild if needed
docker-compose up --build

# 3. Run migrations/scripts
docker-compose exec server npm run migrate

# 4. Verify
docker-compose ps
curl http://localhost:5000/health
```

## Performance Tips

```bash
# Use background mode to free terminal
docker-compose up -d

# Monitor resources
docker stats

# Clean up periodically
docker system prune -a

# View cached layers
docker image inspect image-name
```

## Getting Help

```bash
# Full diagnostics
./scripts/docker-verify.sh

# Detailed logs
docker-compose logs --tail 100 > logs.txt

# Save system info
docker --version > info.txt
docker-compose --version >> info.txt
uname -a >> info.txt

# Troubleshooting
# See DOCKER_TROUBLESHOOTING.md for detailed help
```

## Links

- [Full Deployment Guide](./DEPLOYMENT.md)
- [Development Setup](./docker-compose.dev.md)
- [Production Setup](./docker-compose.prod.md)
- [Troubleshooting](./DOCKER_TROUBLESHOOTING.md)

---

**Last Updated**: 2026-04-19

For detailed information on any command, see the full guides linked above.
