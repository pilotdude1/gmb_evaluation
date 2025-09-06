#!/bin/bash

echo "🐳 Setting up PostgreSQL Docker environment..."

# Create necessary directories
mkdir -p postgres/data
mkdir -p postgres/init
mkdir -p uploads
mkdir -p backups

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp env.postgres .env
    echo "⚠️  Please edit .env file with your secure passwords!"
fi

# Generate secure passwords if not set
if grep -q "your_super_secure_password_here" .env; then
    echo "🔐 Generating secure passwords..."
    
    # Generate database password
    DB_PASSWORD=$(openssl rand -base64 32)
    sed -i "s/your_super_secure_password_here/$DB_PASSWORD/" .env
    
    # Generate Redis password
    REDIS_PASSWORD=$(openssl rand -base64 24)
    sed -i "s/another_secure_password/$REDIS_PASSWORD/" .env
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    sed -i "s/your_jwt_secret_key_minimum_32_characters/$JWT_SECRET/" .env
    
    echo "✅ Secure passwords generated and saved to .env"
fi

# Set proper permissions
chmod 600 .env
chmod -R 755 postgres/
chmod -R 755 uploads/

echo "🚀 Starting PostgreSQL and Redis containers..."
docker-compose -f docker-compose-postgres.yml up -d postgres redis

echo "⏳ Waiting for database to initialize..."
sleep 10

echo "✅ PostgreSQL setup complete!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your email settings"
echo "2. Start your SvelteKit app: npm run dev"
echo "3. Test the setup with: npm run test:real-auth"
echo ""
echo "🔗 Database connection:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: sveltekit_app"
echo "   User: app_user"
echo ""
echo "🧪 Test user:"
echo "   Email: test@example.com"
echo "   Password: password123" 