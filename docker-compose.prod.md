# DnDMeal Production Deployment Guide

## Overview

This guide covers deploying DnDMeal to production using the optimized `docker-compose.prod.yml` configuration. It assumes you're familiar with the basics from [DEPLOYMENT.md](./DEPLOYMENT.md).

## Production Configuration File

### docker-compose.prod.yml Structure

```yaml
version: '3.8'

services:
  mongo:
    image: mongo:6.0
    container_name: dndmeal-mongo-prod
    environment:
      MONGO_INITDB_DATABASE: dndmeal
    volumes:
      - mongodb_data:/data/db
    restart: always                    # Auto-restart on failure
    networks:
      - dndmeal

  server:
    build:
      context: .
      dockerfile: server/Dockerfile
      target: prod                    # Production build (no dev deps)
    container_name: dndmeal-server-prod
    ports:
      - "5000:5000"
    environment:
      MONGODB_URI: ${MONGODB_URI}    # Must be set in .env
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}      # Must be strong/random
      DISCORD_WEBHOOK_URL: ${DISCORD_WEBHOOK_URL:-}
    depends_on:
      - mongo
    restart: always
    networks:
      - dndmeal

  client:
    build:
      context: .
      dockerfile: client/Dockerfile
      target: prod                    # Production build
    container_name: dndmeal-client-prod
    ports:
      - "80:80"                       # HTTP (use with reverse proxy for HTTPS)
    depends_on:
      - server
    restart: always
    networks:
      - dndmeal

volumes:
  mongodb_data:

networks:
  dndmeal:
    driver: bridge
```

## Key Production Features

### Optimized Builds

#### Server Image Optimization

```dockerfile
# Development stage (includes dev dependencies, ~800MB)
FROM node:18-alpine AS dev

# Production stage (only production deps, ~300MB)
FROM node:18-alpine AS prod
RUN npm ci --omit=dev          # Only install production dependencies
RUN cd server && npm run build # Pre-compile TypeScript
```

**Size Reduction**: ~65% smaller (800MB → 300MB)

#### Client Image Optimization

```dockerfile
# Build stage (temporary)
FROM node:18-alpine AS build
RUN cd client && npm install && npm run build

# Production stage (final, ~50MB)
FROM nginx:alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
```

**Benefits**:
- Only runtime files included
- No development dependencies
- Nginx serves static files efficiently
- Size: ~50MB

### Auto-Restart Policies

```yaml
restart: always  # Restart container automatically on:
                 # - Container crash
                 # - Daemon restart
                 # - Server reboot
```

## Production Environment Setup

### Create Production Environment File

```bash
# Start from example
cp .env.example .env.production

# Edit with production values
nano .env.production
```

### Production Environment Variables

```bash
# Database - Use MongoDB Atlas or managed service
MONGODB_URI=mongodb+srv://username:password@cluster-name.mongodb.net/dndmeal?retryWrites=true&w=majority

# Security - MUST be strong and random
NODE_ENV=production
JWT_SECRET=<output-from-openssl-rand-base64-32>
JWT_EXPIRE=7d

# URLs - Update with your domain
VITE_API_URL=https://api.yourdomain.com
VITE_WS_URL=wss://api.yourdomain.com

# Optional
DISCORD_WEBHOOK_URL=https://discordapp.com/api/webhooks/...

# Docker optimization
DOCKER_BUILDKIT=1
```

### Generate Secure JWT Secret

```bash
# Option 1: OpenSSL (recommended)
openssl rand -base64 32

# Option 2: Python
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Option 3: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## MongoDB for Production

### Self-Managed MongoDB

If using MongoDB in a container:

```bash
# Single container setup (not recommended for high availability)
docker-compose -f docker-compose.prod.yml up -d

# Back up regularly
docker-compose exec mongo mongodump --out /backup
```

### MongoDB Atlas (Recommended)

Managed MongoDB service by MongoDB Inc:

1. **Sign up**: https://www.mongodb.com/cloud/atlas
2. **Create Cluster**:
   - Choose AWS/GCP/Azure
   - Select region closest to servers
   - Enable automatic backups
3. **Create Database User**:
   - Set username and password
   - Save credentials for MONGODB_URI
4. **Allow Network Access**:
   - Add server IP to IP whitelist
5. **Get Connection String**:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/dndmeal
   ```

**Benefits**:
- Automatic backups
- Automatic scaling
- High availability
- Built-in security
- Replica sets for failover

## Deployment Checklist

### Pre-Deployment

- [ ] Run `./scripts/docker-verify.sh` on production server
- [ ] Test Docker build: `docker-compose -f docker-compose.prod.yml build`
- [ ] Create and test `.env.production` file
- [ ] Set strong JWT_SECRET
- [ ] Configure MONGODB_URI (Atlas or self-managed)
- [ ] Plan SSL/TLS certificates
- [ ] Setup domain and DNS

### Deployment

```bash
# 1. Deploy application
cd /var/www/dndmeal
git clone <repo> .
cp .env.example .env.production

# 2. Configure environment
nano .env.production  # Add production values

# 3. Build and start services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# 4. Verify deployment
docker-compose -f docker-compose.prod.yml ps
curl http://localhost:5000/health

# 5. Setup SSL/TLS (see below)

# 6. Setup monitoring and backups
```

## SSL/TLS Setup

### Option 1: Let's Encrypt (Free, Recommended)

```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Certificates saved to:
# - /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# - /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Option 2: Self-Signed (Development/Testing)

```bash
# Generate self-signed certificate
openssl req -x509 -newkey rsa:4096 \
  -keyout /etc/ssl/private/dndmeal.key \
  -out /etc/ssl/certs/dndmeal.crt \
  -days 365 -nodes
```

### Option 3: Commercial Certificate

Purchase from:
- Comodo SSL
- DigiCert
- GlobalSign

## Nginx Reverse Proxy

### Setup Nginx

Install Nginx:

```bash
sudo apt-get install nginx
sudo systemctl start nginx
sudo systemctl enable nginx  # Auto-start on reboot
```

### Configure Nginx for DnDMeal

Create `/etc/nginx/sites-available/dndmeal`:

```nginx
# HTTP redirect to HTTPS
server {
    listen 80;
    server_name yourdomain.com api.yourdomain.com;
    
    return 301 https://$server_name$request_uri;
}

# HTTPS upstream definition
upstream backend {
    server localhost:5000;
}

# HTTPS server block
server {
    listen 443 ssl http2;
    server_name yourdomain.com api.yourdomain.com;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;
    gzip_min_length 1000;
    
    # Frontend (root path)
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
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
        
        # WebSocket support
        proxy_buffering off;
        proxy_request_buffering off;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://backend/health;
        access_log off;
    }
}
```

### Enable Nginx Configuration

```bash
# Create symlink
sudo ln -s /etc/nginx/sites-available/dndmeal /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## Running Production Deployment

### Start Services

```bash
# Using production compose file
docker-compose -f docker-compose.prod.yml up -d

# Verify services are running
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

### Monitor Services

```bash
# View container status
docker-compose -f docker-compose.prod.yml ps

# Monitor resource usage
docker stats dndmeal-server-prod dndmeal-client-prod dndmeal-mongo-prod

# Check logs for errors
docker-compose -f docker-compose.prod.yml logs | grep -i error

# Check specific service
docker-compose -f docker-compose.prod.yml logs server
```

### Health Checks

```bash
# API health
curl https://yourdomain.com/health

# Check MongoDB connection
docker-compose -f docker-compose.prod.yml exec mongo mongosh mongodb://localhost:27017

# Verify all services
docker-compose -f docker-compose.prod.yml ps
```

## Backup & Disaster Recovery

### Automated Backup Script

Create `scripts/backup-prod.sh`:

```bash
#!/bin/bash
set -e

BACKUP_DIR="/backups/dndmeal"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$TIMESTAMP.tar.gz"

mkdir -p $BACKUP_DIR

echo "Starting backup at $(date)"

# Backup MongoDB
echo "Backing up MongoDB..."
docker-compose -f docker-compose.prod.yml exec -T mongo \
  mongodump --out /tmp/mongodump

# Copy from container to host
docker cp dndmeal-mongo-prod:/tmp/mongodump /tmp/

# Create tarball
echo "Creating backup archive..."
tar -czf $BACKUP_FILE \
  -C /tmp mongodump \
  .env.production \
  docker-compose.prod.yml

# Cleanup
rm -rf /tmp/mongodump

# Keep backups for 30 days
echo "Cleaning old backups..."
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE"
echo "Size: $(du -h $BACKUP_FILE | cut -f1)"
```

### Schedule Backups

```bash
# Add to crontab (daily at 2 AM)
0 2 * * * /var/www/dndmeal/scripts/backup-prod.sh >> /var/log/dndmeal-backup.log 2>&1

# View cron jobs
crontab -l

# Edit cron jobs
crontab -e
```

### Restore from Backup

```bash
# Extract backup
tar -xzf backup_20260419_020000.tar.gz

# Restore to MongoDB
docker-compose -f docker-compose.prod.yml exec mongo \
  mongorestore /mongodump

# Restore configuration
cp .env.production .env.production.backup
cp .env.production.from_backup .env.production
docker-compose -f docker-compose.prod.yml restart server
```

## Scaling for Production

### Horizontal Scaling (Multiple Servers)

Use Docker Swarm or Kubernetes:

```bash
# Docker Swarm (simpler)
docker swarm init
docker stack deploy -c docker-compose.prod.yml dndmeal

# Kubernetes (more powerful)
# kubectl apply -f k8s/deployment.yaml
```

### Database Replication (High Availability)

MongoDB replica sets for failover:

```bash
# Using MongoDB Atlas (recommended)
# Enables automatic replication across regions
```

### Load Balancing

Use Nginx upstream with multiple backends:

```nginx
upstream backend {
    least_conn;                    # Load balancing algorithm
    server server1.local:5000;
    server server2.local:5000;
    server server3.local:5000;
}
```

## Performance Tuning

### Container Resource Limits

```yaml
services:
  server:
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Database Optimization

```bash
# Index creation
docker-compose -f docker-compose.prod.yml exec mongo mongosh dndmeal

# In MongoDB shell:
> db.recipes.createIndex({name: 1})
> db.meals.createIndex({userId: 1})
> db.users.createIndex({email: 1})
```

### Nginx Caching

```nginx
location /api {
    # Cache API responses
    proxy_cache api_cache;
    proxy_cache_valid 200 10m;
    proxy_cache_key "$scheme$request_method$host$request_uri";
    
    # Don't cache POST/PUT/DELETE
    proxy_cache_methods GET HEAD;
    
    proxy_pass http://backend;
}
```

## Security Best Practices

### Firewall Configuration

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable
```

### Environment Security

```bash
# Restrict file permissions
chmod 600 .env.production

# Don't commit .env to git
echo ".env.production" >> .gitignore

# Rotate JWT secret periodically
# Update in .env.production
# Restart server: docker-compose restart server
```

### MongoDB Security

```bash
# Create database user
docker-compose -f docker-compose.prod.yml exec mongo mongosh

> db.createUser({
    user: "dndmeal_user",
    pwd: "strong_password_here",
    roles: ["readWrite"]
  })

# Update MONGODB_URI in .env.production
MONGODB_URI=mongodb+srv://dndmeal_user:password@cluster.mongodb.net/dndmeal
```

### API Security Headers

Already configured in Nginx (see above):
- HSTS (Strict-Transport-Security)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

## Troubleshooting Production

### Common Issues

See [DOCKER_TROUBLESHOOTING.md](./DOCKER_TROUBLESHOOTING.md) for detailed troubleshooting.

### Verify Deployment

```bash
# Run verification script on production server
./scripts/docker-verify.sh

# Check service status
docker-compose -f docker-compose.prod.yml ps

# Test connectivity
curl https://yourdomain.com/health

# Check logs
docker-compose -f docker-compose.prod.yml logs -f server
```

### Update Production

```bash
# Pull latest code
git pull origin main

# Rebuild images
docker-compose -f docker-compose.prod.yml build

# Update services (zero-downtime)
docker-compose -f docker-compose.prod.yml up -d

# Verify
docker-compose -f docker-compose.prod.yml ps
```

## Quick Reference

```bash
# Deploy to production
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Monitor
docker-compose -f docker-compose.prod.yml ps
docker stats
docker-compose -f docker-compose.prod.yml logs -f

# Backup
/var/www/dndmeal/scripts/backup-prod.sh

# Update
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Stop (graceful)
docker-compose -f docker-compose.prod.yml down

# Emergency cleanup
docker-compose -f docker-compose.prod.yml down -v
```

---

**Last Updated**: 2026-04-19

For additional information, see [DEPLOYMENT.md](./DEPLOYMENT.md) and [DOCKER_TROUBLESHOOTING.md](./DOCKER_TROUBLESHOOTING.md).
