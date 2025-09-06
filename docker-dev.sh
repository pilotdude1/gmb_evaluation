#!/bin/bash

# LocalSocialMax Docker Development Environment
# Usage: ./docker-dev.sh [start|stop|restart|shell|build|logs|full-stack|services]

case "$1" in
    "start")
        echo "🚀 Starting LocalSocialMax development container..."
        docker-compose up -d app
        echo "✅ Container started! Access your app at http://localhost:5173"
        ;;
    "stop")
        echo "🛑 Stopping LocalSocialMax development container..."
        docker-compose down
        echo "✅ Container stopped!"
        ;;
    "restart")
        echo "🔄 Restarting LocalSocialMax development container..."
        docker-compose down
        docker-compose up -d app
        echo "✅ Container restarted! Access your app at http://localhost:5173"
        ;;
    "shell")
        echo "🐚 Opening shell in LocalSocialMax development container..."
        docker-compose exec app bash
        ;;
    "build")
        echo "🔨 Building LocalSocialMax development container..."
        docker-compose build --no-cache
        echo "✅ Container built!"
        ;;
    "logs")
        echo "📋 Showing container logs..."
        docker-compose logs -f
        ;;
    "dev")
        echo "🚀 Starting development server in container..."
        echo "📦 Ensuring dependencies are installed..."
        docker-compose exec app bash -c "sudo chown -R nodeuser:nodeuser /workspaces/module_base/node_modules && npm install"
        echo "🚀 Starting Vite development server..."
        docker-compose exec app npm run dev -- --host 0.0.0.0 --port 5173
        ;;
    "install")
        echo "📦 Installing dependencies in container..."
        docker-compose exec app bash -c "sudo chown -R nodeuser:nodeuser /workspaces/module_base/node_modules && npm install"
        echo "✅ Dependencies installed successfully!"
        ;;
    "full-stack")
        echo "🚀 Starting full development stack..."
        docker-compose up -d
        echo "✅ Full stack started!"
        echo ""
        echo "🌐 Access your services:"
        echo "  📱 App: http://localhost:5173"
        echo "  📊 Grafana: http://localhost:3001 (admin/admin)"
        echo "  📈 Prometheus: http://localhost:9090"
        echo "  🗄️  pgAdmin: http://localhost:5050 (admin@localsocialmax.com/admin)"
        echo "  📧 MailHog: http://localhost:8025"
        echo "  📦 MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
        echo "  🗄️  PostgreSQL: localhost:5432"
        echo "  🔴 Redis: localhost:6379"
        ;;
    "services")
        echo "📋 Available services:"
        echo ""
        echo "🔧 Development:"
        echo "  app          - Main SvelteKit application"
        echo "  postgres     - PostgreSQL database"
        echo "  redis        - Redis cache"
        echo ""
        echo "📊 Monitoring:"
        echo "  grafana      - Dashboard and visualization"
        echo "  prometheus   - Metrics collection"
        echo ""
        echo "🛠️  Tools:"
        echo "  pgadmin      - PostgreSQL administration"
        echo "  mailhog      - Email testing"
        echo "  minio        - Object storage"
        echo ""
        echo "🌐 URLs:"
        echo "  App: http://localhost:5173"
        echo "  Grafana: http://localhost:3001"
        echo "  Prometheus: http://localhost:9090"
        echo "  pgAdmin: http://localhost:5050"
        echo "  MailHog: http://localhost:8025"
        echo "  MinIO: http://localhost:9001"
        ;;
    *)
        echo "LocalSocialMax Docker Development Environment"
        echo ""
        echo "Usage: ./docker-dev.sh [command]"
        echo ""
        echo "Commands:"
        echo "  start       - Start the development container"
        echo "  stop        - Stop the development container"
        echo "  restart     - Restart the development container"
        echo "  shell       - Open a shell in the container"
        echo "  build       - Build the container image"
        echo "  logs        - Show container logs"
        echo "  dev         - Start development server in container"
        echo "  install     - Install dependencies in container"
        echo "  full-stack  - Start all services (Grafana, Prometheus, etc.)"
        echo "  services    - Show available services and URLs"
        echo ""
        echo "Examples:"
        echo "  ./docker-dev.sh start        # Start app container"
        echo "  ./docker-dev.sh full-stack   # Start all services"
        echo "  ./docker-dev.sh shell        # Open shell"
        echo "  ./docker-dev.sh dev          # Start dev server"
        echo "  ./docker-dev.sh services     # Show all URLs"
        ;;
esac 