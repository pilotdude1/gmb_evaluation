-- =====================================================
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
    USING (tenant_id = get_user_tenant_id());