#!/bin/bash

# DnDMeal MongoDB Restore Script
# Restores MongoDB from a backup created by backup-mongodb.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  DnDMeal MongoDB Restore Script"
echo "=========================================="
echo ""

# Check arguments
if [ "$#" -lt 1 ]; then
    echo "Usage: ./scripts/restore-mongodb.sh <backup-file.tar.gz> [database]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/restore-mongodb.sh ./backups/mongodb_backup_20260419.tar.gz"
    echo "  ./scripts/restore-mongodb.sh ./backups/mongodb_backup_20260419.tar.gz dndmeal"
    echo ""
    exit 1
fi

BACKUP_FILE="$1"
DATABASE="${2:-dndmeal}"  # Default to dndmeal if not specified

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}✗${NC} Backup file not found: $BACKUP_FILE"
    exit 1
fi

echo "Backup file: $BACKUP_FILE"
echo "Target database: $DATABASE"
echo ""

# Check if file is compressed
if [[ "$BACKUP_FILE" == *.tar.gz ]]; then
    BACKUP_DIR=$(mktemp -d)
    echo -e "${BLUE}→${NC} Extracting backup..."
    if tar -xzf "$BACKUP_FILE" -C "$BACKUP_DIR"; then
        echo -e "${GREEN}✓${NC} Backup extracted"
        # Find the extracted dump directory
        DUMP_DIR=$(find "$BACKUP_DIR" -name "mongodb_backup_*" -type d | head -1)
        if [ -z "$DUMP_DIR" ]; then
            echo -e "${RED}✗${NC} Cannot find dump directory in backup"
            rm -rf "$BACKUP_DIR"
            exit 1
        fi
    else
        echo -e "${RED}✗${NC} Failed to extract backup"
        rm -rf "$BACKUP_DIR"
        exit 1
    fi
else
    DUMP_DIR="$BACKUP_FILE"
fi

# Check if MongoDB is running
echo ""
echo -e "${BLUE}→${NC} Checking MongoDB status..."
if docker-compose ps mongo &>/dev/null; then
    echo -e "${GREEN}✓${NC} MongoDB container found"
else
    echo -e "${RED}✗${NC} MongoDB container not running. Start it first:"
    echo "   docker-compose up -d mongo"
    exit 1
fi

# Check if MongoDB is responding
if ! docker-compose exec mongo mongosh --eval "db.runCommand('ping')" &>/dev/null; then
    echo -e "${RED}✗${NC} MongoDB is not responding"
    exit 1
fi
echo -e "${GREEN}✓${NC} MongoDB is responding"

# Confirm before restoring
echo ""
echo -e "${YELLOW}⚠${NC}  This will restore data from the backup."
echo "   Any data currently in MongoDB will be REPLACED."
echo ""
read -p "Continue with restore? (type 'yes' to confirm): " -r
echo

if [[ ! $REPLY == "yes" ]]; then
    echo "Restore cancelled."
    [ -n "$BACKUP_DIR" ] && rm -rf "$BACKUP_DIR"
    exit 0
fi

echo ""
echo -e "${BLUE}→${NC} Restoring MongoDB data..."

# Copy dump directory to container
CONTAINER_DUMP="/tmp/restore_dump_$$"

# Create temporary directory in container
docker-compose exec mongo mkdir -p "$CONTAINER_DUMP" || true

# Copy files from host to container
if [ -d "$DUMP_DIR" ]; then
    # Copy the contents of the dump directory
    tar -cf - -C "$DUMP_DIR" . | docker-compose exec -T mongo tar -xf - -C "$CONTAINER_DUMP"
    echo -e "${GREEN}✓${NC} Dump directory copied to container"
else
    echo -e "${RED}✗${NC} Dump directory not found: $DUMP_DIR"
    [ -n "$BACKUP_DIR" ] && rm -rf "$BACKUP_DIR"
    exit 1
fi

# Restore using mongorestore
echo -e "${BLUE}→${NC} Running mongorestore..."

if docker-compose exec mongo mongorestore --db "$DATABASE" "$CONTAINER_DUMP/$DATABASE"; then
    echo -e "${GREEN}✓${NC} Database restore completed"
else
    echo -e "${RED}✗${NC} Restore failed"
    docker-compose exec mongo rm -rf "$CONTAINER_DUMP" 2>/dev/null || true
    [ -n "$BACKUP_DIR" ] && rm -rf "$BACKUP_DIR"
    exit 1
fi

# Clean up temporary directory in container
docker-compose exec mongo rm -rf "$CONTAINER_DUMP" 2>/dev/null || true

# Clean up temporary directory on host
[ -n "$BACKUP_DIR" ] && rm -rf "$BACKUP_DIR"

# Verify restore
echo ""
echo -e "${BLUE}→${NC} Verifying restore..."

# Count collections
COLLECTIONS=$(docker-compose exec mongo mongosh "$DATABASE" --eval "db.getCollectionNames()" 2>/dev/null | grep -c "'" || echo "unknown")

echo ""
echo "=========================================="
echo "  Restore Summary"
echo "=========================================="
echo -e "${GREEN}✓${NC} Restore completed successfully!"
echo ""
echo "Database: $DATABASE"
echo ""

# Show collection info
if docker-compose exec mongo mongosh "$DATABASE" --quiet --eval "db.getCollectionNames().forEach(c => print(\`  - \${c}: \${db[c].countDocuments()} documents\`))" 2>/dev/null; then
    true
else
    echo "  (Collection information unavailable)"
fi

echo ""
echo "Application should now have the restored data."
echo "Verify the restore by checking the application:"
echo "  http://localhost:3000"
echo ""
