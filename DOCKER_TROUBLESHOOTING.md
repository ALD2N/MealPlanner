# DnDMeal Docker Troubleshooting Guide

## Quick Diagnostics

Run this first to identify issues:

```bash
./scripts/docker-verify.sh
```

This checks:
- Docker installation
- Docker Compose version
- Environment configuration
- Image builds
- Service startup

## Common Issues and Solutions

### Issue: Docker Command Not Found

**Problem**: `docker: command not found`

**Causes**:
- Docker not installed
- Docker not in PATH
- Shell needs restart

**Solutions**:

```bash
# Check if Docker is installed
which docker
docker --version

# Install Docker (Ubuntu/Debian)
sudo apt-get update
sudo apt-get install docker.io
sudo usermod -aG docker $USER
newgrp docker

# Install Docker Desktop (Mac/Windows)
# https://www.docker.com/products/docker-desktop

# Restart shell after installation
exec bash
```

### Issue: Docker Compose Command Not Found

**Problem**: `docker-compose: command not found`

**Solutions**:

```bash
# Check version
docker-compose --version

# Or try Docker Compose v2
docker compose --version

# Install Docker Compose (if not with Docker Desktop)
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify
docker-compose --version
```

### Issue: Port Already in Use

**Problem**: `Error response from daemon: Ports are not available`

**Example Error**:
```
ERROR: for dndmeal-client  Cannot start service client: 
error while creating endpoint dndmeal-client on network dndmeal: 
driver failed programming external connectivity on endpoint dndmeal-client: 
Error starting userland proxy: listen tcp 0.0.0.0:3000: bind: address already in use
```

**Diagnose Which Process Uses the Port**:

```bash
# Linux/Mac - find process using port 3000
lsof -i :3000

# Output example:
# COMMAND    PID      USER   FD   TYPE   DEVICE SIZE/OFF NODE NAME
# node      1234   username    5u  IPv6  0x123456      0t0  TCP *:3000 (LISTEN)

# Windows
netstat -ano | findstr :3000
```

**Solutions**:

**Option 1: Kill the process**

```bash
# Linux/Mac - kill process using port 3000
kill -9 1234          # Replace 1234 with actual PID
# or
lsof -ti :3000 | xargs kill -9

# Windows
taskkill /PID 1234 /F
```

**Option 2: Change ports in docker-compose.yml**

```yaml
services:
  client:
    ports:
      - "3001:3000"    # Changed from 3000:3000
  server:
    ports:
      - "5001:5000"    # Changed from 5000:5000
```

Then update environment variables:

```bash
# .env
VITE_API_URL=http://localhost:5001
VITE_WS_URL=ws://localhost:5001
```

**Option 3: Stop conflicting services**

```bash
# If another docker-compose is running
docker-compose down

# If it's a different application
sudo systemctl stop conflicting-service
```

### Issue: Volume Permission Denied

**Problem**: `Permission denied` when reading/writing volumes

**Error Example**:
```
Error: EACCES: permission denied, open '/app/client/src/App.tsx'
```

**Causes**:
- User ID mismatch between host and container
- Incorrect file permissions

**Solutions**:

```bash
# Fix file permissions
chmod -R 755 client/
chmod -R 755 server/
chmod -R 755 shared/

# Or use Docker to fix
docker-compose exec client chown -R node:node /app/client/src
docker-compose exec server chown -R node:node /app/server/src

# Run as user instead of root in Dockerfile
# USER node
```

### Issue: MongoDB Connection Failed

**Problem**: `Error: connect ECONNREFUSED 127.0.0.1:27017`

**Causes**:
- MongoDB container not running
- Wrong hostname (use 'mongo' not 'localhost' in Docker)
- Network issues

**Diagnose**:

```bash
# Check if MongoDB is running
docker-compose ps mongo

# Check MongoDB logs
docker-compose logs mongo

# Test connection from server container
docker-compose exec server mongosh mongodb://mongo:27017

# Check network connectivity
docker-compose exec server ping mongo
```

**Solutions**:

```bash
# Make sure mongo service is healthy
docker-compose ps

# Expected:
# dndmeal-mongo  ... Up (healthy)

# If not healthy, restart
docker-compose restart mongo

# Wait for health check
sleep 10

# Try again
docker-compose up -d
```

**Check MONGODB_URI in environment**:

```bash
# In .env or docker-compose.yml
MONGODB_URI=mongodb://mongo:27017/dndmeal
#                    ^^^^ NOT localhost!

# In production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dndmeal
```

### Issue: Image Build Fails

**Problem**: `ERROR [stage_name] failed to build`

**Error Example**:
```
failed to build: exit code 1
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions**:

```bash
# Clear npm cache and rebuild
docker-compose build --no-cache

# Or clean everything and start fresh
docker system prune -a
docker-compose build
docker-compose up

# Check Docker BuildKit is enabled
DOCKER_BUILDKIT=1 docker-compose build

# View full build output
docker-compose build --progress=plain
```

**If specific npm errors**:

```bash
# Check package.json syntax
cat client/package.json | node -e "console.log(JSON.parse(require('fs').readFileSync(0)))"

# Check for version conflicts
npm ls          # List dependencies with issues

# Force npm audit fix
npm audit fix --force
```

### Issue: Container Exits Immediately

**Problem**: Container starts then stops with exit code

**Error Example**:
```
dndmeal-server exited with code 1
```

**Diagnose**:

```bash
# Check exit code and logs
docker-compose ps
docker-compose logs server

# Expected log should show app starting, e.g.:
# Server running on port 5000
# MongoDB connected
```

**Common Causes**:

```bash
# Missing environment variables
# Fix: Check .env file exists and is readable
cat .env

# Port already in use
# Fix: Kill process or change port
lsof -i :5000

# Missing files
# Fix: Check file exists in container
docker-compose exec server ls -la /app/server/src

# Dependency not installed
# Fix: Rebuild
docker-compose build --no-cache server
```

### Issue: Hot-Reload Not Working

**Problem**: File changes don't appear in running container

**Causes**:
- Volume not mounted correctly
- Container not watching files
- Cache issues

**Diagnose**:

```bash
# Check volumes are mounted
docker inspect dndmeal-server | grep -A 10 Mounts

# Expected output:
# "Mounts": [
#   {
#     "Type": "bind",
#     "Source": "/home/user/project/server/src",
#     "Destination": "/app/server/src"
#   }

# Check file exists in container
docker-compose exec server ls -la /app/server/src/

# Verify file is actually modified
docker-compose exec server stat /app/server/src/index.ts
```

**Solutions**:

```bash
# Restart container
docker-compose restart server

# Rebuild if package.json changed
docker-compose up --build server

# Check docker-compose.yml volumes
cat docker-compose.yml | grep -A 5 "volumes:"

# Force rebuild container
docker-compose down
docker-compose build --no-cache
docker-compose up
```

### Issue: Network Connectivity Between Containers

**Problem**: Services can't communicate (e.g., server can't reach mongo)

**Error Example**:
```
Error: getaddrinfo ENOTFOUND mongo
```

**Diagnose**:

```bash
# Check network exists
docker network ls | grep dndmeal

# Expected output:
# <id>  dndmeal  bridge

# Check services are on network
docker network inspect dndmeal

# Test connectivity
docker-compose exec server ping mongo

# Should work if on same network
# PING mongo (172.xx.xx.xx) 56(84) bytes of data
```

**Solutions**:

```bash
# Ensure services use same network
# docker-compose.yml should have:
networks:
  - dndmeal

# Restart services
docker-compose restart

# Use service name as hostname
MONGODB_URI=mongodb://mongo:27017/dndmeal  # ✓ Correct
MONGODB_URI=mongodb://localhost:27017/dndmeal  # ✗ Wrong

# Or use full container name
MONGODB_URI=mongodb://dndmeal-mongo:27017/dndmeal  # Also works
```

### Issue: Out of Disk Space

**Problem**: `no space left on device`

**Diagnose**:

```bash
# Check disk usage
df -h

# Check Docker usage
docker system df

# Find largest images
docker images --format "{{.Repository}} {{.Size}}" | sort -k2 -hr | head
```

**Solutions**:

```bash
# Remove unused resources
docker system prune -a

# This removes:
# - Stopped containers
# - Dangling images
# - Unused networks
# - Build cache

# Remove old images
docker image rm image-name

# Remove all images
docker image prune -a

# Remove unused volumes
docker volume prune

# Increase disk space (if on small partition)
# Extend volume or move Docker data directory
```

### Issue: Out of Memory

**Problem**: Services killed or hanging: `OOMkilled`

**Diagnose**:

```bash
# Check container memory usage
docker stats

# Check system memory
free -h           # Linux
top              # Linux/Mac
Task Manager     # Windows
```

**Solutions**:

```bash
# Increase Docker memory allocation
# Docker Desktop > Preferences > Resources > Memory

# Or set container memory limits
# docker-compose.yml
services:
  server:
    deploy:
      resources:
        limits:
          memory: 1G

# Restart with changes
docker-compose down
docker-compose up
```

### Issue: Environment Variables Not Loaded

**Problem**: Application not reading .env values

**Diagnose**:

```bash
# Check .env file exists
ls -la .env

# Check environment in container
docker-compose exec server env | grep MONGODB_URI

# Check if sourced correctly
docker-compose exec server cat /proc/self/environ | tr '\0' '\n' | grep MONGODB_URI
```

**Solutions**:

```bash
# Ensure .env in root directory
ls -la .env

# Check syntax (no spaces around =)
grep JWT_SECRET .env
# Should be: JWT_SECRET=value
# Not: JWT_SECRET = value

# Reload environment
docker-compose down
docker-compose up

# Or set directly in docker-compose.yml
services:
  server:
    environment:
      MONGODB_URI: ${MONGODB_URI}
      NODE_ENV: production
```

### Issue: Git Clone Authentication Failed

**Problem**: `fatal: Authentication failed` during Docker build

**Causes**:
- Private repository without credentials
- SSH key not in container

**Solutions**:

```bash
# Use HTTPS with token
git clone https://token@github.com/username/repo.git

# Or use SSH with key passed to Docker
docker build --ssh default .

# Or use BuildKit secrets
DOCKER_BUILDKIT=1 docker build --secret id=ssh_key,src=$HOME/.ssh/id_rsa .
```

## Prevention and Best Practices

### Environment File Checklist

```bash
# Always have .env file
cp .env.example .env

# Verify required variables
grep "MONGODB_URI" .env      # ✓ Present?
grep "JWT_SECRET" .env       # ✓ Present?
grep "NODE_ENV" .env         # ✓ Present?

# Make sure not in git
cat .gitignore | grep .env   # ✓ Ignored?
```

### Regular Maintenance

```bash
# Weekly cleanup
docker system prune -a

# Monthly update
docker pull mongo:6.0
docker pull node:18-alpine
docker pull nginx:alpine

# Backup important data
./scripts/backup-mongodb.sh
```

### Monitoring

```bash
# Watch for issues
docker-compose logs --tail 0 -f

# Health checks
docker-compose ps

# Resource usage
watch docker stats
```

## Advanced Debugging

### Enable Debug Logging

```bash
# Start with debug mode
DEBUG=* docker-compose up

# Or in specific service
environment:
  DEBUG: "express:*,mongoose:*"
```

### Inspect Container Filesystem

```bash
# List files in container
docker-compose exec server ls -la /app/

# View file content
docker-compose exec server cat /app/package.json

# Edit file
docker-compose exec server vim /app/server/.env

# Copy file from container
docker cp dndmeal-server:/app/package.json ./package.json.bak
```

### Interactive Shell in Container

```bash
# Bash shell
docker-compose exec server bash

# Inside container:
ls -la              # Check files
npm list            # Check dependencies
npm run dev         # Run manually
curl localhost:5000 # Test endpoint
```

### View Docker Events

```bash
# Watch Docker events in real-time
docker events

# Filter by container
docker events --filter "container=dndmeal-server"

# Example output:
# 2024-04-19T10:30:45.123Z container start 1234567 (image=dndmeal-server:latest)
# 2024-04-19T10:30:46.456Z container die 1234567 (exit_code=1)
```

## Getting More Help

### Information to Provide When Asking for Help

1. **Run verification**:
   ```bash
   ./scripts/docker-verify.sh
   ```

2. **Capture logs**:
   ```bash
   docker-compose logs > logs.txt
   ```

3. **System info**:
   ```bash
   docker --version
   docker-compose --version
   uname -a
   ```

4. **What you did**:
   - Which command did you run?
   - What happened?
   - What did you expect?

5. **Relevant files**:
   - docker-compose.yml (if modified)
   - .env (without sensitive values)
   - Error messages (full output)

### Useful Resources

- [Docker Troubleshooting](https://docs.docker.com/config/containers/logging/)
- [Docker Compose Issues](https://docs.docker.com/compose/faq/)
- [MongoDB Connection Issues](https://docs.mongodb.com/manual/reference/connection-string/)
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/nodejs-docker-webapp/)

## Quick Reference Commands

```bash
# Diagnose
./scripts/docker-verify.sh
docker-compose ps
docker-compose logs -f

# Fix common issues
docker system prune -a                    # Clean up
docker-compose down -v && docker-compose up  # Reset
docker-compose build --no-cache          # Force rebuild
docker-compose logs --tail 100 server     # View errors

# Debug
docker-compose exec server bash           # Shell access
docker inspect container-name             # Inspect container
docker stats                              # Resource usage
```

---

**Last Updated**: 2026-04-19

For general deployment information, see [DEPLOYMENT.md](./DEPLOYMENT.md).
