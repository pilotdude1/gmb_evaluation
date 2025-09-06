# LocalSocialMax VPS Deployment Guide

This guide will help you deploy your LocalSocialMax SvelteKit application to your Hostinger VPS2 package.

## Prerequisites

- Hostinger VPS2 package with Ubuntu 20.04+ or CentOS 8+
- SSH access to your VPS
- A domain name (optional, but recommended for SSL)
- Supabase project credentials

## Quick Deployment

### 1. Upload Your Code

**Option A: Using Git (Recommended)**
```bash
# On your VPS
cd /opt
git clone https://github.com/your-username/module_base-2.git localsocialmax
cd localsocialmax
```

**Option B: Using SCP/SFTP**
```bash
# From your local machine
scp -r /path/to/your/project user@your-vps-ip:/opt/localsocialmax
```

### 2. Run the Deployment Script

```bash
# Make the script executable
chmod +x deploy.sh

# Run with your domain (optional)
./deploy.sh your-domain.com admin@your-domain.com

# Or run without domain (will use self-signed SSL)
./deploy.sh
```

### 3. Configure Environment Variables

Edit the `.env` file with your actual credentials:

```bash
nano .env
```

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mailgun Configuration (optional)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_REGION=us

# PostgreSQL Configuration (if using local database)
POSTGRES_PASSWORD=your_secure_password
```

### 4. Restart the Application

```bash
./restart.sh
```

## Manual Deployment Steps

If you prefer to deploy manually or the script doesn't work:

### 1. System Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y curl wget git unzip software-properties-common

# Install Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add user to docker group
sudo usermod -aG docker $USER
# Log out and back in for group changes to take effect
```

### 2. Application Setup

```bash
# Create application directory
sudo mkdir -p /opt/localsocialmax
sudo chown $USER:$USER /opt/localsocialmax

# Copy your application files
cp -r . /opt/localsocialmax/
cd /opt/localsocialmax

# Create environment file
cp env.example .env
# Edit .env with your credentials
nano .env
```

### 3. SSL Certificate Setup

**For Let's Encrypt (recommended):**
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate (replace with your domain)
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo mkdir -p /etc/nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem /etc/nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem /etc/nginx/ssl/key.pem
sudo chown $USER:$USER /etc/nginx/ssl/*
```

**For self-signed certificate (development):**
```bash
# Generate self-signed certificate
sudo mkdir -p /etc/nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### 4. Deploy with Docker

```bash
# Build and start the application
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Check if it's running
docker-compose -f docker-compose.prod.yml ps
```

## Configuration Options

### Using Supabase (Recommended)

Your application is already configured to use Supabase. Just update the `.env` file with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Using Local PostgreSQL

If you want to use a local PostgreSQL database instead of Supabase:

1. Uncomment the postgres service in `docker-compose.prod.yml`
2. Update the environment variables
3. Run with database profile:

```bash
docker-compose -f docker-compose.prod.yml --profile database up -d
```

### Custom Domain Configuration

1. Update the `nginx.conf` file with your domain
2. Update SSL certificate paths
3. Configure DNS to point to your VPS IP

## Management Commands

The deployment script creates several management scripts:

```bash
./start.sh      # Start the application
./stop.sh       # Stop the application
./restart.sh    # Restart the application
./logs.sh       # View application logs
./update.sh     # Update and restart the application
```

## Monitoring and Maintenance

### View Logs
```bash
# Application logs
./logs.sh

# Specific service logs
docker-compose -f docker-compose.prod.yml logs app
docker-compose -f docker-compose.prod.yml logs nginx
```

### Health Check
```bash
# Check application health
curl http://localhost/health

# Check container status
docker-compose -f docker-compose.prod.yml ps
```

### SSL Certificate Renewal

If using Let's Encrypt, certificates auto-renew. Manual renewal:

```bash
sudo certbot renew
./renew-ssl.sh
```

### Backup

Create regular backups of your application:

```bash
# Backup application data
tar -czf backup-$(date +%Y%m%d).tar.gz /opt/localsocialmax

# Backup database (if using local PostgreSQL)
docker exec localsocialmax-postgres pg_dump -U postgres localsocialmax > backup-$(date +%Y%m%d).sql
```

## Security Considerations

### Firewall Setup
```bash
# Install UFW
sudo apt install ufw

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update application
./update.sh
```

### Monitoring
- Set up log monitoring
- Configure alerts for disk space and memory usage
- Monitor SSL certificate expiration

## Troubleshooting

### Application Won't Start
```bash
# Check logs
./logs.sh

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Rebuild containers
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### SSL Issues
```bash
# Check certificate validity
openssl x509 -in /etc/nginx/ssl/cert.pem -text -noout

# Test nginx configuration
docker exec localsocialmax-nginx nginx -t
```

### Performance Issues
```bash
# Check resource usage
docker stats

# Check nginx access logs
docker exec localsocialmax-nginx tail -f /var/log/nginx/access.log
```

## Integration with n8n

Since you already have n8n running on your VPS, you can integrate it with your LocalSocialMax application:

1. **API Integration**: Use n8n to create workflows that interact with your application's API endpoints
2. **Database Integration**: If using local PostgreSQL, n8n can directly connect to the same database
3. **Email Automation**: Use n8n with Mailgun for automated email workflows
4. **Monitoring**: Create n8n workflows to monitor your application health and send alerts

### Example n8n Workflow Integration

Create a workflow in n8n that:
- Monitors your application's health endpoint
- Sends notifications when the application is down
- Automatically restarts the application if needed
- Logs performance metrics

## Support

If you encounter issues:

1. Check the application logs: `./logs.sh`
2. Verify your environment configuration
3. Ensure all required ports are open
4. Check SSL certificate validity
5. Verify DNS configuration

For additional help, check the application's documentation or create an issue in the repository. 