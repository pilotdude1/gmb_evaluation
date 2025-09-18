-- =====================================================
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