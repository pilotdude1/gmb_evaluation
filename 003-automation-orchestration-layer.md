# 003-automation-orchestration-layer

## What We're Building
Create a unified automation orchestration layer that connects the existing CRM system with external tools (n8n, Make.com, ClickUp, Apify) and MCP servers to enable seamless customer acquisition and retention workflows.

## Current State (Preserve & Enhance)

### Existing Infrastructure
- **Supabase Edge Functions**: Current serverless function architecture
- **API Endpoints**: Existing REST API structure in `src/routes/api`
- **Authentication**: Robust auth system with JWT tokens and session management
- **Database**: Multi-tenant PostgreSQL with comprehensive audit logging
- **Webhook Support**: Basic webhook infrastructure for external integrations

### Current Limitations (To Be Solved)
- Manual data synchronization between systems
- No centralized workflow orchestration
- Limited real-time automation capabilities
- Disconnected external tool integrations

## Enhancement Goals

### 1. Unified Integration Hub
**Current**: Disconnected systems requiring manual coordination  
**Enhanced**: Central orchestration layer managing all external tool interactions

**Success Criteria**:
- Single source of truth for customer data across all platforms
- Real-time synchronization between CRM and external tools
- Automated workflow triggers based on customer lifecycle events

### 2. MCP Server Implementation
**Current**: No AI integration infrastructure  
**Enhanced**: Model Context Protocol servers enabling seamless AI interactions

**Success Criteria**:
- Claude/GPT-4 direct access to CRM data for intelligent analysis
- Natural language queries for customer insights
- AI-powered automation decision making

### 3. Multi-Platform Workflow Automation
**Current**: Manual processes across different tools  
**Enhanced**: Intelligent workflow routing between n8n, Make.com, and internal systems

**Success Criteria**:
- 90% of routine tasks automated across platforms
- Intelligent workflow selection based on complexity and requirements
- Automatic failover between automation platforms

### 4. Real-Time Event Processing
**Current**: Batch processing and manual triggers  
**Enhanced**: Real-time event streaming with intelligent response automation

**Success Criteria**:
- Sub-5-second response time for critical customer events
- Event-driven architecture supporting complex workflow chains
- Intelligent event prioritization and routing

## User Stories

### Business Owners
**As a service business owner**, I want my CRM to automatically coordinate with all my business tools so customer information flows seamlessly between platforms without manual work.

**As a growth-focused entrepreneur**, I want AI to analyze my customer data and automatically trigger the right actions in the right tools at the right time to maximize acquisition and retention.

### Operations Teams
**As an operations manager**, I want a single dashboard showing the status of all automated workflows across different platforms so I can quickly identify and resolve issues.

**As a customer success manager**, I want automated handoffs between marketing, sales, and retention tools based on customer behavior and lifecycle stage.

## Technical Architecture

### Core Components

#### 1. Event Bus Architecture
```typescript
// Central event bus for all customer lifecycle events
interface CustomerEvent {
  eventId: string;
  tenantId: string;
  customerId: string;
  eventType: 'prospect_identified' | 'lead_qualified' | 'customer_onboarded' | 
             'churn_risk_detected' | 'retention_campaign_triggered' | 'deal_closed';
  eventData: Record<string, any>;
  timestamp: Date;
  source: 'crm' | 'n8n' | 'make' | 'clickup' | 'apify' | 'ai_analysis';
  priority: 'low' | 'medium' | 'high' | 'critical';
  workflow_triggers?: string[];
}
```

#### 2. Integration Abstraction Layer
```typescript
// Unified interface for all external tools
interface ExternalTool {
  name: 'n8n' | 'make' | 'clickup' | 'apify';
  capabilities: ToolCapability[];
  executeWorkflow(workflow: WorkflowDefinition): Promise<WorkflowResult>;
  getStatus(): Promise<ToolStatus>;
  validateConnection(): Promise<boolean>;
}

interface WorkflowDefinition {
  id: string;
  name: string;
  trigger: EventTrigger;
  actions: Action[];
  conditions: Condition[];
  errorHandling: ErrorHandler;
}
```

### Database Enhancements (Additive Only)
```sql
-- Workflow Orchestration Tables
CREATE TABLE workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  
  -- Workflow Identity
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'acquisition', 'qualification', 'retention', 'analytics'
  
  -- Trigger Configuration
  trigger_type TEXT NOT NULL, -- 'event', 'schedule', 'webhook', 'manual'
  trigger_conditions JSONB,
  
  -- Execution Configuration
  primary_platform TEXT, -- 'n8n', 'make', 'internal'
  fallback_platform TEXT,
  execution_priority INTEGER DEFAULT 5,
  
  -- Workflow Definition
  workflow_steps JSONB NOT NULL,
  error_handling JSONB,
  retry_policy JSONB,
  
  -- Status and Metadata
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_by UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Workflow Execution Tracking
CREATE TABLE workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_definition_id UUID REFERENCES workflow_definitions(id),
  tenant_id UUID REFERENCES tenants(id),
  
  -- Execution Context
  trigger_event_id UUID,
  execution_platform TEXT,
  customer_id UUID,
  
  -- Execution Details
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed', 'retrying'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Results and Errors
  execution_result JSONB,
  error_details JSONB,
  retry_count INTEGER DEFAULT 0,
  
  -- Performance Metrics
  execution_time_ms INTEGER,
  memory_usage_mb DECIMAL(10,2),
  external_api_calls INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- External Tool Configurations
CREATE TABLE external_tool_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  
  -- Tool Identity
  tool_name TEXT NOT NULL, -- 'n8n', 'make', 'clickup', 'apify'
  tool_version TEXT,
  
  -- Connection Configuration
  api_endpoint TEXT,
  authentication_type TEXT, -- 'api_key', 'oauth', 'webhook_token'
  credentials JSONB, -- Encrypted credential storage
  
  -- Capabilities and Limits
  rate_limits JSONB,
  supported_operations TEXT[],
  webhook_endpoints JSONB,
  
  -- Health and Status
  connection_status TEXT DEFAULT 'active',
  last_health_check TIMESTAMP WITH TIME ZONE,
  health_check_results JSONB,
  
  -- Usage Tracking
  monthly_api_calls INTEGER DEFAULT 0,
  last_api_call TIMESTAMP WITH TIME ZONE,
  error_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- MCP Server Configurations
CREATE TABLE mcp_servers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  
  -- Server Identity
  server_name TEXT NOT NULL,
  server_type TEXT, -- 'supabase', 'n8n', 'custom'
  endpoint_url TEXT,
  
  -- Capabilities
  available_tools JSONB,
  supported_protocols TEXT[],
  
  -- Access Configuration
  access_permissions JSONB,
  rate_limits JSONB,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_accessed TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Event Processing Queue
CREATE TABLE event_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  
  -- Event Details
  event_type TEXT NOT NULL,
  event_data JSONB NOT NULL,
  event_source TEXT,
  
  -- Processing Configuration
  priority INTEGER DEFAULT 5,
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT now(),
  max_retries INTEGER DEFAULT 3,
  
  -- Processing Status
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  attempts INTEGER DEFAULT 0,
  last_attempt TIMESTAMP WITH TIME ZONE,
  
  -- Results
  processing_result JSONB,
  error_details JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## Integration Specifications

### n8n Workflow Templates
Pre-built workflows that integrate with existing CRM data:

#### Lead Qualification Workflow
```yaml
name: "AI Lead Qualification Pipeline"
trigger: 
  type: "webhook"
  endpoint: "/crm/prospect/new"
steps:
  - name: "Extract GMB Data"
    action: "query_supabase"
    table: "crm_accounts"
    fields: ["gmb_data", "industry", "location"]
  
  - name: "AI Analysis"
    action: "call_mcp_server"
    server: "claude_analysis"
    prompt: "Analyze this business for acquisition potential"
  
  - name: "Email Discovery"
    action: "call_anymail_finder"
    input: "company_domain"
  
  - name: "Update CRM"
    action: "update_supabase"
    table: "ai_lead_qualification"
    data: "qualification_results"
  
  - name: "Sync to ClickUp"
    condition: "qualification_score > 80"
    action: "create_clickup_task"
    project: "qualified_prospects"
```

#### Customer Retention Workflow
```yaml
name: "Churn Prevention Automation"
trigger:
  type: "schedule"
  frequency: "daily"
steps:
  - name: "Detect At-Risk Customers"
    action: "query_supabase"
    table: "customer_health_scores"
    filter: "churn_probability > 0.7"
  
  - name: "Generate Retention Strategy"
    action: "call_mcp_server"
    server: "retention_ai"
    prompt: "Create personalized retention plan"
  
  - name: "Trigger Retention Campaign"
    action: "create_campaign"
    platform: "internal_crm"
    type: "retention"
  
  - name: "Schedule Follow-up"
    action: "create_activity"
    type: "follow_up_call"
    due_date: "+3 days"
```

### Make.com Scenario Templates

#### Real-time ClickUp Synchronization
- **Trigger**: New qualified prospect in CRM
- **Actions**: 
  1. Create ClickUp task with prospect details
  2. Set custom fields from AI qualification data
  3. Assign to appropriate team member based on industry
  4. Create follow-up reminders

#### Multi-Channel Campaign Orchestration
- **Trigger**: Customer health score drops below threshold
- **Actions**:
  1. Send personalized email via campaign system
  2. Schedule SMS reminder after 2 days
  3. Create task for account manager
  4. Update customer journey stage

### ClickUp Integration Mappings

#### Custom Field Mappings
```typescript
interface ClickUpFieldMapping {
  crm_field: string;
  clickup_field_id: string;
  data_transformation?: (value: any) => any;
}

const FIELD_MAPPINGS: ClickUpFieldMapping[] = [
  {
    crm_field: 'lead_score',
    clickup_field_id: 'lead_score_field',
    data_transformation: (score) => Math.round(score)
  },
  {
    crm_field: 'qualification_status', 
    clickup_field_id: 'status_field'
  },
  {
    crm_field: 'industry',
    clickup_field_id: 'industry_field'
  }
];
```

#### Project Structure Integration
- **Qualified Prospects**: High-scoring leads ready for outreach
- **Active Customers**: Current clients with health monitoring
- **At-Risk Customers**: Customers requiring retention efforts
- **Completed Deals**: Successful conversions for analysis

### Apify Enhanced Integration

#### Advanced GMB Data Collection
```javascript
// Enhanced Apify actor for comprehensive business intelligence
const GMB_COLLECTION_CONFIG = {
  search_queries: [
    "dentists near [location]",
    "HVAC contractors [location]", 
    "business consultants [location]"
  ],
  data_points: [
    'business_name',
    'rating',
    'review_count',
    'hours',
    'website',
    'phone',
    'address',
    'photos',
    'recent_reviews',
    'competitor_analysis'
  ],
  enrichment_sources: [
    'website_technology_analysis',
    'social_media_presence',
    'online_reputation_monitoring'
  ]
};
```

## MCP Server Implementation

### Supabase MCP Server
Enable Claude/GPT-4 direct access to CRM data:

```typescript
// MCP tools for AI analysis
interface SupabaseMCPTools {
  searchProspects(criteria: SearchCriteria): Promise<Prospect[]>;
  analyzeCustomerHealth(customerId: string): Promise<HealthAnalysis>;
  generateRetentionStrategy(customerId: string): Promise<RetentionPlan>;
  getIndustryBenchmarks(industry: string): Promise<Benchmarks>;
  predictCustomerLifetimeValue(customerId: string): Promise<LTVPrediction>;
}
```

### Custom Analysis MCP Server
AI-powered business intelligence:

```typescript
interface AnalysisMCPTools {
  qualifyLead(businessData: BusinessData): Promise<QualificationResult>;
  analyzeSentiment(reviews: Review[]): Promise<SentimentAnalysis>;
  identifyGrowthSignals(businessData: BusinessData): Promise<GrowthSignals>;
  competitiveAnalysis(business: Business, competitors: Business[]): Promise<CompetitiveInsights>;
}
```

## Success Metrics

### Integration Performance
- **Sync Speed**: Real-time updates between systems (<5 seconds)
- **Reliability**: 99.5% uptime for critical workflows
- **Data Accuracy**: 99%+ accuracy in cross-platform data synchronization

### Automation Efficiency
- **Manual Task Reduction**: 85% reduction in manual coordination tasks
- **Workflow Success Rate**: 95% successful completion of automated workflows
- **Error Recovery**: 90% of failed workflows automatically resolved through retries

### Business Impact
- **Lead Processing Speed**: 80% faster prospect qualification and routing
- **Customer Response Time**: 70% improvement in customer issue response
- **Team Productivity**: 60% increase in team capacity through automation

## Risk Mitigation

### Integration Reliability
- **Fallback Systems**: Automatic failover between n8n and Make.com
- **Data Backup**: Real-time backup of all workflow execution data
- **Health Monitoring**: Continuous monitoring of all external tool connections

### Security and Privacy
- **Encrypted Credentials**: All external tool credentials encrypted at rest
- **Access Control**: Role-based access to different integration capabilities
- **Audit Logging**: Complete audit trail of all automated actions

### Scalability
- **Queue Management**: Intelligent event queue management to handle high volumes
- **Rate Limiting**: Automatic rate limiting to prevent API quota exhaustion
- **Load Balancing**: Distribute workflows across multiple execution platforms

## Implementation Phases

### Phase 1: Core Infrastructure (Week 1-2)
- Deploy event bus architecture
- Implement basic external tool integrations
- Create workflow execution framework

### Phase 2: MCP Server Implementation (Week 3-4)
- Deploy Supabase MCP server
- Implement AI analysis MCP server
- Enable Claude/GPT-4 CRM access

### Phase 3: Workflow Templates (Week 5-6)
- Deploy pre-built n8n workflow templates
- Implement Make.com scenario templates
- Configure ClickUp synchronization

### Phase 4: Advanced Features (Week 7-8)
- Implement intelligent workflow routing
- Deploy advanced error handling and recovery
- Enable real-time performance monitoring

This specification creates a comprehensive automation orchestration layer that transforms your existing CRM into the central hub of an intelligent, automated customer acquisition and retention ecosystem while preserving all current functionality.
