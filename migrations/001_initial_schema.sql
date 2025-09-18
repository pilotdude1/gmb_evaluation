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
