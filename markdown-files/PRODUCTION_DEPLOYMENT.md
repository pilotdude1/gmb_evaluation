# Production Deployment Guide

This guide covers deploying the LocalSocialMax SvelteKit application to production using Docker.

## Overview

The production setup includes:

- **Multi-stage Docker build** for optimized image size
- **Nginx reverse proxy** with SSL termination and security headers
- **Health checks** and monitoring
- **Resource limits** and security best practices
- **Optional PostgreSQL and Redis** services

## Prerequisites

1. **Docker and Docker Compose** installed on your server
2. **Supabase project** configured with authentication
3. **SSL certificates** for HTTPS (Let's Encrypt recommended)
4. **Domain name** pointing to your server

## Quick Start

1. **Clone and setup environment:**

   ```bash
   git clone <your-repo>
   cd module_base-2
   cp env.production.template .env
   ```

2. **Configure environment variables:**
   Edit `.env` file with your actual values:

   ```bash
   # Required
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   CSRF_SECRET=your_32_character_secret
   JWT_SECRET=your_32_character_secret

   # Optional
   MAILGUN_API_KEY=your_mailgun_key
   MAILGUN_DOMAIN=your_domain
   ```

3. **Deploy:**
   ```bash
   ./deploy-production.sh
   ```

## Manual Deployment

If you prefer manual deployment:

```bash
# Build and start services
docker-compose -f docker-compose.production.yml up --build -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

## Architecture

### Services

1. **app** - SvelteKit application (Node.js)

   - Port: 3000 (internal)
   - Memory limit: 512MB
   - CPU limit: 0.5 cores

2. **nginx** - Reverse proxy and static file server

   - Ports: 80 (HTTP), 443 (HTTPS)
   - SSL termination
   - Security headers
   - Rate limiting

3. **postgres** (optional) - Database

   - Only if not using Supabase
   - Memory limit: 256MB

4. **redis** (optional) - Caching and sessions
   - Memory limit: 128MB

### Network

- **app-network**: Bridge network (172.20.0.0/16)
- Internal communication between services
- External access only through nginx

## Security Features

### Application Security

- Non-root user execution
- Signal handling with dumb-init
- Environment variable validation
- CSRF protection
- JWT authentication

### Nginx Security

- SSL/TLS termination
- Security headers (HSTS, CSP, etc.)
- Rate limiting on API endpoints
- Request size limits
- Gzip compression

### Container Security

- Minimal Alpine Linux base
- No unnecessary packages
- Read-only filesystem where possible
- Resource limits
- Health checks

## SSL Configuration

### Using Let's Encrypt (Recommended)

1. **Install Certbot:**

   ```bash
   sudo apt install certbot
   ```

2. **Generate certificates:**

   ```bash
   sudo certbot certonly --standalone -d yourdomain.com
   ```

3. **Copy certificates:**

   ```bash
   sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/cert.pem
   sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/key.pem
   sudo chown $USER:$USER ./ssl/*
   ```

4. **Update nginx.conf** with your domain name

### Self-Signed Certificates (Development)

```bash
mkdir ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout ssl/key.pem -out ssl/cert.pem
```

## Monitoring and Maintenance

### Health Checks

- Application: `http://localhost:3000/health`
- Nginx: `http://localhost/health`

### Logs

```bash
# Application logs
docker-compose -f docker-compose.production.yml logs -f app

# Nginx logs
docker-compose -f docker-compose.production.yml logs -f nginx

# All services
docker-compose -f docker-compose.production.yml logs -f
```

### Updates

```bash
# Pull latest code
git pull

# Rebuild and restart
./deploy-production.sh
```

### Backup

```bash
# Database backup (if using local PostgreSQL)
docker-compose -f docker-compose.production.yml exec postgres pg_dump -U postgres localsocialmax > backup.sql

# Application data backup
docker-compose -f docker-compose.production.yml exec app tar -czf /tmp/app-backup.tar.gz /app/build
docker cp $(docker-compose -f docker-compose.production.yml ps -q app):/tmp/app-backup.tar.gz .
```

## Performance Optimization

### Application

- Multi-stage Docker build
- Production dependencies only
- Node.js memory optimization
- Gzip compression

### Nginx

- Static file caching
- Gzip compression
- Connection pooling
- Rate limiting

### Database (if using local PostgreSQL)

- Connection pooling
- Query optimization
- Index optimization

## Troubleshooting

### Common Issues

1. **Application won't start:**

   ```bash
   docker-compose -f docker-compose.production.yml logs app
   ```

2. **SSL certificate errors:**

   - Check certificate paths in nginx.conf
   - Verify certificate permissions
   - Ensure domain name matches

3. **Database connection issues:**

   - Verify Supabase credentials
   - Check network connectivity
   - Review database logs

4. **Memory issues:**
   - Increase memory limits in docker-compose.production.yml
   - Monitor with `docker stats`

### Debug Mode

```bash
# Run with debug logging
NODE_ENV=development docker-compose -f docker-compose.production.yml up
```

## Scaling

### Horizontal Scaling

1. **Load Balancer:**

   - Use nginx upstream configuration
   - Multiple app instances
   - Session affinity if needed

2. **Database Scaling:**
   - Use Supabase (managed scaling)
   - Or PostgreSQL clustering

### Vertical Scaling

1. **Increase Resources:**

   ```yaml
   deploy:
     resources:
       limits:
         memory: 1G
         cpus: '1.0'
   ```

2. **Optimize Application:**
   - Enable clustering
   - Use PM2 for process management
   - Implement caching strategies

## Security Checklist

- [ ] SSL certificates installed and valid
- [ ] Environment variables secured
- [ ] Firewall configured (ports 80, 443 only)
- [ ] Regular security updates
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting setup
- [ ] Rate limiting configured
- [ ] Security headers enabled
- [ ] Non-root user execution
- [ ] Resource limits set

## Support

For issues and questions:

1. Check logs: `docker-compose -f docker-compose.production.yml logs`
2. Verify configuration: `docker-compose -f docker-compose.production.yml config`
3. Test connectivity: `curl -I http://localhost:3000/health`
4. Review this documentation
5. Check GitHub issues
