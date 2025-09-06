#!/bin/bash

# SaaS Template Setup Script
# This script helps customize the template for new SaaS projects

echo "🚀 SaaS Development Foundation Setup"
echo "====================================="
echo ""

# Get project details
read -p "Enter your SaaS project name: " PROJECT_NAME
read -p "Enter your project description: " PROJECT_DESCRIPTION
read -p "Enter your name: " AUTHOR_NAME
read -p "Enter your email: " AUTHOR_EMAIL

# Get branding details
read -p "Enter your brand name: " BRAND_NAME
read -p "Enter your tagline: " TAGLINE
read -p "Enter primary color (hex): " PRIMARY_COLOR
read -p "Enter secondary color (hex): " SECONDARY_COLOR

# Get technical details
read -p "Enter your Supabase URL: " SUPABASE_URL
read -p "Enter your Supabase anon key: " SUPABASE_ANON_KEY

# Get Mailgun details
echo ""
echo "📧 Email Configuration (Mailgun)"
read -p "Enter your Mailgun API key: " MAILGUN_API_KEY
read -p "Enter your Mailgun domain: " MAILGUN_DOMAIN
read -p "Enter your Mailgun region (us/eu): " MAILGUN_REGION

echo ""
echo "📝 Updating configuration..."

# Update template-config.json
jq --arg name "$PROJECT_NAME" \
   --arg desc "$PROJECT_DESCRIPTION" \
   --arg author "$AUTHOR_NAME" \
   --arg brand "$BRAND_NAME" \
   --arg tagline "$TAGLINE" \
   --arg primary "$PRIMARY_COLOR" \
   --arg secondary "$SECONDARY_COLOR" \
   '.project.name = $name | .project.description = $desc | .project.author = $author | .branding.name = $brand | .branding.tagline = $tagline | .branding.primaryColor = $primary | .branding.secondaryColor = $secondary' \
   template-config.json > template-config.json.tmp && mv template-config.json.tmp template-config.json

# Update package.json
jq --arg name "$PROJECT_NAME" \
   --arg desc "$PROJECT_DESCRIPTION" \
   --arg author "$AUTHOR_NAME" \
   '.name = $name | .description = $desc | .author = $author' \
   package.json > package.json.tmp && mv package.json.tmp package.json

# Update README.md
sed -i "s/LocalSocialMax/$BRAND_NAME/g" README.md
sed -i "s/Your Social Media Management Platform/$TAGLINE/g" README.md

# Update docker-compose.yml
sed -i "s/localsocialmax/$PROJECT_NAME/g" docker-compose.yml
sed -i "s/LocalSocialMax/$BRAND_NAME/g" docker-compose.yml

# Update .env template
cat > env.template << EOF
# Supabase Configuration
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY

# Database Configuration
DATABASE_URL=postgresql://postgres:password@postgres:5432/$PROJECT_NAME

# Redis Configuration
REDIS_URL=redis://redis:6379

# MinIO Configuration
MINIO_ENDPOINT=minio:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=$PROJECT_NAME

# Mailgun Configuration (Production Email Service)
VITE_MAILGUN_API_KEY=$MAILGUN_API_KEY
VITE_MAILGUN_DOMAIN=$MAILGUN_DOMAIN
VITE_MAILGUN_REGION=${MAILGUN_REGION:-us}

# Application Configuration
NODE_ENV=development
PORT=5173
EOF

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    cp env.template .env
    echo "✅ Created .env file from template"
fi

# Update database initialization
sed -i "s/localsocialmax/$PROJECT_NAME/g" init-db.sql

echo ""
echo "✅ Configuration updated!"
echo ""
echo "🎨 Next steps:"
echo "1. Update colors in src/app.css"
echo "2. Add your logo to static/logo.svg"
echo "3. Customize components in src/lib/components/"
echo "4. Add your business logic to src/routes/"
echo "5. Configure your Supabase project"
echo "6. Set up your Mailgun domain and API key"
echo ""
echo "🚀 Start development:"
echo "  ./docker-dev.sh full-stack"
echo "  ./docker-dev.sh shell"
echo "  npm install"
echo "  npm run dev"
echo ""
echo "🌐 Access your services:"
echo "  App: http://localhost:5173"
echo "  Grafana: http://localhost:3001"
echo "  pgAdmin: http://localhost:5050"
echo ""
echo "📧 Email Configuration:"
echo "  Mailgun API Key: $MAILGUN_API_KEY"
echo "  Mailgun Domain: $MAILGUN_DOMAIN"
echo "  Mailgun Region: ${MAILGUN_REGION:-us}"
echo ""
echo "🎉 Your SaaS foundation is ready!" 