#!/bin/bash

# Docker Development Environment Manager for Supabase Stack
# This script manages the Supabase-focused development environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COMPOSE_FILE="docker-compose-supabase.yml"
PROJECT_NAME="localsocialmax-supabase"

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

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if docker-compose is available
check_docker_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_error "docker-compose is not installed. Please install it and try again."
        exit 1
    fi
}

# Function to show usage
show_usage() {
    echo "Usage: $0 {start|stop|restart|build|logs|status|clean|help}"
    echo ""
    echo "Commands:"
    echo "  start     - Start the Supabase development environment"
    echo "  stop      - Stop all containers"
    echo "  restart   - Restart all containers"
    echo "  build     - Build all containers"
    echo "  logs      - Show logs from all containers"
    echo "  status    - Show status of all containers"
    echo "  clean     - Remove all containers and volumes"
    echo "  help      - Show this help message"
    echo ""
    echo "Services included:"
    echo "  - SvelteKit App (Port 5175)"
    echo "  - Redis Cache (Port 6379)"
    echo "  - Grafana Dashboard (Port 3001)"
    echo "  - Prometheus Metrics (Port 9090)"
    echo "  - MinIO Storage (Port 9000/9001)"
    echo ""
    echo "External Services:"
    echo "  - Supabase PostgreSQL (Hosted)"
    echo "  - Supabase Auth (Hosted)"
    echo "  - Supabase Storage (Hosted)"
    echo "  - Mailgun Email (Production)"
}

# Function to start services
start_services() {
    print_status "Starting Supabase development environment..."
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        print_warning ".env file not found. Please copy env.template to .env and configure your Supabase keys."
        print_status "You can run: cp env.template .env"
    fi
    
    # Start services
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d
    
    if [ $? -eq 0 ]; then
        print_success "Development environment started successfully!"
        echo ""
        echo "🌐 Services available at:"
        echo "  - App: http://localhost:5175"
        echo "  - Grafana: http://localhost:3001 (admin/admin)"
        echo "  - Prometheus: http://localhost:9090"
        echo "  - MinIO Console: http://localhost:9001 (minioadmin/minioadmin)"
        echo ""
        echo "📊 External Services:"
        echo "  - Supabase Dashboard: https://supabase.com/dashboard"
        echo "  - Mailgun Dashboard: https://app.mailgun.com/"
        echo ""
        print_status "Run '$0 logs' to see container logs"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

# Function to stop services
stop_services() {
    print_status "Stopping Supabase development environment..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down
    print_success "Services stopped"
}

# Function to restart services
restart_services() {
    print_status "Restarting Supabase development environment..."
    stop_services
    sleep 2
    start_services
}

# Function to build containers
build_containers() {
    print_status "Building containers..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME build --no-cache
    print_success "Containers built successfully"
}

# Function to show logs
show_logs() {
    print_status "Showing logs from all containers..."
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs -f
}

# Function to show status
show_status() {
    print_status "Container status:"
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps
}

# Function to clean everything
clean_all() {
    print_warning "This will remove all containers and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        print_status "Cleaning all containers and volumes..."
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup completed"
    else
        print_status "Cleanup cancelled"
    fi
}

# Function to check environment setup
check_environment() {
    print_status "Checking environment setup..."
    
    # Check if .env file exists
    if [ -f .env ]; then
        print_success ".env file found"
        
        # Check for Supabase variables
        if grep -q "VITE_SUPABASE_URL" .env; then
            print_success "Supabase URL configured"
        else
            print_warning "VITE_SUPABASE_URL not found in .env"
        fi
        
        if grep -q "VITE_SUPABASE_ANON_KEY" .env; then
            print_success "Supabase anon key configured"
        else
            print_warning "VITE_SUPABASE_ANON_KEY not found in .env"
        fi
        
        if grep -q "SUPABASE_SERVICE_ROLE_KEY" .env; then
            print_success "Supabase service role key configured"
        else
            print_warning "SUPABASE_SERVICE_ROLE_KEY not found in .env"
        fi
    else
        print_warning ".env file not found. Please run: cp env.template .env"
    fi
    
    # Check if Supabase setup guide exists
    if [ -f SUPABASE_SETUP.md ]; then
        print_success "Supabase setup guide found"
    else
        print_warning "SUPABASE_SETUP.md not found"
    fi
}

# Main script logic
main() {
    # Check prerequisites
    check_docker
    check_docker_compose
    
    # Parse command line arguments
    case "${1:-}" in
        start)
            start_services
            ;;
        stop)
            stop_services
            ;;
        restart)
            restart_services
            ;;
        build)
            build_containers
            ;;
        logs)
            show_logs
            ;;
        status)
            show_status
            ;;
        clean)
            clean_all
            ;;
        check)
            check_environment
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            print_error "Unknown command: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

# Run main function with all arguments
main "$@" 