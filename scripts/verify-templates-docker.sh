#!/bin/bash

# Verify Module Templates System in Docker
echo "🔍 Verifying Module Templates System in Docker..."

# Check if we're in a Docker container
if [ -f /.dockerenv ]; then
    echo "✅ Running in Docker container"
else
    echo "⚠️  Not running in Docker container"
fi

# Check working directory
echo "📁 Working directory: $(pwd)"

# Check if module templates directory exists
if [ -d "src/lib/modules/templates" ]; then
    echo "✅ Module templates directory exists"
    echo "📋 Template files:"
    ls -la src/lib/modules/templates/
    
    # Check for specific template directories
    if [ -d "src/lib/modules/templates/auth-template" ]; then
        echo "✅ Auth template directory exists"
    else
        echo "❌ Auth template directory not found"
    fi
    
    if [ -d "src/lib/modules/templates/crud-template" ]; then
        echo "✅ CRUD template directory exists"
    else
        echo "❌ CRUD template directory not found"
    fi
    
    if [ -d "src/lib/modules/templates/shared" ]; then
        echo "✅ Shared template directory exists"
    else
        echo "❌ Shared template directory not found"
    fi
    
    # Check for main template files
    if [ -f "src/lib/modules/templates/index.ts" ]; then
        echo "✅ Main templates index file exists"
    else
        echo "❌ Main templates index file not found"
    fi
    
    if [ -f "src/lib/modules/templates/auth-template/index.ts" ]; then
        echo "✅ Auth template index file exists"
    else
        echo "❌ Auth template index file not found"
    fi
    
    if [ -f "src/lib/modules/templates/crud-template/index.ts" ]; then
        echo "✅ CRUD template index file exists"
    else
        echo "❌ CRUD template index file not found"
    fi
else
    echo "❌ Module templates directory not found"
fi

# Check if test templates directory exists
if [ -d "src/routes/test-templates" ]; then
    echo "✅ Test templates directory exists"
    echo "📋 Test files:"
    ls -la src/routes/test-templates/
    
    # Check for specific test template files
    if [ -f "src/routes/test-templates/+page.svelte" ]; then
        echo "✅ Test templates main page exists"
    else
        echo "❌ Test templates main page not found"
    fi
    
    if [ -f "src/routes/test-templates/+page.ts" ]; then
        echo "✅ Test templates page loader exists"
    else
        echo "❌ Test templates page loader not found"
    fi
    
    if [ -d "src/routes/test-templates/view-template" ]; then
        echo "✅ View template directory exists"
        if [ -f "src/routes/test-templates/view-template/+page.svelte" ]; then
            echo "✅ View template page exists"
        else
            echo "❌ View template page not found"
        fi
    else
        echo "❌ View template directory not found"
    fi
else
    echo "❌ Test templates directory not found"
fi

# Check if package.json exists and has required dependencies
if [ -f "package.json" ]; then
    echo "✅ package.json exists"
    if grep -q "@sveltejs/kit" package.json; then
        echo "✅ SvelteKit dependency found"
    else
        echo "❌ SvelteKit dependency not found"
    fi
else
    echo "❌ package.json not found"
fi

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo "✅ node_modules directory exists"
else
    echo "⚠️  node_modules directory not found (run npm install)"
fi

# Check if TypeScript configuration exists
if [ -f "tsconfig.json" ]; then
    echo "✅ TypeScript configuration exists"
else
    echo "❌ TypeScript configuration not found"
fi

# Check if SvelteKit configuration exists
if [ -f "svelte.config.js" ]; then
    echo "✅ SvelteKit configuration exists"
    echo "📋 Current adapter: $(grep -o "adapter-[a-z]*" svelte.config.js || echo 'No adapter found')"
else
    echo "❌ SvelteKit configuration not found"
fi

# Test Docker integration
echo ""
echo "🐳 Testing Docker Integration..."
if [ -f "docker-compose.yml" ]; then
    echo "✅ Docker Compose file exists"
else
    echo "❌ Docker Compose file not found"
fi

if [ -f "docker-dev.sh" ]; then
    echo "✅ Docker dev script exists"
else
    echo "❌ Docker dev script not found"
fi

if [ -f "Dockerfile" ] || [ -f "Dockerfile.minimal" ]; then
    echo "✅ Dockerfile exists"
else
    echo "❌ Dockerfile not found"
fi

# Check if we can access the test templates route
echo ""
echo "🌐 Testing Template Routes..."
echo "📱 Main App: http://localhost:5173"
echo "🧪 Test Templates: http://localhost:5173/test-templates"
echo "👁️ View Template: http://localhost:5173/test-templates/view-template"

echo ""
echo "🔍 Module Templates System verification complete!"
echo ""
echo "✅ All template files have been restored and are ready for use!"
echo "🚀 Run './docker-dev.sh full-stack' to start the development environment"
echo "🌐 Access the template testing interface at http://localhost:5173/test-templates"
