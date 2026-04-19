#!/bin/bash

# DnDMeal Docker Cleanup Script
# Stops and removes DnDMeal containers, images, and optionally volumes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=========================================="
echo "  DnDMeal Docker Cleanup Script"
echo "=========================================="
echo ""

# Check if docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ Error: docker-compose.yml not found${NC}"
    exit 1
fi

# Ask for confirmation
echo -e "${YELLOW}⚠${NC}  This will stop and remove DnDMeal containers."
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cleanup cancelled."
    exit 0
fi

echo ""
echo -e "${BLUE}→${NC} Stopping and removing containers..."

# Stop and remove containers
if docker-compose down; then
    echo -e "${GREEN}✓${NC} Containers stopped and removed"
else
    echo -e "${RED}✗${NC} Failed to stop containers"
    exit 1
fi

echo ""
echo -e "${YELLOW}⚠${NC}  Remove volumes (database data)?"
read -p "Remove volumes? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}→${NC} Removing volumes..."
    if docker-compose down -v; then
        echo -e "${GREEN}✓${NC} Volumes removed"
    else
        echo -e "${RED}✗${NC} Failed to remove volumes"
        exit 1
    fi
fi

echo ""
echo -e "${YELLOW}⚠${NC}  Remove images?"
read -p "Remove images? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}→${NC} Removing images..."

    # Remove dndmeal images
    if docker rmi -f dndmeal-server dndmeal-client 2>/dev/null; then
        echo -e "${GREEN}✓${NC} DnDMeal images removed"
    else
        echo -e "${YELLOW}⚠${NC}  No DnDMeal images to remove"
    fi
fi

echo ""
echo -e "${YELLOW}⚠${NC}  Run full Docker cleanup (remove all unused resources)?"
echo "     This removes unused images, containers, networks, and volumes."
read -p "Full cleanup? (y/n) " -n 1 -r
echo

if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}→${NC} Running full Docker cleanup..."

    # Remove dangling images
    echo "  Removing dangling images..."
    docker image prune -f

    # Remove unused volumes
    echo "  Removing unused volumes..."
    docker volume prune -f

    # Remove unused networks
    echo "  Removing unused networks..."
    docker network prune -f

    echo -e "${GREEN}✓${NC} Full cleanup completed"

    # Show disk space freed
    echo ""
    echo "Disk space usage:"
    docker system df
fi

echo ""
echo "=========================================="
echo "  Cleanup Complete"
echo "=========================================="
echo ""

# Check what remains
REMAINING=$(docker-compose ps -q 2>/dev/null || true)
if [ -z "$REMAINING" ]; then
    echo -e "${GREEN}✓${NC} No DnDMeal containers running"
else
    echo -e "${YELLOW}⚠${NC}  Some containers still running: $REMAINING"
fi

echo ""
echo "To start fresh:"
echo "  docker-compose up"
echo ""
