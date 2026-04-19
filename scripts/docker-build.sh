#!/bin/bash

# DnDMeal Docker Build Script
# Builds Docker images for DnDMeal with version tagging

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default version
VERSION="${1:-latest}"

# Check if version provided
if [ "$#" -eq 0 ]; then
    echo "Usage: ./scripts/docker-build.sh [version]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/docker-build.sh latest              # Build with 'latest' tag"
    echo "  ./scripts/docker-build.sh 1.0.0               # Build with '1.0.0' tag"
    echo ""
    echo "Proceeding with version: $VERSION"
    echo ""
fi

echo "=========================================="
echo "  DnDMeal Docker Build Script"
echo "=========================================="
echo ""
echo "Building DnDMeal Docker images (v$VERSION)..."
echo ""

# Check docker-compose.yml exists
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}✗ Error: docker-compose.yml not found${NC}"
    exit 1
fi

# Check Dockerfiles exist
if [ ! -f "server/Dockerfile" ]; then
    echo -e "${RED}✗ Error: server/Dockerfile not found${NC}"
    exit 1
fi

if [ ! -f "client/Dockerfile" ]; then
    echo -e "${RED}✗ Error: client/Dockerfile not found${NC}"
    exit 1
fi

# Build server image
echo -e "${BLUE}→${NC} Building server image..."
if docker-compose build server; then
    # Tag the image with version
    docker tag dndmeal-server:latest dndmeal-server:$VERSION
    echo -e "${GREEN}✓${NC} Server image built: dndmeal-server:$VERSION"
else
    echo -e "${RED}✗${NC} Failed to build server image"
    exit 1
fi

echo ""

# Build client image
echo -e "${BLUE}→${NC} Building client image..."
if docker-compose build client; then
    # Tag the image with version
    docker tag dndmeal-client:latest dndmeal-client:$VERSION
    echo -e "${GREEN}✓${NC} Client image built: dndmeal-client:$VERSION"
else
    echo -e "${RED}✗${NC} Failed to build client image"
    exit 1
fi

echo ""
echo "=========================================="
echo "  Build Summary"
echo "=========================================="
echo ""

# Show built images
echo -e "${GREEN}✓${NC} Built images:"
docker images | grep dndmeal | grep -E "$VERSION|latest"

echo ""
echo -e "${GREEN}✓${NC} All images built successfully!"
echo ""
echo "Next steps:"
echo "  • Start services: docker-compose up"
echo "  • Or with production: docker-compose -f docker-compose.prod.yml up -d"
echo ""
