#!/bin/bash

# DnDMeal Docker Verification Script
# This script verifies that your Docker setup is correct for DnDMeal
# Run this before troubleshooting or deploying

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
PASS=0
FAIL=0
WARN=0

# Helper functions
pass_check() {
    echo -e "${GREEN}✓${NC} $1"
    ((PASS++))
}

fail_check() {
    echo -e "${RED}✗${NC} $1"
    ((FAIL++))
}

warn_check() {
    echo -e "${YELLOW}⚠${NC} $1"
    ((WARN++))
}

info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Header
echo ""
echo "=========================================="
echo "  DnDMeal Docker Verification Script"
echo "=========================================="
echo ""

# 1. Check Docker Installation
echo "1. Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    pass_check "Docker installed: $DOCKER_VERSION"
else
    fail_check "Docker not found. Install from https://docker.com"
fi

# 2. Check Docker Daemon
echo ""
echo "2. Checking Docker daemon..."
if docker ps &> /dev/null; then
    pass_check "Docker daemon is running"
else
    fail_check "Docker daemon is not running. Start Docker and try again."
fi

# 3. Check Docker Compose
echo ""
echo "3. Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    pass_check "Docker Compose installed: $COMPOSE_VERSION"
elif docker compose version &> /dev/null; then
    COMPOSE_VERSION=$(docker compose version)
    warn_check "Using Docker Compose v2: $COMPOSE_VERSION (should use docker-compose command)"
else
    fail_check "Docker Compose not found. Install from https://docs.docker.com/compose/install/"
fi

# 4. Check project files
echo ""
echo "4. Checking project files..."
if [ -f "docker-compose.yml" ]; then
    pass_check "Found docker-compose.yml"
else
    fail_check "Missing docker-compose.yml in root directory"
fi

if [ -f "docker-compose.prod.yml" ]; then
    pass_check "Found docker-compose.prod.yml"
else
    fail_check "Missing docker-compose.prod.yml (needed for production)"
fi

if [ -f "server/Dockerfile" ]; then
    pass_check "Found server/Dockerfile"
else
    fail_check "Missing server/Dockerfile"
fi

if [ -f "client/Dockerfile" ]; then
    pass_check "Found client/Dockerfile"
else
    fail_check "Missing client/Dockerfile"
fi

# 5. Check environment files
echo ""
echo "5. Checking environment configuration..."
if [ -f ".env" ]; then
    pass_check "Found .env file"
else
    if [ -f ".env.example" ]; then
        warn_check ".env not found, but .env.example exists"
        info "Creating .env from .env.example..."
        cp .env.example .env
        pass_check "Created .env file"
    else
        fail_check "Missing .env and .env.example files"
    fi
fi

# 6. Check required environment variables
echo ""
echo "6. Checking required environment variables..."
REQUIRED_VARS=("MONGODB_URI" "NODE_ENV" "JWT_SECRET")
for var in "${REQUIRED_VARS[@]}"; do
    if grep -q "^${var}=" .env; then
        VALUE=$(grep "^${var}=" .env | cut -d'=' -f2 | head -c 20)
        if [ "$var" = "JWT_SECRET" ] && [ "$VALUE" = "dev-secret-key" ]; then
            warn_check "$var is set to default development value (change for production)"
        else
            pass_check "$var is configured"
        fi
    else
        fail_check "Missing $var in .env file"
    fi
done

# 7. Check directory structure
echo ""
echo "7. Checking directory structure..."
DIRS=("server/src" "client/src" "shared/src")
for dir in "${DIRS[@]}"; do
    if [ -d "$dir" ]; then
        pass_check "Found $dir"
    else
        fail_check "Missing $dir directory"
    fi
done

# 8. Disk space check
echo ""
echo "8. Checking disk space..."
AVAILABLE=$(df . | tail -1 | awk '{print $4}')
# Check if at least 2GB available (in KB)
if [ "$AVAILABLE" -gt 2000000 ]; then
    pass_check "Sufficient disk space available ($(df -h . | tail -1 | awk '{print $4}'))"
else
    warn_check "Low disk space available ($(df -h . | tail -1 | awk '{print $4}')), may need 2GB+ for Docker"
fi

# 9. Try to build images
echo ""
echo "9. Testing Docker image builds..."
echo "   (This may take a few minutes on first run)"

# Check if images already exist
if docker images | grep -q dndmeal-server; then
    info "Server image already exists, skipping build"
    pass_check "Server image ready"
else
    info "Building server image..."
    if docker-compose build server &> /dev/null; then
        pass_check "Server image built successfully"
    else
        fail_check "Failed to build server image"
        info "Run 'docker-compose build --no-cache' for more details"
    fi
fi

if docker images | grep -q dndmeal-client; then
    info "Client image already exists, skipping build"
    pass_check "Client image ready"
else
    info "Building client image..."
    if docker-compose build client &> /dev/null; then
        pass_check "Client image built successfully"
    else
        fail_check "Failed to build client image"
        info "Run 'docker-compose build --no-cache' for more details"
    fi
fi

# 10. Check helper scripts
echo ""
echo "10. Checking helper scripts..."
SCRIPTS=("scripts/docker-build.sh" "scripts/docker-clean.sh")
for script in "${SCRIPTS[@]}"; do
    if [ -f "$script" ]; then
        if [ -x "$script" ]; then
            pass_check "Found and executable: $script"
        else
            warn_check "Found but not executable: $script"
            info "Run: chmod +x $script"
        fi
    else
        warn_check "Missing helper script: $script"
    fi
done

# Summary
echo ""
echo "=========================================="
echo "  Verification Summary"
echo "=========================================="
TOTAL=$((PASS + FAIL + WARN))
echo -e "${GREEN}Passed:${NC} $PASS"
if [ $WARN -gt 0 ]; then
    echo -e "${YELLOW}Warnings:${NC} $WARN"
fi
if [ $FAIL -gt 0 ]; then
    echo -e "${RED}Failed:${NC} $FAIL"
fi

echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ Verification complete!${NC}"
    echo ""
    echo "You can now run: docker-compose up"
    echo ""
    exit 0
else
    echo -e "${RED}✗ Verification failed with $FAIL error(s)${NC}"
    echo ""
    echo "Please fix the errors above and try again."
    echo "See DOCKER_TROUBLESHOOTING.md for help."
    echo ""
    exit 1
fi
