-- =====================================================
-- FIX CRM RLS POLICIES - More Permissive for Setup
-- =====================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can create accounts in their tenant" ON crm_accounts;
DROP POLICY IF EXISTS "Users can create contacts in their tenant" ON crm_contacts;
DROP POLICY IF EXISTS "Users can create deals in their tenant" ON crm_deals;

-- Create more permissive policies for account creation
CREATE POLICY "Users can create accounts in their tenant"
    ON crm_accounts FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id()
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can create contacts in their tenant"
    ON crm_contacts FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id()
        AND created_by = auth.uid()
    );

CREATE POLICY "Users can create deals in their tenant"
    ON crm_deals FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id()
        AND created_by = auth.uid()
    );

-- Also fix the update policies to be more permissive
DROP POLICY IF EXISTS "Users can update accounts in their tenant" ON crm_accounts;
DROP POLICY IF EXISTS "Users can update contacts in their tenant" ON crm_contacts;
DROP POLICY IF EXISTS "Users can update deals in their tenant" ON crm_deals;

CREATE POLICY "Users can update accounts in their tenant"
    ON crm_accounts FOR UPDATE
    USING (
        tenant_id = get_user_tenant_id()
        AND (
            created_by = auth.uid()
            OR user_has_permission('crm:accounts:write')
        )
    );

CREATE POLICY "Users can update contacts in their tenant"
    ON crm_contacts FOR UPDATE
    USING (
        tenant_id = get_user_tenant_id()
        AND (
            created_by = auth.uid()
            OR assigned_to = auth.uid()
            OR user_has_permission('crm:contacts:write')
        )
    );

CREATE POLICY "Users can update deals in their tenant"
    ON crm_deals FOR UPDATE
    USING (
        tenant_id = get_user_tenant_id()
        AND (
            created_by = auth.uid()
            OR assigned_to = auth.uid()
            OR user_has_permission('crm:deals:write')
        )
    );
