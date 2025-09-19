-- =====================================================
-- INITIAL SCHEMA SETUP
-- GMB Evaluation CRM Foundation
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy text search
CREATE EXTENSION IF NOT EXISTS "btree_gin"; -- For composite indexes

-- =====================================================
-- TENANTS TABLE - Multi-tenant foundation
-- =====================================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Tenant Information
    name VARCHAR NOT NULL,
    slug VARCHAR UNIQUE NOT NULL, -- URL-friendly identifier
    domain VARCHAR, -- Custom domain for tenant
    
    -- Subscription Information
    plan VARCHAR DEFAULT 'free', -- 'free', 'basic', 'pro', 'enterprise'
    status VARCHAR DEFAULT 'active', -- 'active', 'suspended', 'cancelled'
    trial_ends_at TIMESTAMP,
    subscription_id VARCHAR, -- External billing system ID
    
    -- Configuration
    settings JSONB DEFAULT '{}',
    industry VARCHAR, -- Primary industry vertical
    
    -- Limits based on plan
    max_users INTEGER DEFAULT 5,
    max_accounts INTEGER DEFAULT 1000,
    max_contacts INTEGER DEFAULT 5000,
    max_deals INTEGER DEFAULT 500,
    
    -- System fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TENANT USERS - User membership in tenants
-- =====================================================
CREATE TABLE tenant_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Role and Permissions
    role VARCHAR DEFAULT 'member', -- 'owner', 'admin', 'manager', 'member', 'viewer'
    permissions JSONB DEFAULT '[]', -- Custom permissions array
    
    -- Status
    status VARCHAR DEFAULT 'active', -- 'active', 'invited', 'suspended'
    invited_by UUID REFERENCES auth.users(id),
    invited_at TIMESTAMP,
    joined_at TIMESTAMP DEFAULT NOW(),
    
    -- System fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(tenant_id, user_id)
);

-- =====================================================
-- USER PROFILES - Extended user information
-- =====================================================
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Personal Information
    first_name VARCHAR,
    last_name VARCHAR,
    full_name VARCHAR GENERATED ALWAYS AS (
        TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
    ) STORED,
    
    -- Contact Information
    phone VARCHAR,
    timezone VARCHAR DEFAULT 'America/New_York',
    
    -- Profile
    avatar_url VARCHAR,
    bio TEXT,
    
    -- Preferences
    preferences JSONB DEFAULT '{}',
    
    -- Current tenant context
    current_tenant_id UUID REFERENCES tenants(id),
    
    -- System fields
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get current user's tenant ID
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
DECLARE
    tenant_uuid UUID;
BEGIN
    -- Get tenant_id from user_profiles.current_tenant_id
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
    -- Get user role and permissions
    SELECT role, permissions INTO user_role, user_permissions
    FROM tenant_users
    WHERE tenant_id = get_user_tenant_id() AND user_id = auth.uid();
    
    -- Check role-based permissions
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
    
    -- Check custom permissions
    IF NOT has_permission AND user_permissions IS NOT NULL THEN
        has_permission := user_permissions ? permission_name;
    END IF;
    
    RETURN has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY SETUP
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Tenants policies
CREATE POLICY "Users can view their tenants"
    ON tenants FOR SELECT
    USING (id IN (SELECT tenant_id FROM tenant_users WHERE user_id = auth.uid()));

CREATE POLICY "Tenant owners can update their tenant"
    ON tenants FOR UPDATE
    USING (id IN (
        SELECT tenant_id FROM tenant_users 
        WHERE user_id = auth.uid() AND role = 'owner'
    ));

-- Tenant users policies
CREATE POLICY "Users can view tenant memberships"
    ON tenant_users FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Admins can manage tenant users"
    ON tenant_users FOR ALL
    USING (
        tenant_id = get_user_tenant_id() 
        AND user_has_permission('tenant:users:write')
    );

-- User profiles policies
CREATE POLICY "Users can view all profiles in their tenant"
    ON user_profiles FOR SELECT
    USING (id IN (
        SELECT user_id FROM tenant_users WHERE tenant_id = get_user_tenant_id()
    ));

CREATE POLICY "Users can update their own profile"
    ON user_profiles FOR UPDATE
    USING (id = auth.uid());

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_tenants_slug ON tenants(slug);
CREATE INDEX idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX idx_user_profiles_tenant ON user_profiles(current_tenant_id);

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tenants_updated_at 
    BEFORE UPDATE ON tenants 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenant_users_updated_at 
    BEFORE UPDATE ON tenant_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at 
    BEFORE UPDATE ON user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create user profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_profiles (id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
-- =====================================================
-- AUDIT LOG AND ACTIVITY TRACKING
-- =====================================================

-- =====================================================
-- AUDIT LOG - Track all data changes
-- =====================================================
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- What changed
    table_name VARCHAR NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'
    
    -- Who made the change
    user_id UUID REFERENCES auth.users(id),
    user_email VARCHAR,
    
    -- When it happened
    timestamp TIMESTAMP DEFAULT NOW(),
    
    -- What changed
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[], -- Array of field names that changed
    
    -- Context
    ip_address INET,
    user_agent TEXT,
    api_endpoint VARCHAR,
    
    -- Search optimization
    search_vector tsvector GENERATED ALWAYS AS (
        to_tsvector('english', 
            COALESCE(table_name, '') || ' ' ||
            COALESCE(action, '') || ' ' ||
            COALESCE(user_email, '')
        )
    ) STORED
);

-- =====================================================
-- ACTIVITY FEED - User-facing activity stream
-- =====================================================
CREATE TABLE activity_feed (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Activity Classification
    activity_type VARCHAR NOT NULL, -- 'user_action', 'system_event', 'integration'
    action VARCHAR NOT NULL, -- 'created', 'updated', 'deleted', 'logged_in', etc.
    entity_type VARCHAR, -- 'account', 'contact', 'deal', 'user'
    entity_id UUID,
    
    -- Activity Description
    title VARCHAR NOT NULL,
    description TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Who/What triggered this
    actor_type VARCHAR DEFAULT 'user', -- 'user', 'system', 'integration'
    actor_id UUID, -- user_id or system identifier
    actor_name VARCHAR,
    
    -- Visibility
    is_public BOOLEAN DEFAULT true, -- Show in team activity feed
    importance VARCHAR DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
    
    -- System fields
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATION SYSTEM
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Recipient
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification Content
    title VARCHAR NOT NULL,
    message TEXT,
    notification_type VARCHAR NOT NULL, -- 'info', 'success', 'warning', 'error'
    
    -- Related Entity
    entity_type VARCHAR, -- 'account', 'contact', 'deal', 'campaign'
    entity_id UUID,
    
    -- Notification State
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    
    -- Delivery
    delivery_method VARCHAR[], -- ['in_app', 'email', 'sms']
    delivered_at TIMESTAMP,
    
    -- Action (optional)
    action_url VARCHAR,
    action_text VARCHAR,
    
    -- System fields
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP -- Auto-delete after this date
);

-- =====================================================
-- SYSTEM EVENTS - Internal event tracking
-- =====================================================
CREATE TABLE system_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Event Classification
    event_type VARCHAR NOT NULL, -- 'api_call', 'integration_sync', 'scheduled_task', 'error'
    event_name VARCHAR NOT NULL,
    severity VARCHAR DEFAULT 'info', -- 'debug', 'info', 'warning', 'error', 'critical'
    
    -- Event Data
    message TEXT,
    data JSONB DEFAULT '{}',
    
    -- Context
    source VARCHAR, -- 'api', 'webhook', 'cron', 'user_action'
    user_id UUID REFERENCES auth.users(id),
    ip_address INET,
    
    -- Performance
    execution_time_ms INTEGER,
    memory_usage_mb INTEGER,
    
    -- System fields
    created_at TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================

-- Audit log indexes
CREATE INDEX idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX idx_audit_log_table ON audit_log(tenant_id, table_name);
CREATE INDEX idx_audit_log_record ON audit_log(table_name, record_id);
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp DESC);
CREATE INDEX idx_audit_log_search ON audit_log USING GIN(search_vector);

-- Activity feed indexes
CREATE INDEX idx_activity_feed_tenant ON activity_feed(tenant_id);
CREATE INDEX idx_activity_feed_type ON activity_feed(tenant_id, activity_type);
CREATE INDEX idx_activity_feed_entity ON activity_feed(entity_type, entity_id);
CREATE INDEX idx_activity_feed_actor ON activity_feed(actor_id);
CREATE INDEX idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX idx_activity_feed_public ON activity_feed(tenant_id, is_public, created_at DESC);

-- Notifications indexes
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_tenant ON notifications(tenant_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX idx_notifications_expires ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- System events indexes
CREATE INDEX idx_system_events_tenant ON system_events(tenant_id);
CREATE INDEX idx_system_events_type ON system_events(event_type);
CREATE INDEX idx_system_events_severity ON system_events(severity);
CREATE INDEX idx_system_events_created ON system_events(created_at DESC);
CREATE INDEX idx_system_events_source ON system_events(source);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_events ENABLE ROW LEVEL SECURITY;

-- Audit log policies
CREATE POLICY "Users can view audit log in their tenant"
    ON audit_log FOR SELECT
    USING (tenant_id = get_user_tenant_id());

-- Activity feed policies
CREATE POLICY "Users can view activity feed in their tenant"
    ON activity_feed FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "System can create activity feed entries"
    ON activity_feed FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());

-- Notifications policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (user_id = auth.uid());

-- System events policies (admin only)
CREATE POLICY "Admins can view system events"
    ON system_events FOR SELECT
    USING (
        tenant_id = get_user_tenant_id() 
        AND user_has_permission('system:events:read')
    );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to create activity feed entry
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

-- =====================================================
-- AUTOMATIC CLEANUP
-- =====================================================

-- Function to clean up old data
CREATE OR REPLACE FUNCTION cleanup_old_data()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER := 0;
BEGIN
    -- Delete expired notifications
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete old system events (keep 90 days)
    DELETE FROM system_events 
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    -- Delete old audit logs (keep 1 year)
    DELETE FROM audit_log 
    WHERE timestamp < NOW() - INTERVAL '1 year';
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS for automatic audit logging
-- =====================================================

-- Generic audit trigger function
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
    tenant_uuid UUID;
    user_email_var VARCHAR;
BEGIN
    -- Get tenant_id from the record
    IF TG_OP = 'DELETE' THEN
        tenant_uuid := OLD.tenant_id;
    ELSE
        tenant_uuid := NEW.tenant_id;
    END IF;
    
    -- Get user email
    SELECT email INTO user_email_var
    FROM auth.users
    WHERE id = auth.uid();
    
    -- Insert audit record
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
    FOR EACH ROW EXECUTE FUNCTION update_contact_interactions();-- =====================================================
-- ROW LEVEL SECURITY for CRM Tables
-- =====================================================

-- Enable RLS on all CRM tables
ALTER TABLE crm_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_campaign_memberships ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- CRM ACCOUNTS Policies
-- =====================================================

CREATE POLICY "Users can view accounts in their tenant"
    ON crm_accounts FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create accounts in their tenant"
    ON crm_accounts FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id() 
        AND user_has_permission('crm:accounts:write')
    );

CREATE POLICY "Users can update accounts in their tenant"
    ON crm_accounts FOR UPDATE
    USING (
        tenant_id = get_user_tenant_id() 
        AND user_has_permission('crm:accounts:write')
    );

CREATE POLICY "Users can delete accounts in their tenant"
    ON crm_accounts FOR DELETE
    USING (
        tenant_id = get_user_tenant_id() 
        AND user_has_permission('crm:accounts:delete')
    );

-- =====================================================
-- CRM CONTACTS Policies
-- =====================================================

CREATE POLICY "Users can view contacts in their tenant"
    ON crm_contacts FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create contacts in their tenant"
    ON crm_contacts FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id() 
        AND user_has_permission('crm:contacts:write')
    );

CREATE POLICY "Users can update contacts in their tenant"
    ON crm_contacts FOR UPDATE
    USING (
        tenant_id = get_user_tenant_id() 
        AND (
            user_has_permission('crm:contacts:write')
            OR assigned_to = auth.uid()
        )
    );

CREATE POLICY "Users can delete contacts in their tenant"
    ON crm_contacts FOR DELETE
    USING (
        tenant_id = get_user_tenant_id() 
        AND user_has_permission('crm:contacts:delete')
    );

-- =====================================================
-- CRM DEALS Policies
-- =====================================================

CREATE POLICY "Users can view deals in their tenant"
    ON crm_deals FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create deals in their tenant"
    ON crm_deals FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id() 
        AND user_has_permission('crm:deals:write')
    );

CREATE POLICY "Users can update deals in their tenant"
    ON crm_deals FOR UPDATE
    USING (
        tenant_id = get_user_tenant_id() 
        AND (
            user_has_permission('crm:deals:write')
            OR assigned_to = auth.uid()
        )
    );

-- =====================================================
-- CRM ACTIVITIES Policies
-- =====================================================

CREATE POLICY "Users can view activities in their tenant"
    ON crm_activities FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can create activities in their tenant"
    ON crm_activities FOR INSERT
    WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update their own activities"
    ON crm_activities FOR UPDATE
    USING (
        tenant_id = get_user_tenant_id() 
        AND created_by = auth.uid()
    );

-- =====================================================
-- CRM CAMPAIGNS Policies
-- =====================================================

CREATE POLICY "Users can view campaigns in their tenant"
    ON crm_campaigns FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can manage campaigns in their tenant"
    ON crm_campaigns FOR ALL
    USING (
        tenant_id = get_user_tenant_id() 
        AND user_has_permission('crm:campaigns:write')
    );

-- =====================================================
-- Campaign Memberships Policies
-- =====================================================

CREATE POLICY "Users can view campaign memberships in their tenant"
    ON crm_campaign_memberships FOR SELECT
    USING (tenant_id = get_user_tenant_id());

CREATE POLICY "System can manage campaign memberships"
    ON crm_campaign_memberships FOR ALL
    USING (tenant_id = get_user_tenant_id());-- =====================================================
-- VERTICAL-SPECIFIC CONFIGURATIONS
-- =====================================================

-- Custom field definitions per industry vertical
CREATE TABLE crm_field_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Field Configuration
    entity_type VARCHAR NOT NULL, -- 'account', 'contact', 'deal'
    field_name VARCHAR NOT NULL,
    field_label VARCHAR NOT NULL,
    field_type VARCHAR NOT NULL, -- 'text', 'number', 'select', 'multi_select', 'date', 'boolean'
    
    -- Field Options (for select fields)
    field_options JSONB DEFAULT '[]',
    
    -- Validation Rules
    is_required BOOLEAN DEFAULT false,
    validation_rules JSONB DEFAULT '{}',
    
    -- Display Configuration
    display_order INTEGER DEFAULT 0,
    is_visible BOOLEAN DEFAULT true,
    help_text VARCHAR,
    
    -- Industry Specificity
    industry VARCHAR, -- NULL means applies to all industries
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, entity_type, field_name)
);

-- Pipeline stage definitions (customizable per tenant/industry)
CREATE TABLE crm_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Stage Configuration
    stage_name VARCHAR NOT NULL,
    stage_order INTEGER NOT NULL,
    probability INTEGER DEFAULT 0, -- Default probability for deals in this stage
    
    -- Stage Behavior
    is_active BOOLEAN DEFAULT true,
    is_closed_won BOOLEAN DEFAULT false,
    is_closed_lost BOOLEAN DEFAULT false,
    
    -- Industry Specificity  
    industry VARCHAR, -- NULL means applies to all industries
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, industry, stage_name)
);

-- Lead sources configuration
CREATE TABLE crm_lead_sources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    
    -- Source Configuration
    source_name VARCHAR NOT NULL,
    source_type VARCHAR NOT NULL, -- 'organic', 'paid', 'referral', 'direct'
    
    -- Tracking Configuration
    is_active BOOLEAN DEFAULT true,
    cost_per_lead DECIMAL(10,2) DEFAULT 0,
    
    -- Industry Specificity
    industry VARCHAR,
    
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(tenant_id, source_name)
);

-- =====================================================
-- INSERT DEFAULT CONFIGURATIONS
-- =====================================================

-- Function to set up default CRM configuration for a tenant
CREATE OR REPLACE FUNCTION setup_default_crm_config(
    p_tenant_id UUID,
    p_industry VARCHAR DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- Default pipeline stages
    INSERT INTO crm_pipeline_stages (tenant_id, stage_name, stage_order, probability, industry) VALUES
    (p_tenant_id, 'Prospecting', 1, 10, p_industry),
    (p_tenant_id, 'Qualification', 2, 25, p_industry),
    (p_tenant_id, 'Proposal', 3, 50, p_industry),
    (p_tenant_id, 'Negotiation', 4, 75, p_industry),
    (p_tenant_id, 'Closed Won', 5, 100, p_industry),
    (p_tenant_id, 'Closed Lost', 6, 0, p_industry);
    
    -- Mark won/lost stages
    UPDATE crm_pipeline_stages 
    SET is_closed_won = true 
    WHERE tenant_id = p_tenant_id AND stage_name = 'Closed Won';
    
    UPDATE crm_pipeline_stages 
    SET is_closed_lost = true 
    WHERE tenant_id = p_tenant_id AND stage_name = 'Closed Lost';
    
    -- Default lead sources
    INSERT INTO crm_lead_sources (tenant_id, source_name, source_type, industry) VALUES
    (p_tenant_id, 'GMB Scraping', 'organic', p_industry),
    (p_tenant_id, 'Website Form', 'organic', p_industry),
    (p_tenant_id, 'Referral', 'referral', p_industry),
    (p_tenant_id, 'Cold Outreach', 'direct', p_industry),
    (p_tenant_id, 'Google Ads', 'paid', p_industry),
    (p_tenant_id, 'Facebook Ads', 'paid', p_industry);
    
    -- Industry-specific custom fields
    IF p_industry = 'event_planning' THEN
        INSERT INTO crm_field_definitions (tenant_id, entity_type, field_name, field_label, field_type, field_options, industry) VALUES
        (p_tenant_id, 'account', 'event_types', 'Event Types', 'multi_select', '["wedding", "corporate", "birthday", "anniversary", "graduation", "other"]', p_industry),
        (p_tenant_id, 'account', 'venue_preference', 'Venue Preference', 'select', '["indoor", "outdoor", "both"]', p_industry),
        (p_tenant_id, 'deal', 'event_date', 'Event Date', 'date', '[]', p_industry),
        (p_tenant_id, 'deal', 'guest_count', 'Guest Count', 'number', '[]', p_industry),
        (p_tenant_id, 'deal', 'budget_range', 'Budget Range', 'select', '["under_5k", "5k_15k", "15k_50k", "50k_plus"]', p_industry);
        
    ELSIF p_industry = 'pet_care' THEN
        INSERT INTO crm_field_definitions (tenant_id, entity_type, field_name, field_label, field_type, field_options, industry) VALUES
        (p_tenant_id, 'account', 'service_types', 'Service Types', 'multi_select', '["grooming", "boarding", "daycare", "training", "veterinary", "walking"]', p_industry),
        (p_tenant_id, 'account', 'pet_types', 'Pet Types Served', 'multi_select', '["dogs", "cats", "birds", "exotic", "all"]', p_industry),
        (p_tenant_id, 'contact', 'pet_names', 'Pet Names', 'text', '[]', p_industry),
        (p_tenant_id, 'contact', 'emergency_contact', 'Emergency Contact', 'text', '[]', p_industry);
        
    ELSIF p_industry = 'landscape' THEN
        INSERT INTO crm_field_definitions (tenant_id, entity_type, field_name, field_label, field_type, field_options, industry) VALUES
        (p_tenant_id, 'account', 'property_type', 'Property Type', 'select', '["residential", "commercial", "both"]', p_industry),
        (p_tenant_id, 'account', 'services_needed', 'Services Needed', 'multi_select', '["lawn_care", "landscaping", "snow_removal", "irrigation", "tree_service"]', p_industry),
        (p_tenant_id, 'deal', 'property_size', 'Property Size (sq ft)', 'number', '[]', p_industry),
        (p_tenant_id, 'deal', 'service_frequency', 'Service Frequency', 'select', '["weekly", "bi_weekly", "monthly", "seasonal", "one_time"]', p_industry);
    END IF;
    
END;
$$ LANGUAGE plpgsql;