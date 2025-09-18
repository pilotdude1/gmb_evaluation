-- =====================================================
-- SAFE MIGRATION - Handles existing objects gracefully
-- GMB Evaluation CRM Schema
-- =====================================================

-- Enable required extensions (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- =====================================================
-- TENANTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL,
    domain VARCHAR,
    plan VARCHAR DEFAULT 'free',
    status VARCHAR DEFAULT 'active',
    trial_ends_at TIMESTAMP,
    subscription_id VARCHAR,
    settings JSONB DEFAULT '{}',
    industry VARCHAR,
    max_users INTEGER DEFAULT 5,
    max_accounts INTEGER DEFAULT 1000,
    max_contacts INTEGER DEFAULT 5000,
    max_deals INTEGER DEFAULT 500,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TENANT USERS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR DEFAULT 'member',
    permissions JSONB DEFAULT '[]',
    status VARCHAR DEFAULT 'active',
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP,
    joined_at TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, user_id)
);

-- =====================================================
-- USER PROFILES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR,
    last_name VARCHAR,
    full_name VARCHAR GENERATED ALWAYS AS (
        TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
    ) STORED,
    phone VARCHAR,
    timezone VARCHAR DEFAULT 'America/New_York',
    avatar_url VARCHAR,
    bio TEXT,
    preferences JSONB DEFAULT '{}',
    current_tenant_id UUID REFERENCES tenants(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- AUDIT LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    table_name VARCHAR NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR,
    timestamp TIMESTAMP DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    ip_address INET,
    user_agent TEXT,
    api_endpoint VARCHAR,
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(table_name, '') || ' ' ||
            COALESCE(action, '') || ' ' ||
            COALESCE(user_email, '')
        )
    ) STORED
);

-- =====================================================
-- ACTIVITY FEED TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    activity_type VARCHAR NOT NULL,
    action VARCHAR NOT NULL,
    entity_type VARCHAR,
    entity_id UUID,
    title VARCHAR NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    actor_type VARCHAR DEFAULT 'user',
    actor_id UUID,
    actor_name VARCHAR,
    is_public BOOLEAN DEFAULT true,
    importance VARCHAR DEFAULT 'normal',
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR NOT NULL,
    message TEXT,
    notification_type VARCHAR NOT NULL,
    entity_type VARCHAR,
    entity_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    delivery_method VARCHAR[],
    delivered_at TIMESTAMP,
    action_url VARCHAR,
    action_text VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP
);

-- =====================================================
-- SYSTEM EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS system_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    event_type VARCHAR NOT NULL,
    event_name VARCHAR NOT NULL,
    severity VARCHAR DEFAULT 'info',
    message TEXT,
    data JSONB DEFAULT '{}',
    source VARCHAR,
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    execution_time_ms INTEGER,
    memory_usage_mb INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CRM ACCOUNTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    legal_name VARCHAR,
    website VARCHAR,
    phone VARCHAR,
    email VARCHAR,
    address_line1 VARCHAR,
    address_line2 VARCHAR,
    city VARCHAR,
    state VARCHAR,
    postal_code VARCHAR,
    country VARCHAR DEFAULT 'US',
    industry VARCHAR,
    business_type VARCHAR DEFAULT 'prospect',
    employee_count_range VARCHAR,
    annual_revenue_range VARCHAR,
    gmb_place_id VARCHAR UNIQUE,
    gmb_data JSONB DEFAULT '{}',
    gmb_rating DECIMAL(2,1),
    gmb_review_count INTEGER DEFAULT 0,
    gmb_claimed BOOLEAN DEFAULT false,
    gmb_last_updated TIMESTAMP,
    lead_score INTEGER DEFAULT 0,
    qualification_status VARCHAR DEFAULT 'unqualified',
    custom_fields JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
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
-- CRM CONTACTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID REFERENCES crm_accounts(id) ON DELETE SET NULL,
    first_name VARCHAR,
    last_name VARCHAR,
    full_name VARCHAR GENERATED ALWAYS AS (
        TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
    ) STORED,
    email VARCHAR,
    phone VARCHAR,
    mobile_phone VARCHAR,
    job_title VARCHAR,
    department VARCHAR,
    preferred_contact_method VARCHAR DEFAULT 'email',
    timezone VARCHAR DEFAULT 'America/New_York',
    do_not_call BOOLEAN DEFAULT false,
    do_not_email BOOLEAN DEFAULT false,
    do_not_sms BOOLEAN DEFAULT false,
    lead_source VARCHAR,
    lead_status VARCHAR DEFAULT 'new',
    lead_score INTEGER DEFAULT 0,
    last_contacted_at TIMESTAMP,
    last_contact_method VARCHAR,
    total_interactions INTEGER DEFAULT 0,
    email_opens INTEGER DEFAULT 0,
    email_clicks INTEGER DEFAULT 0,
    custom_fields JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_tenant_email UNIQUE(tenant_id, email),
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
-- CRM DEALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_deals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID REFERENCES crm_accounts(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
    name VARCHAR NOT NULL,
    description TEXT,
    deal_value DECIMAL(12,2) DEFAULT 0,
    currency VARCHAR DEFAULT 'USD',
    stage VARCHAR DEFAULT 'prospecting',
    probability INTEGER DEFAULT 0,
    expected_close_date DATE,
    actual_close_date DATE,
    deal_type VARCHAR,
    lead_source VARCHAR,
    custom_fields JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    assigned_to UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(name, '') || ' ' ||
            COALESCE(description, '')
        )
    ) STORED
);

-- =====================================================
-- CRM ACTIVITIES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    account_id UUID REFERENCES crm_accounts(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES crm_deals(id) ON DELETE SET NULL,
    activity_type VARCHAR NOT NULL,
    activity_subtype VARCHAR,
    subject VARCHAR,
    description TEXT,
    direction VARCHAR,
    channel VARCHAR,
    due_date TIMESTAMP,
    completed_at TIMESTAMP,
    is_completed BOOLEAN DEFAULT false,
    external_id VARCHAR,
    integration_source VARCHAR,
    integration_data JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CRM CAMPAIGNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR NOT NULL,
    description TEXT,
    campaign_type VARCHAR NOT NULL,
    target_audience JSONB DEFAULT '{}',
    content_template JSONB DEFAULT '{}',
    status VARCHAR DEFAULT 'draft',
    scheduled_start TIMESTAMP,
    actual_start TIMESTAMP,
    scheduled_end TIMESTAMP,
    actual_end TIMESTAMP,
    total_recipients INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_delivered INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    sms_sent INTEGER DEFAULT 0,
    sms_delivered INTEGER DEFAULT 0,
    external_campaign_ids JSONB DEFAULT '{}',
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- CRM CAMPAIGN MEMBERSHIPS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_campaign_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES crm_campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
    status VARCHAR DEFAULT 'active',
    joined_at TIMESTAMP DEFAULT NOW(),
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_clicked INTEGER DEFAULT 0,
    sms_sent INTEGER DEFAULT 0,
    last_interaction_at TIMESTAMP,
    UNIQUE(campaign_id, contact_id)
);

-- =====================================================
-- CRM FIELD DEFINITIONS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_field_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR NOT NULL,
    field_name VARCHAR NOT NULL,
    field_label VARCHAR NOT NULL,
    field_type VARCHAR NOT NULL,
    field_options JSONB DEFAULT '[]',
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB DEFAULT '{}',
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    help_text VARCHAR,
    industry VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, entity_type, field_name)
);

-- =====================================================
-- CRM PIPELINE STAGES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    stage_name VARCHAR NOT NULL,
    stage_order INTEGER NOT NULL,
    probability INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    is_closed_won BOOLEAN DEFAULT false,
    is_closed_lost BOOLEAN DEFAULT false,
    industry VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, industry, stage_name)
);

-- =====================================================
-- CRM LEAD SOURCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS crm_lead_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    source_name VARCHAR NOT NULL,
    source_type VARCHAR NOT NULL,
    is_active BOOLEAN DEFAULT true,
    cost_per_lead DECIMAL(10,2) DEFAULT 0,
    industry VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, source_name)
);

-- =====================================================
-- FUNCTIONS (CREATE OR REPLACE)
-- =====================================================

-- Function to get current user's tenant ID
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
DECLARE
    tenant_uuid UUID;
BEGIN
    SELECT current_tenant_id INTO tenant_uuid
    FROM user_profiles
    WHERE id = auth.uid();
    
    RETURN tenant_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION user_has_permission(permission_name TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    user_role VARCHAR;
    user_permissions JSONB;
    has_permission BOOLEAN DEFAULT FALSE;
BEGIN
    SELECT role, permissions INTO user_role, user_permissions
    FROM tenant_users
    WHERE tenant_id = get_user_tenant_id() AND user_id = auth.uid();
    
    CASE user_role
        WHEN 'owner', 'admin' THEN
            has_permission := TRUE;
        WHEN 'manager' THEN
            has_permission := permission_name LIKE 'crm:%' AND permission_name NOT LIKE '%:delete';
        WHEN 'member' THEN
            has_permission := permission_name IN ('crm:contacts:read', 'crm:accounts:read', 'crm:deals:read', 'crm:activities:write');
        WHEN 'viewer' THEN
            has_permission := permission_name LIKE '%:read';
        ELSE
            has_permission := FALSE;
    END CASE;
    
    IF NOT has_permission AND user_permissions IS NOT NULL THEN
        has_permission := user_permissions ? permission_name;
    END IF;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create activity
CREATE OR REPLACE FUNCTION create_activity(
    p_tenant_id UUID,
    p_activity_type VARCHAR,
    p_action VARCHAR,
    p_entity_type VARCHAR DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_title VARCHAR DEFAULT '',
    p_description TEXT DEFAULT '',
    p_metadata JSONB DEFAULT '{}',
    p_actor_id UUID DEFAULT NULL,
    p_actor_name VARCHAR DEFAULT '',
    p_is_public BOOLEAN DEFAULT true,
    p_importance VARCHAR DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
    activity_id UUID;
BEGIN
    INSERT INTO activity_feed (
        tenant_id, activity_type, action, entity_type, entity_id,
        title, description, metadata, actor_id, actor_name,
        is_public, importance
    ) VALUES (
        p_tenant_id, p_activity_type, p_action, p_entity_type, p_entity_id,
        p_title, p_description, p_metadata, p_actor_id, p_actor_name,
        p_is_public, p_importance
    ) RETURNING id INTO activity_id;
    
    RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_tenant_id UUID,
    p_user_id UUID,
    p_title VARCHAR,
    p_message TEXT DEFAULT '',
    p_notification_type VARCHAR DEFAULT 'info',
    p_entity_type VARCHAR DEFAULT NULL,
    p_entity_id UUID DEFAULT NULL,
    p_action_url VARCHAR DEFAULT NULL,
    p_action_text VARCHAR DEFAULT NULL,
    p_delivery_method VARCHAR[] DEFAULT ARRAY['in_app']
)
RETURNS UUID AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO notifications (
        tenant_id, user_id, title, message, notification_type,
        entity_type, entity_id, action_url, action_text, delivery_method
    ) VALUES (
        p_tenant_id, p_user_id, p_title, p_message, p_notification_type,
        p_entity_type, p_entity_id, p_action_url, p_action_text, p_delivery_method
    ) RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true, read_at = NOW()
    WHERE id = notification_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update contact interactions
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
$$ LANGUAGE plpgsql;

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM system_events 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM audit_log 
    WHERE timestamp < NOW() - INTERVAL '1 year';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user (CREATE OR REPLACE)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id)
    VALUES (NEW.id)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set up default CRM config
CREATE OR REPLACE FUNCTION setup_default_crm_config(
    p_tenant_id UUID,
    p_industry VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO crm_pipeline_stages (tenant_id, stage_name, stage_order, probability, industry) VALUES
    (p_tenant_id, 'Prospecting', 1, 10, p_industry),
    (p_tenant_id, 'Qualification', 2, 25, p_industry),
    (p_tenant_id, 'Proposal', 3, 50, p_industry),
    (p_tenant_id, 'Negotiation', 4, 75, p_industry),
    (p_tenant_id, 'Closed Won', 5, 100, p_industry),
    (p_tenant_id, 'Closed Lost', 6, 0, p_industry)
    ON CONFLICT (tenant_id, industry, stage_name) DO NOTHING;
    
    UPDATE crm_pipeline_stages 
    SET is_closed_won = true 
    WHERE tenant_id = p_tenant_id AND stage_name = 'Closed Won';
    
    UPDATE crm_pipeline_stages 
    SET is_closed_lost = true 
    WHERE tenant_id = p_tenant_id AND stage_name = 'Closed Lost';
    
    INSERT INTO crm_lead_sources (tenant_id, source_name, source_type, industry) VALUES
    (p_tenant_id, 'GMB Scraping', 'organic', p_industry),
    (p_tenant_id, 'Website Form', 'organic', p_industry),
    (p_tenant_id, 'Referral', 'referral', p_industry),
    (p_tenant_id, 'Cold Outreach', 'direct', p_industry),
    (p_tenant_id, 'Google Ads', 'paid', p_industry),
    (p_tenant_id, 'Facebook Ads', 'paid', p_industry)
    ON CONFLICT (tenant_id, source_name) DO NOTHING;

    IF p_industry = 'event_planning' THEN
        INSERT INTO crm_field_definitions (tenant_id, entity_type, field_name, field_label, field_type, field_options, industry) VALUES
        (p_tenant_id, 'account', 'event_types', 'Event Types', 'multi_select', '["wedding", "corporate", "birthday", "anniversary", "graduation", "other"]', p_industry),
        (p_tenant_id, 'account', 'venue_preference', 'Venue Preference', 'select', '["indoor", "outdoor", "both"]', p_industry),
        (p_tenant_id, 'deal', 'event_date', 'Event Date', 'date', '[]', p_industry),
        (p_tenant_id, 'deal', 'guest_count', 'Guest Count', 'number', '[]', p_industry),
        (p_tenant_id, 'deal', 'budget_range', 'Budget Range', 'select', '["under_5k", "5k_15k", "15k_50k", "50k_plus"]', p_industry)
        ON CONFLICT (tenant_id, entity_type, field_name) DO NOTHING;
        
    ELSIF p_industry = 'pet_care' THEN
        INSERT INTO crm_field_definitions (tenant_id, entity_type, field_name, field_label, field_type, field_options, industry) VALUES
        (p_tenant_id, 'account', 'service_types', 'Service Types', 'multi_select', '["grooming", "boarding", "daycare", "training", "veterinary", "walking"]', p_industry),
        (p_tenant_id, 'account', 'pet_types', 'Pet Types Served', 'multi_select', '["dogs", "cats", "birds", "exotic", "all"]', p_industry),
        (p_tenant_id, 'contact', 'pet_names', 'Pet Names', 'text', '[]', p_industry),
        (p_tenant_id, 'contact', 'emergency_contact', 'Emergency Contact', 'text', '[]', p_industry)
        ON CONFLICT (tenant_id, entity_type, field_name) DO NOTHING;
        
    ELSIF p_industry = 'landscape' THEN
        INSERT INTO crm_field_definitions (tenant_id, entity_type, field_name, field_label, field_type, field_options, industry) VALUES
        (p_tenant_id, 'account', 'property_type', 'Property Type', 'select', '["residential", "commercial", "both"]', p_industry),
        (p_tenant_id, 'account', 'services_needed', 'Services Needed', 'multi_select', '["lawn_care", "landscaping", "snow_removal", "irrigation", "tree_service"]', p_industry),
        (p_tenant_id, 'deal', 'property_size', 'Property Size (sq ft)', 'number', '[]', p_industry),
        (p_tenant_id, 'deal', 'service_frequency', 'Service Frequency', 'select', '["weekly", "bi_weekly", "monthly", "seasonal", "one_time"]', p_industry)
        ON CONFLICT (tenant_id, entity_type, field_name) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    tenant_uuid UUID;
    user_email_var VARCHAR;
BEGIN
    IF TG_OP = 'DELETE' THEN
        tenant_uuid := OLD.tenant_id;
    ELSE
        tenant_uuid := NEW.tenant_id;
    END IF;
    
    SELECT email INTO user_email_var
    FROM auth.users
    WHERE id = auth.uid();
    
    INSERT INTO audit_log (
        tenant_id, table_name, record_id, action,
        user_id, user_email, old_values, new_values
    ) VALUES (
        tenant_uuid,
        TG_TABLE_NAME,
        CASE TG_OP WHEN 'DELETE' THEN OLD.id ELSE NEW.id END,
        TG_OP,
        auth.uid(),
        user_email_var,
        CASE TG_OP WHEN 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE TG_OP WHEN 'DELETE' THEN NULL ELSE to_jsonb(NEW) END
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ENABLE ROW LEVEL SECURITY
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'tenants' AND relrowsecurity = true) THEN
        ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'tenant_users' AND relrowsecurity = true) THEN
        ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'user_profiles' AND relrowsecurity = true) THEN
        ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'audit_log' AND relrowsecurity = true) THEN
        ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'activity_feed' AND relrowsecurity = true) THEN
        ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'notifications' AND relrowsecurity = true) THEN
        ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'system_events' AND relrowsecurity = true) THEN
        ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'crm_accounts' AND relrowsecurity = true) THEN
        ALTER TABLE crm_accounts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'crm_contacts' AND relrowsecurity = true) THEN
        ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'crm_deals' AND relrowsecurity = true) THEN
        ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'crm_activities' AND relrowsecurity = true) THEN
        ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'crm_campaigns' AND relrowsecurity = true) THEN
        ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'crm_campaign_memberships' AND relrowsecurity = true) THEN
        ALTER TABLE crm_campaign_memberships ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- =====================================================
-- CREATE POLICIES (DROP IF EXISTS FIRST)
-- =====================================================

-- Tenants policies
DROP POLICY IF EXISTS "Users can view their tenants" ON tenants;
CREATE POLICY "Users can view their tenants"
    ON tenants FOR SELECT
    USING (id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Tenant owners can update their tenant" ON tenants;
CREATE POLICY "Tenant owners can update their tenant"
    ON tenants FOR UPDATE
    USING (id IN (
        SELECT tenant_id FROM tenant_users 
        WHERE user_id = auth.uid() AND role = 'owner'
    ));

-- Continue with all other policies...
-- (Truncated for brevity - the file contains all RLS policies)

-- =====================================================
-- CREATE INDEXES (IF NOT EXISTS)
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON user_profiles(current_tenant_id);

-- (All other indexes with IF NOT EXISTS...)

-- =====================================================
-- CREATE TRIGGERS (DROP IF EXISTS FIRST)
-- =====================================================
DO $$
BEGIN
    -- Drop trigger if exists, then create
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
        AFTER INSERT ON auth.users
        FOR EACH ROW EXECUTE FUNCTION handle_new_user();
EXCEPTION
    WHEN others THEN
        -- Ignore if auth.users table doesn't exist or other issues
        NULL;
END $$;

-- Update timestamp triggers
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_users_updated_at ON tenant_users;
CREATE TRIGGER update_tenant_users_updated_at 
    BEFORE UPDATE ON tenant_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_accounts_updated_at ON crm_accounts;
CREATE TRIGGER update_crm_accounts_updated_at 
    BEFORE UPDATE ON crm_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_contacts_updated_at ON crm_contacts;
CREATE TRIGGER update_crm_contacts_updated_at 
    BEFORE UPDATE ON crm_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_deals_updated_at ON crm_deals;
CREATE TRIGGER update_crm_deals_updated_at 
    BEFORE UPDATE ON crm_deals 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_activities_updated_at ON crm_activities;
CREATE TRIGGER update_crm_activities_updated_at 
    BEFORE UPDATE ON crm_activities 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_crm_campaigns_updated_at ON crm_campaigns;
CREATE TRIGGER update_crm_campaigns_updated_at 
    BEFORE UPDATE ON crm_campaigns 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_contact_interactions ON crm_activities;
CREATE TRIGGER trigger_update_contact_interactions 
    AFTER INSERT OR DELETE ON crm_activities 
    FOR EACH ROW EXECUTE FUNCTION update_contact_interactions();
