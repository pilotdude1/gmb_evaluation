#!/bin/bash

# Production Deployment Script for LocalSocialMax
# This script builds and deploys the application using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found!"
    print_status "Please copy env.production.template to .env and fill in your values"
    exit 1
fi

# Check if required environment variables are set
print_status "Checking environment variables..."

required_vars=("VITE_SUPABASE_URL" "VITE_SUPABASE_ANON_KEY" "CSRF_SECRET" "JWT_SECRET")
missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_error "Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    exit 1
fi

print_success "Environment variables validated"

# Stop existing containers
print_status "Stopping existing containers..."
docker-compose -f docker-compose.production.yml down --remove-orphans || true

# Remove old images to force rebuild
print_status "Removing old images..."
docker image prune -f || true

# Build and start the application
print_status "Building and starting the application..."
docker-compose -f docker-compose.production.yml up --build -d

# Wait for services to be healthy
print_status "Waiting for services to be healthy..."
sleep 10

# Check if the application is running
print_status "Checking application health..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Application is running and healthy!"
    print_status "Application URL: http://localhost:3000"
    print_status "Nginx URL: http://localhost:80"
else
    print_error "Application health check failed!"
    print_status "Checking logs..."
    docker-compose -f docker-compose.production.yml logs app
    exit 1
fi

# Show running containers
print_status "Running containers:"
docker-compose -f docker-compose.production.yml ps

# Show resource usage
print_status "Resource usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"

print_success "Deployment completed successfully!"
print_status "To view logs: docker-compose -f docker-compose.production.yml logs -f"
print_status "To stop: docker-compose -f docker-compose.production.yml down"
