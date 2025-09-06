#!/bin/bash

# LocalSocialMax Development Environment Startup Script
# This script ensures the development environment is properly set up and running

echo "🚀 Starting LocalSocialMax Development Environment..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Stop any existing containers to ensure clean state
echo "🛑 Stopping existing containers..."
./docker-dev.sh stop

# Start the full stack
echo "🚀 Starting full development stack..."
./docker-dev.sh full-stack

# Wait for containers to be ready
echo "⏳ Waiting for containers to be ready..."
sleep 10

# Install dependencies
echo "📦 Installing dependencies..."
./docker-dev.sh install

# Start the development server
echo "🚀 Starting development server..."
./docker-dev.sh dev

echo ""
echo "✅ Development environment is ready!"
echo ""
echo "🌐 Access your services:"
echo "  📱 App: http://localhost:5173"
echo "  📊 Grafana: http://localhost:3001 (admin/admin)"
echo "  📈 Prometheus: http://localhost:9090"
echo "  🗄️  pgAdmin: http://localhost:5050 (admin@localsocialmax.com/admin)"
echo "  📦 MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
echo ""
echo "💡 Tips:"
echo "  - Use './docker-dev.sh shell' to open a shell in the container"
echo "  - Use './docker-dev.sh logs' to view container logs"
echo "  - Use './docker-dev.sh stop' to stop all services" 