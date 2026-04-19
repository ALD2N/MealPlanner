#!/bin/bash

# DnDMeal MongoDB Backup Script
# Creates automated MongoDB backups

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR="${BACKUP_DIR:-./backups}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/mongodb_backup_$TIMESTAMP"
RETENTION_DAYS=${RETENTION_DAYS:-7}

echo "=========================================="
echo "  DnDMeal MongoDB Backup Script"
echo "=========================================="
echo ""

# Check if docker-compose is running
if ! docker-compose ps mongo &>/dev/null; then
    echo -e "${RED}✗${NC} MongoDB container not found. Start it first:"
    echo "   docker-compose up -d"
    exit 1
fi

# Create backup directory
mkdir -p "$BACKUP_DIR"
echo -e "${BLUE}→${NC} Backup directory: $BACKUP_DIR"

# Check if MongoDB is healthy
echo -e "${BLUE}→${NC} Checking MongoDB status..."
if docker-compose exec mongo mongosh --eval "db.runCommand('ping')" &>/dev/null; then
    echo -e "${GREEN}✓${NC} MongoDB is responding"
else
    echo -e "${RED}✗${NC} MongoDB is not responding. Check with:"
    echo "   docker-compose logs mongo"
    exit 1
fi

echo ""
echo -e "${BLUE}→${NC} Starting MongoDB backup..."

# Create temporary backup directory in container
CONTAINER_BACKUP="/tmp/mongodb_backup_$TIMESTAMP"

# Run mongodump in container
if docker-compose exec mongo mongodump --out "$CONTAINER_BACKUP" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} MongoDB dump completed"
else
    echo -e "${RED}✗${NC} MongoDB dump failed"
    exit 1
fi

echo ""
echo -e "${BLUE}→${NC} Copying backup from container..."

# Copy from container to host
if docker cp dndmeal-mongo:"$CONTAINER_BACKUP" "$BACKUP_FILE" 2>/dev/null; then
    echo -e "${GREEN}✓${NC} Backup copied to: $BACKUP_FILE"
else
    echo -e "${RED}✗${NC} Failed to copy backup"
    exit 1
fi

# Clean up temporary directory in container
docker-compose exec mongo rm -rf "$CONTAINER_BACKUP" 2>/dev/null || true

# Compress backup
echo ""
echo -e "${BLUE}→${NC} Compressing backup..."
if tar -czf "$BACKUP_FILE.tar.gz" -C "$BACKUP_DIR" "mongodb_backup_$TIMESTAMP" 2>/dev/null; then
    # Get compressed size
    SIZE=$(du -h "$BACKUP_FILE.tar.gz" | cut -f1)
    echo -e "${GREEN}✓${NC} Backup compressed: $SIZE"

    # Remove uncompressed backup
    rm -rf "$BACKUP_FILE"
else
    echo -e "${YELLOW}⚠${NC}  Failed to compress (keeping uncompressed)"
    SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
fi

# Clean old backups
echo ""
echo -e "${BLUE}→${NC} Cleaning old backups (keeping last $RETENTION_DAYS days)..."

# Find and remove backups older than RETENTION_DAYS
OLD_COUNT=$(find "$BACKUP_DIR" -name "mongodb_backup_*.tar.gz" -mtime +$RETENTION_DAYS 2>/dev/null | wc -l)

if [ "$OLD_COUNT" -gt 0 ]; then
    find "$BACKUP_DIR" -name "mongodb_backup_*.tar.gz" -mtime +$RETENTION_DAYS -delete
    echo -e "${GREEN}✓${NC} Removed $OLD_COUNT old backup(s)"
else
    echo -e "${GREEN}✓${NC} No old backups to remove"
fi

# Summary
echo ""
echo "=========================================="
echo "  Backup Summary"
echo "=========================================="
echo -e "${GREEN}✓${NC} Backup completed successfully!"
echo ""
echo "Backup file: $BACKUP_FILE.tar.gz"
echo "Size: $SIZE"
echo "Location: $(cd "$BACKUP_DIR" && pwd)"
echo ""

# List recent backups
echo "Recent backups:"
ls -lh "$BACKUP_DIR"/mongodb_backup_*.tar.gz 2>/dev/null | tail -5 || echo "  (No backups yet)"

echo ""
echo "To restore this backup:"
echo "  ./scripts/restore-mongodb.sh $BACKUP_FILE.tar.gz"
echo ""
