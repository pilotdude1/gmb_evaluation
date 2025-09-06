# 🐳 LocalSocialMax Docker Development Environment

Complete Docker development environment with monitoring, databases, and tools.

## 🚀 Quick Start

### Option 1: One-Command Setup (Recommended)

```bash
# Start everything with one command - dependencies, dev server, and all services
./start-dev.sh
```

This will:

- Stop any existing containers
- Start the full development stack
- Install dependencies automatically
- Start the development server
- Show you all the available URLs

### Option 2: Manual Setup

```bash
# Start all services including Grafana, Prometheus, databases
# The development server will start automatically!
./docker-dev.sh full-stack

# Or use docker-compose directly
docker-compose up -d
```

**Note**: The development server now starts automatically when containers start up!

### Option 3: Using Docker Compose Directly

```bash
# Build all containers
docker-compose build

# Start all services
docker-compose up -d

# Open a shell in the app container
docker-compose exec app bash

# Stop all services
docker-compose down
```

## 🌐 Access Your Services

Once the full stack is running:

### 🔧 Development

- **📱 Main App**: http://localhost:5173
- **📱 Alt Port**: http://localhost:5174
- **📱 Dev Port**: http://localhost:5175

### 📊 Monitoring & Analytics

- **📊 Grafana**: http://localhost:3001 (admin/admin)
- **📈 Prometheus**: http://localhost:9090

### 🗄️ Databases & Storage

- **🗄️ PostgreSQL**: localhost:5432
- **🔴 Redis**: localhost:6379
- **📦 MinIO Console**: http://localhost:9001 (minioadmin/minioadmin)

### 🛠️ Development Tools

- **🗄️ pgAdmin**: http://localhost:5050 (admin@localsocialmax.com/admin)

## 📋 Available Commands

### Script Commands

#### One-Command Setup

- `./start-dev.sh` - Complete setup: stop containers, start stack, install deps, start dev server

#### Docker Dev Script (`./docker-dev.sh`)

- `start` - Start the development container (dev server starts automatically)
- `stop` - Stop the development container
- `restart` - Restart the development container
- `shell` - Open a shell in the container
- `build` - Build the container image
- `logs` - Show container logs
- `dev` - Start development server in container (auto-installs deps)
- `install` - Install dependencies in container (auto-fixes permissions)
- `full-stack` - Start all services (Grafana, Prometheus, etc.) - dev server starts automatically
- `services` - Show available services and URLs

### Docker Compose Commands

- `docker-compose up -d` - Start all services in background
- `docker-compose up -d app` - Start just the app
- `docker-compose down` - Stop all services
- `docker-compose exec app bash` - Open shell in app container
- `docker-compose logs -f` - View logs
- `docker-compose build` - Build all images

## 🛠️ What's Included

### 🔧 Development

- **Node.js 20** (Bookworm)
- **SvelteKit** development tools
- **TypeScript** support
- **ESLint** and **Prettier**
- **Git** and development tools
- **Hot reload** for development

### 📊 Monitoring & Analytics

- **Grafana** - Dashboard and visualization
- **Prometheus** - Metrics collection and storage
- **Custom dashboards** for application metrics

### 🗄️ Databases & Storage

- **PostgreSQL 15** - Primary database
- **Redis 7** - Caching and sessions
- **MinIO** - Object storage (S3-compatible)

### 🛠️ Development Tools

- **pgAdmin** - PostgreSQL administration
- **Mailgun** - Production email service
- **Database initialization** scripts

## 📁 File Structure

```
module_base/
├── Dockerfile              # Container definition
├── docker-compose.yml      # Full stack orchestration
├── docker-dev.sh          # Easy management script
├── init-db.sql            # Database initialization
├── prometheus/
│   └── prometheus.yml     # Prometheus configuration
├── grafana/
│   └── provisioning/      # Grafana dashboards & datasources
└── DOCKER_README.md       # This file
```

## 🔧 Troubleshooting

### Container won't start

```bash
# Check if Docker is running
docker --version

# Check container logs
./docker-dev.sh logs

# Check specific service logs
docker-compose logs postgres
docker-compose logs grafana
```

### Port conflicts

```bash
# Check what's using the ports
netstat -tulpn | grep :5173
netstat -tulpn | grep :3001
```

### Database connection issues

```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready

# Check Redis status
docker-compose exec redis redis-cli ping
```

### Clean rebuild

```bash
# Remove all containers and volumes
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## 🎯 Development Workflow

### Simple Workflow (App Only)

1. **Start container**: `./docker-dev.sh start`
2. **Access app**: http://localhost:5173 (dev server starts automatically)
3. **Stop when done**: `./docker-dev.sh stop`

### Full Stack Workflow

1. **Start all services**: `./docker-dev.sh full-stack`
2. **Access services**:
   - App: http://localhost:5173 (dev server starts automatically)
   - Grafana: http://localhost:3001
   - pgAdmin: http://localhost:5050
3. **Stop when done**: `./docker-dev.sh stop`

**Note**: The development server now starts automatically when containers start up!

## 🚀 Production Build

```bash
# Inside container
npm run build
npm run preview
```

## 📊 Monitoring Setup

### Grafana Dashboards

1. **Access Grafana**: http://localhost:3001
2. **Login**: admin/admin
3. **Add Prometheus datasource**: http://prometheus:9090
4. **Import dashboards** for Node.js, PostgreSQL, Redis

### Prometheus Metrics

1. **Access Prometheus**: http://localhost:9090
2. **Check targets** for all services
3. **View metrics** for application performance

### Database Monitoring

1. **Access pgAdmin**: http://localhost:5050
2. **Login**: admin@localsocialmax.com/admin
3. **Add server**: host=postgres, port=5432, user=postgres

## 📧 Email Configuration

### Mailgun Setup

1. **Sign up** for Mailgun account
2. **Add domain** to your Mailgun account
3. **Get API key** from Mailgun dashboard
4. **Configure environment variables**:
   ```bash
   VITE_MAILGUN_API_KEY=your_api_key
   VITE_MAILGUN_DOMAIN=your_domain.com
   VITE_MAILGUN_REGION=us
   ```

### Email Templates

- **Welcome emails** - User registration
- **Password reset** - Account recovery
- **Email verification** - Account activation
- **Magic link** - Passwordless login

---

**Complete development environment with monitoring, databases, and production email!** 🎉
