#!/bin/bash

# GitHub Spec Kit Setup for GMB Evaluation SaaS
# This script initializes Spec Kit for your existing codebase

echo "🚀 Setting up GitHub Spec Kit for GMB Evaluation SaaS..."

# Create Spec Kit directory structure if it doesn't exist
mkdir -p .spec-kit/{templates,workflows,tasks}

# Check if constitution.md exists
if [ -f "constitution.md" ]; then
    echo "✅ Constitution found - project principles are defined"
else
    echo "❌ Constitution not found - please create constitution.md first"
    exit 1
fi

# Check for specification files
SPEC_COUNT=$(ls -1 *.md 2>/dev/null | grep '^[0-9]' | wc -l)
echo "📋 Found $SPEC_COUNT specification files"

# Validate current project structure
echo "🔍 Validating existing project structure..."

# Check for required files
REQUIRED_FILES=("package.json" "svelte.config.js" "src/lib/supabaseClient.ts" "src/lib/database.types.ts")
for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo "✅ $file found"
    else
        echo "❌ $file missing - please ensure this is run from the project root"
        exit 1
    fi
done

# Check database connection
echo "🔗 Checking Supabase connection..."
if [ -f ".env.local" ] && grep -q "VITE_SUPABASE_URL" .env.local; then
    echo "✅ Supabase environment variables found"
else
    echo "⚠️ Supabase environment variables not found in .env.local"
    echo "Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set"
fi

# Create Spec Kit commands for your coding agent
echo "⚙️ Setting up Spec Kit commands..."

cat > .spec-kit/commands.md << 'EOF'
# Spec Kit Commands for GMB Evaluation SaaS

## Available Commands

### `/constitution`
Review and update project governing principles
- Preserves existing SvelteKit + Supabase architecture
- Maintains multi-tenant CRM functionality
- Ensures AI enhancements are additive only

### `/specify [feature_name]`
Create or update feature specifications
Example: `/specify enhanced-gmb-analysis`
- Builds upon existing CRM schema
- Respects current authentication patterns
- Integrates with existing component structure

### `/plan [specification_file]`
Generate technical implementation plan
Example: `/plan 001-gmb-enhanced-data-acquisition.md`
- Creates database migration scripts
- Designs API endpoint enhancements
- Plans frontend component updates

### `/tasks [plan_file]`
Break implementation plan into actionable tasks
- Generates Supabase migration files
- Creates component implementation tasks
- Plans integration testing scenarios

### `/review [implementation]`
Review implemented code against specifications
- Validates database schema changes
- Checks API endpoint compatibility
- Ensures UI/UX consistency

## Current Specifications

1. `001-gmb-enhanced-data-acquisition.md` - AI-powered lead qualification
2. `002-ai-powered-customer-retention.md` - Intelligent retention campaigns  
3. `003-automation-orchestration-layer.md` - External tool integration

## Project Context

**Current Architecture:**
- SvelteKit frontend with TypeScript
- Supabase backend with PostgreSQL
- Multi-tenant CRM with comprehensive schema
- Authentication with enhanced security
- Existing GMB data collection and analysis

**Enhancement Goals:**
- Add AI-powered lead qualification
- Implement customer retention automation
- Integrate external tools (n8n, Make.com, ClickUp, Apify)
- Deploy MCP servers for Claude integration

**Preservation Requirements:**
- All existing functionality must continue working
- Database changes must be additive only
- Current API endpoints must remain compatible
- Existing user workflows must be preserved
EOF

# Create example workflow for development
cat > .spec-kit/workflows/development-workflow.md << 'EOF'
# Development Workflow with Spec Kit

## 1. Feature Planning
```
/specify "Feature description focusing on user value and business impact"
```

## 2. Technical Design
```
/plan [specification-file]
```

## 3. Implementation Tasks
```
/tasks [plan-file]
```

## 4. Development Process
- Create Supabase migrations for database changes
- Implement API endpoints following existing patterns
- Build frontend components using current architecture
- Add comprehensive tests using Playwright

## 5. Integration Testing
- Test with existing CRM data
- Validate multi-tenant functionality
- Ensure performance meets current standards
- Verify backward compatibility

## 6. Deployment
- Use existing Docker deployment pipeline
- Deploy to development environment first
- Run full test suite including new features
- Deploy to production with rollback plan
EOF

# Create implementation status tracker
cat > .spec-kit/implementation-status.md << 'EOF'
# Implementation Status Tracker

## Specifications
- [ ] 001-gmb-enhanced-data-acquisition.md
- [ ] 002-ai-powered-customer-retention.md  
- [ ] 003-automation-orchestration-layer.md

## Database Migrations
- [ ] ai_lead_qualification table
- [ ] customer_health_scores table
- [ ] workflow_definitions table
- [ ] external_tool_configs table
- [ ] mcp_servers table

## API Enhancements
- [ ] Lead qualification endpoints
- [ ] Customer health scoring endpoints
- [ ] Workflow orchestration endpoints
- [ ] MCP server integration endpoints

## Frontend Components
- [ ] AI insights dashboard
- [ ] Customer health overview
- [ ] Automation configuration
- [ ] External tool status monitoring

## External Integrations
- [ ] n8n workflow templates
- [ ] Make.com scenario templates
- [ ] ClickUp synchronization
- [ ] Apify enhanced data collection
- [ ] MCP server deployment

## Testing
- [ ] Unit tests for new functionality
- [ ] Integration tests with existing CRM
- [ ] End-to-end tests for automation workflows
- [ ] Performance tests for AI processing
EOF

echo "✨ Spec Kit setup complete!"
echo ""
echo "📚 Next Steps:"
echo "1. Review constitution.md to understand project principles"
echo "2. Read the three specification files to understand planned enhancements"
echo "3. Use Spec Kit commands with your coding agent to begin implementation"
echo "4. Start with '/plan 001-gmb-enhanced-data-acquisition.md' to generate implementation details"
echo ""
echo "🎯 Your existing CRM will be enhanced with:"
echo "   • AI-powered lead qualification"
echo "   • Intelligent customer retention"  
echo "   • Automated workflow orchestration"
echo "   • Seamless external tool integration"
echo ""
echo "💡 Remember: All enhancements preserve your existing functionality!"
