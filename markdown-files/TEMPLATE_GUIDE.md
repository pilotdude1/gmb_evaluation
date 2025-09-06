# 🚀 SaaS Development Foundation - Template Guide

This guide explains how to use this SaaS development foundation as a template for your own projects.

## 🎯 What You Get

### ✅ **Complete Development Environment**

- **SvelteKit** application with TypeScript
- **Supabase** authentication and database
- **Docker** containerized development
- **Monitoring** with Grafana and Prometheus
- **Testing** with Playwright and Vitest

### ✅ **Production-Ready Features**

- User authentication (email, social, magic link)
- Database with Row Level Security
- File storage with MinIO
- Email testing with MailHog
- Performance monitoring
- Error tracking

### ✅ **Developer Experience**

- Hot reload development
- Type-safe development
- Code formatting and linting
- Database administration tools
- Comprehensive logging

## 🚀 Quick Start for New Projects

### 1. **Clone the Template**

```bash
# Clone this repository
git clone <your-template-repo> my-new-saas
cd my-new-saas

# Run the setup script
./setup-template.sh
```

### 2. **Customize Your Project**

The setup script will ask for:

- Project name and description
- Brand name and tagline
- Color scheme
- Supabase credentials

### 3. **Start Development**

```bash
# Start the full development stack
./docker-dev.sh full-stack

# Open a shell in the container
./docker-dev.sh shell

# Install dependencies and start development
npm install
npm run dev
```

## 🎨 Customization Guide

### **Branding & Design**

```bash
# Update colors in src/app.css
# Modify tailwind.config.cjs for theme
# Replace logo in static/logo.svg
# Update favicon in static/favicon.svg
```

### **Database Schema**

```sql
-- Add your custom tables to init-db.sql
-- Example:
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Authentication**

```typescript
// Configure in src/lib/supabaseClient.ts
// Add custom auth providers
// Modify user profile fields
```

### **Business Logic**

```typescript
// Add routes in src/routes/
// Create components in src/lib/components/
// Add API endpoints in src/routes/api/
```

## 📊 Monitoring Setup

### **Grafana Dashboards**

1. Access: http://localhost:3001 (admin/admin)
2. Add Prometheus datasource: http://prometheus:9090
3. Import dashboards for:
   - Node.js application metrics
   - PostgreSQL database metrics
   - Redis cache metrics
   - Custom business metrics

### **Custom Metrics**

```typescript
// Add custom metrics to your application
import { register, Counter, Histogram } from 'prom-client';

const userRegistrations = new Counter({
  name: 'user_registrations_total',
  help: 'Total number of user registrations',
});

const requestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
});
```

## 🗄️ Database Management

### **pgAdmin Access**

- URL: http://localhost:5050
- Email: admin@localsocialmax.com
- Password: admin
- Server: postgres:5432

### **Database Schema**

```sql
-- Core tables included:
-- - profiles (user profiles)
-- - sessions (user sessions)
-- - audit_log (activity tracking)

-- Add your custom tables:
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id),
    plan_name TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🧪 Testing Strategy

### **Unit Tests**

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch
```

### **Integration Tests**

```bash
# Run Playwright tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- tests/auth.spec.ts
```

### **Database Tests**

```bash
# Test database connections
docker-compose exec postgres pg_isready

# Test Redis connections
docker-compose exec redis redis-cli ping
```

## 🚀 Deployment Options

### **Vercel (Recommended)**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### **Netlify**

```bash
# Build for production
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=build
```

### **Railway**

```bash
# Connect to Railway
railway login
railway link
railway up
```

### **Docker Production**

```bash
# Build production image
docker build -f Dockerfile.prod -t my-saas-app .

# Run production container
docker run -p 3000:3000 my-saas-app
```

## 🔧 Environment Configuration

### **Development Environment**

```bash
# .env file for development
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
DATABASE_URL=postgresql://postgres:password@postgres:5432/myapp
REDIS_URL=redis://redis:6379
```

### **Production Environment**

```bash
# Production environment variables
NODE_ENV=production
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_production_key
DATABASE_URL=your_production_database_url
REDIS_URL=your_production_redis_url
```

## 📈 SaaS Best Practices

### **Security**

- ✅ Row Level Security (RLS) enabled
- ✅ Input validation on all forms
- ✅ CSRF protection
- ✅ Rate limiting
- ✅ Secure headers

### **Performance**

- ✅ Database indexing
- ✅ Redis caching
- ✅ Image optimization
- ✅ Code splitting
- ✅ CDN ready

### **Monitoring**

- ✅ Error tracking
- ✅ Performance metrics
- ✅ User analytics
- ✅ Business metrics
- ✅ Infrastructure health

## 🔄 Template Updates

### **Keeping Up to Date**

```bash
# Pull latest template changes
git pull origin main

# Merge your customizations
git merge your-feature-branch

# Update dependencies
npm update
```

### **Template Versioning**

- Template version: 1.0.0
- SvelteKit version: Latest
- Supabase version: Latest
- Docker images: Latest stable

## 🛠️ Troubleshooting

### **Common Issues**

#### **Port Conflicts**

```bash
# Check what's using ports
netstat -tulpn | grep :5173

# Use different ports in docker-compose.yml
```

#### **Database Connection Issues**

```bash
# Check PostgreSQL status
docker-compose exec postgres pg_isready

# Check Redis status
docker-compose exec redis redis-cli ping
```

#### **Authentication Issues**

```bash
# Verify Supabase configuration
# Check .env file
# Test Supabase connection
```

### **Performance Issues**

```bash
# Check container resources
docker stats

# Monitor application logs
./docker-dev.sh logs

# Check Grafana dashboards
# http://localhost:3001
```

## 📚 Additional Resources

### **Documentation**

- [SvelteKit Documentation](https://kit.svelte.dev/)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)

### **Community**

- [Svelte Discord](https://discord.gg/svelte)
- [Supabase Discord](https://discord.supabase.com/)
- [SvelteKit GitHub](https://github.com/sveltejs/kit)

### **Tools & Services**

- [Vercel](https://vercel.com/) - Deployment
- [Netlify](https://netlify.com/) - Deployment
- [Railway](https://railway.app/) - Deployment
- [Supabase](https://supabase.com/) - Backend
- [Grafana](https://grafana.com/) - Monitoring

---

**Ready to build your next SaaS success!** 🚀

This template provides everything you need to build, monitor, and scale your SaaS applications with modern best practices and a complete development environment.
