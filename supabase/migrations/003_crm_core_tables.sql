-- =====================================================
-- CRM CORE TABLES - Extends existing GMB Evaluation project
-- =====================================================

-- Enable additional extensions for CRM functionality
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- =====================================================
-- ACCOUNTS TABLE - Business entities (can have multiple contacts)
-- =====================================================
CREATE TABLE crm_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Basic Business Information
    name VARCHAR NOT NULL,
    legal_name VARCHAR,
    website VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    
    -- Address Information
    address_line1 VARCHAR,
    address_line2 VARCHAR,
    city VARCHAR,
    state VARCHAR,
    postal_code VARCHAR,
    country VARCHAR DEFAULT 'US',
    
    -- Business Classification
    industry VARCHAR, -- 'event_planning', 'pet_care', 'landscape', etc.
    business_type VARCHAR DEFAULT 'prospect', -- 'prospect', 'customer', 'partner', 'competitor'
    employee_count_range VARCHAR, -- '1-10', '11-50', '51-200', etc.
    annual_revenue_range VARCHAR, -- '<100k', '100k-500k', '500k-1M', etc.
    
    -- GMB Integration Data
    gmb_place_id VARCHAR UNIQUE, -- Google My Business Place ID
    gmb_data JSONB DEFAULT '{}', -- Raw GMB data from scraping
    gmb_rating DECIMAL(2,1),
    gmb_review_count INTEGER DEFAULT 0,
    gmb_claimed BOOLEAN DEFAULT false,
    gmb_last_updated TIMESTAMP,
    
    -- Business Intelligence
    lead_score INTEGER DEFAULT 0, -- 0-100 score based on multiple factors
    qualification_status VARCHAR DEFAULT 'unqualified', -- 'unqualified', 'marketing_qualified', 'sales_qualified'
    
    -- Custom Fields (Vertical-specific data)
    custom_fields JSONB DEFAULT '{}',
    
    -- System fields
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id), -- Sales rep assignment
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(name, '') || ' ' ||
            COALESCE(legal_name, '') || ' ' ||
            COALESCE(city, '') || ' ' ||
            COALESCE(industry, '')
        )
    ) STORED
);

-- =====================================================
-- CONTACTS TABLE - Extends existing customers table concept
-- =====================================================
CREATE TABLE crm_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID REFERENCES crm_accounts(id) ON DELETE SET NULL,
    
    -- Personal Information
    first_name VARCHAR,
    last_name VARCHAR,
    full_name VARCHAR GENERATED ALWAYS AS (
        TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
    ) STORED,
    
    -- Contact Information
    email VARCHAR,
    phone VARCHAR,
    mobile_phone VARCHAR,
    
    -- Professional Information
    job_title VARCHAR,
    department VARCHAR,
    
    -- Contact Preferences
    preferred_contact_method VARCHAR DEFAULT 'email', -- 'email', 'phone', 'sms'
    timezone VARCHAR DEFAULT 'America/New_York',
    do_not_call BOOLEAN DEFAULT false,
    do_not_email BOOLEAN DEFAULT false,
    do_not_sms BOOLEAN DEFAULT false,
    
    -- Lead Information
    lead_source VARCHAR, -- 'gmb_scraping', 'referral', 'website', 'cold_outreach'
    lead_status VARCHAR DEFAULT 'new', -- 'new', 'contacted', 'qualified', 'opportunity', 'customer'
    lead_score INTEGER DEFAULT 0,
    
    -- Engagement Tracking
    last_contacted_at TIMESTAMP,
    last_contact_method VARCHAR,
    total_interactions INTEGER DEFAULT 0,
    email_opens INTEGER DEFAULT 0,
    email_clicks INTEGER DEFAULT 0,
    
    -- Custom Fields (Vertical-specific)
    custom_fields JSONB DEFAULT '{}',
    
    -- System fields
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT unique_tenant_email UNIQUE(tenant_id, email),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(first_name, '') || ' ' ||
            COALESCE(last_name, '') || ' ' ||
            COALESCE(email, '') || ' ' ||
            COALESCE(job_title, '')
        )
    ) STORED
);

-- =====================================================
-- DEALS/OPPORTUNITIES TABLE - Sales pipeline management
-- =====================================================
CREATE TABLE crm_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID REFERENCES crm_accounts(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
    
    -- Deal Information
    name VARCHAR NOT NULL,
    description TEXT,
    deal_value DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR DEFAULT 'USD',
    
    -- Pipeline Management
    stage VARCHAR DEFAULT 'prospecting', -- Customizable per tenant
    probability INTEGER DEFAULT 0, -- 0-100 percentage
    expected_close_date DATE,
    actual_close_date DATE,
    
    -- Deal Classification
    deal_type VARCHAR, -- 'new_business', 'upsell', 'renewal'
    lead_source VARCHAR,
    
    -- Custom Fields (Vertical-specific deal data)
    custom_fields JSONB DEFAULT '{}',
    
    -- System fields
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(name, '') || ' ' ||
            COALESCE(description, '')
        )
    ) STORED
);

-- =====================================================
-- ACTIVITIES TABLE - All interactions and touchpoints
-- =====================================================
CREATE TABLE crm_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID REFERENCES crm_accounts(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
    
    -- Activity Classification
    activity_type VARCHAR NOT NULL, -- 'email', 'call', 'meeting', 'note', 'task', 'sms'
    activity_subtype VARCHAR, -- 'inbound_call', 'outbound_email', etc.
    
    -- Activity Content
    subject VARCHAR,
    description TEXT,
    
    -- Activity Metadata
    direction VARCHAR, -- 'inbound', 'outbound'
    channel VARCHAR, -- 'email', 'phone', 'sms', 'in_person', 'video'
    
    -- Scheduling (for tasks and meetings)
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT false,
    
    -- External Integration Data
    external_id VARCHAR, -- ID from email provider, calendar, etc.
    integration_source VARCHAR, -- 'mailgun', 'twilio', 'google_calendar'
    integration_data JSONB DEFAULT '{}',
    
    -- System fields
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CAMPAIGNS TABLE - Marketing campaign tracking
-- =====================================================
CREATE TABLE crm_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Campaign Information
    name VARCHAR NOT NULL,
    description TEXT,
    campaign_type VARCHAR NOT NULL, -- 'email', 'sms', 'multi_channel', 'drip'
    
    -- Campaign Configuration
    target_audience JSONB DEFAULT '{}', -- Segmentation criteria
    content_template JSONB DEFAULT '{}', -- Email/SMS templates
    
    -- Campaign Status
    status VARCHAR DEFAULT 'draft', -- 'draft', 'scheduled', 'running', 'paused', 'completed'
    scheduled_start TIMESTAMP,
    actual_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    actual_end TIMESTAMP,
    
    -- Campaign Metrics
    total_recipients INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    sms_sent INTEGER DEFAULT 0,
    sms_delivered INTEGER DEFAULT 0,
    
    -- Integration Data
    external_campaign_ids JSONB DEFAULT '{}', -- IDs from Mailgun, Twilio, etc.
    
    -- System fields
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CAMPAIGN MEMBERSHIPS - Who is in which campaigns
-- =====================================================
CREATE TABLE crm_campaign_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES crm_campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
    
    -- Membership Status
    status VARCHAR DEFAULT 'active', -- 'active', 'unsubscribed', 'bounced', 'completed'
    joined_at TIMESTAMP DEFAULT NOW(),
    
    -- Individual Metrics
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    sms_sent INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMP,
    
    UNIQUE(campaign_id, contact_id)
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================

-- Accounts indexes
CREATE INDEX idx_crm_accounts_tenant ON crm_accounts(tenant_id);
CREATE INDEX idx_crm_accounts_industry ON crm_accounts(tenant_id, industry);
CREATE INDEX idx_crm_accounts_gmb_place ON crm_accounts(gmb_place_id) WHERE gmb_place_id IS NOT NULL;
CREATE INDEX idx_crm_accounts_score ON crm_accounts(tenant_id, lead_score DESC);
CREATE INDEX idx_crm_accounts_search ON crm_accounts USING GIN(search_vector);

-- Contacts indexes
CREATE INDEX idx_crm_contacts_tenant ON crm_contacts(tenant_id);
CREATE INDEX idx_crm_contacts_account ON crm_contacts(account_id);
CREATE INDEX idx_crm_contacts_email ON crm_contacts(tenant_id, email);
CREATE INDEX idx_crm_contacts_status ON crm_contacts(tenant_id, lead_status);
CREATE INDEX idx_crm_contacts_assigned ON crm_contacts(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX idx_crm_contacts_search ON crm_contacts USING GIN(search_vector);

-- Deals indexes
CREATE INDEX idx_crm_deals_tenant ON crm_deals(tenant_id);
CREATE INDEX idx_crm_deals_account ON crm_deals(account_id);
CREATE INDEX idx_crm_deals_stage ON crm_deals(tenant_id, stage);
CREATE INDEX idx_crm_deals_close_date ON crm_deals(expected_close_date);
CREATE INDEX idx_crm_deals_value ON crm_deals(tenant_id, deal_value DESC);

-- Activities indexes
CREATE INDEX idx_crm_activities_tenant ON crm_activities(tenant_id);
CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_account ON crm_activities(account_id);
CREATE INDEX idx_crm_activities_type ON crm_activities(tenant_id, activity_type);
CREATE INDEX idx_crm_activities_date ON crm_activities(created_at DESC);
CREATE INDEX idx_crm_activities_due ON crm_activities(due_date) WHERE due_date IS NOT NULL;

-- Campaigns indexes
CREATE INDEX idx_crm_campaigns_tenant ON crm_campaigns(tenant_id);
CREATE INDEX idx_crm_campaigns_status ON crm_campaigns(tenant_id, status);
CREATE INDEX idx_crm_campaigns_type ON crm_campaigns(campaign_type);

-- Campaign membership indexes
CREATE INDEX idx_crm_campaign_memberships_campaign ON crm_campaign_memberships(campaign_id);
CREATE INDEX idx_crm_campaign_memberships_contact ON crm_campaign_memberships(contact_id);

-- =====================================================
-- TRIGGERS for automated updates
-- =====================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_crm_accounts_updated_at BEFORE UPDATE ON crm_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON crm_contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_deals_updated_at BEFORE UPDATE ON crm_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON crm_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_crm_campaigns_updated_at BEFORE UPDATE ON crm_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update contact interaction count when activities are added
CREATE OR REPLACE FUNCTION update_contact_interactions()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE crm_contacts 
        SET 
            total_interactions = total_interactions + 1,
            last_contacted_at = NEW.created_at,
            last_contact_method = NEW.activity_type
        WHERE id = NEW.contact_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE crm_contacts 
        SET total_interactions = total_interactions - 1
        WHERE id = OLD.contact_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_contact_interactions 
    AFTER INSERT OR DELETE ON crm_activities 
    FOR EACH ROW EXECUTE FUNCTION update_contact_interactions();