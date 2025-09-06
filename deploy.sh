#!/bin/bash

# LocalSocialMax VPS Deployment Script
# This script sets up and deploys the SvelteKit application to Hostinger VPS2

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="localsocialmax"
DOMAIN="${1:-your-domain.com}"  # Pass domain as first argument
SSL_EMAIL="${2:-admin@your-domain.com}"  # Pass email as second argument

echo -e "${BLUE}🚀 LocalSocialMax VPS Deployment Script${NC}"
echo -e "${YELLOW}Domain: $DOMAIN${NC}"
echo -e "${YELLOW}SSL Email: $SSL_EMAIL${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required packages
print_status "Installing required packages..."
sudo apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release

# Install Docker if not already installed
if ! command -v docker &> /dev/null; then
    print_status "Installing Docker..."
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
    sudo usermod -aG docker $USER
    print_warning "Docker installed. You may need to log out and back in for group changes to take effect."
fi

# Install Docker Compose if not already installed
if ! command -v docker-compose &> /dev/null; then
    print_status "Installing Docker Compose..."
    sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# Install Certbot for SSL certificates
if ! command -v certbot &> /dev/null; then
    print_status "Installing Certbot..."
    sudo apt install -y certbot python3-certbot-nginx
fi

# Create application directory
APP_DIR="/opt/$APP_NAME"
print_status "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Copy application files
print_status "Copying application files..."
cp -r . $APP_DIR/
cd $APP_DIR

# Create environment file
print_status "Creating environment file..."
if [ ! -f .env ]; then
    cat > .env << EOF
# Supabase Configuration
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Mailgun Configuration (optional)
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
MAILGUN_REGION=us

# PostgreSQL Configuration (if using local database)
POSTGRES_PASSWORD=your_secure_password
EOF
    print_warning "Please update .env file with your actual configuration values"
fi

# Create SSL directory
print_status "Setting up SSL directory..."
sudo mkdir -p /etc/nginx/ssl
sudo chown $USER:$USER /etc/nginx/ssl

# Generate self-signed certificate for initial setup
print_status "Generating self-signed SSL certificate..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/nginx/ssl/key.pem \
    -out /etc/nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=$DOMAIN"

# Build and start the application
print_status "Building and starting the application..."
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait for application to start
print_status "Waiting for application to start..."
sleep 30

# Check if application is running
if curl -f http://localhost/health > /dev/null 2>&1; then
    print_status "Application is running successfully!"
else
    print_error "Application failed to start. Check logs with: docker-compose -f docker-compose.prod.yml logs"
    exit 1
fi

# Setup SSL certificate with Let's Encrypt (if domain is provided)
if [ "$DOMAIN" != "your-domain.com" ]; then
    print_status "Setting up SSL certificate with Let's Encrypt..."
    
    # Stop nginx temporarily
    docker-compose -f docker-compose.prod.yml stop nginx
    
    # Create temporary nginx config for certbot
    cat > nginx-temp.conf << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://\$host\$request_uri;
    }
}
EOF
    
    # Start temporary nginx for certbot
    docker run -d --name nginx-temp \
        -p 80:80 \
        -v $(pwd)/nginx-temp.conf:/etc/nginx/conf.d/default.conf \
        -v /var/www/certbot:/var/www/certbot \
        nginx:alpine
    
    # Create certbot directory
    sudo mkdir -p /var/www/certbot
    
    # Get SSL certificate
    sudo certbot certonly --webroot \
        --webroot-path=/var/www/certbot \
        --email $SSL_EMAIL \
        --agree-tos \
        --no-eff-email \
        -d $DOMAIN
    
    # Stop temporary nginx
    docker stop nginx-temp
    docker rm nginx-temp
    
    # Copy certificates
    sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem /etc/nginx/ssl/cert.pem
    sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem /etc/nginx/ssl/key.pem
    sudo chown $USER:$USER /etc/nginx/ssl/*
    
    # Restart nginx
    docker-compose -f docker-compose.prod.yml up -d nginx
    
    print_status "SSL certificate installed successfully!"
else
    print_warning "Using self-signed certificate. Update domain and run certbot manually for production SSL."
fi

# Setup automatic SSL renewal
if [ "$DOMAIN" != "your-domain.com" ]; then
    print_status "Setting up automatic SSL renewal..."
    
    # Create renewal script
    cat > renew-ssl.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
docker cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx:/etc/nginx/ssl/cert.pem
docker cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx:/etc/nginx/ssl/key.pem
docker exec nginx nginx -s reload
EOF
    
    # Replace domain placeholder
    sed -i "s/your-domain.com/$DOMAIN/g" renew-ssl.sh
    chmod +x renew-ssl.sh
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 12 * * * $APP_DIR/renew-ssl.sh") | crontab -
fi

# Setup log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/$APP_NAME << EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker-compose -f $APP_DIR/docker-compose.prod.yml restart nginx
    endscript
}
EOF

# Create management scripts
print_status "Creating management scripts..."

# Start script
cat > start.sh << 'EOF'
#!/bin/bash
cd /opt/localsocialmax
docker-compose -f docker-compose.prod.yml up -d
echo "Application started!"
EOF
chmod +x start.sh

# Stop script
cat > stop.sh << 'EOF'
#!/bin/bash
cd /opt/localsocialmax
docker-compose -f docker-compose.prod.yml down
echo "Application stopped!"
EOF
chmod +x stop.sh

# Restart script
cat > restart.sh << 'EOF'
#!/bin/bash
cd /opt/localsocialmax
docker-compose -f docker-compose.prod.yml restart
echo "Application restarted!"
EOF
chmod +x restart.sh

# Logs script
cat > logs.sh << 'EOF'
#!/bin/bash
cd /opt/localsocialmax
docker-compose -f docker-compose.prod.yml logs -f
EOF
chmod +x logs.sh

# Update script
cat > update.sh << 'EOF'
#!/bin/bash
cd /opt/localsocialmax
git pull origin main
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
echo "Application updated!"
EOF
chmod +x update.sh

print_status "Deployment completed successfully!"
echo ""
echo -e "${GREEN}🎉 Your LocalSocialMax application is now running!${NC}"
echo ""
echo -e "${BLUE}📋 Next steps:${NC}"
echo "1. Update the .env file with your actual Supabase credentials"
echo "2. Configure your domain DNS to point to this server"
echo "3. Update the domain in nginx.conf if needed"
echo ""
echo -e "${BLUE}🔧 Management commands:${NC}"
echo "  ./start.sh    - Start the application"
echo "  ./stop.sh     - Stop the application"
echo "  ./restart.sh  - Restart the application"
echo "  ./logs.sh     - View application logs"
echo "  ./update.sh   - Update and restart the application"
echo ""
echo -e "${BLUE}🌐 Access your application:${NC}"
if [ "$DOMAIN" != "your-domain.com" ]; then
    echo "  https://$DOMAIN"
else
    echo "  http://$(curl -s ifconfig.me):80 (HTTP)"
    echo "  https://$(curl -s ifconfig.me):443 (HTTPS with self-signed cert)"
fi
echo ""
echo -e "${YELLOW}⚠️  Important:${NC}"
echo "- Update your .env file with real credentials before using in production"
echo "- Consider setting up a firewall (ufw) for additional security"
echo "- Monitor your application logs regularly"
echo "- Set up automated backups for your data" 