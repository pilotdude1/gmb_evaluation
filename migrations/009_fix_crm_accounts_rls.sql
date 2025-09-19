-- Fix Account Creation RLS Issues
-- This migration resolves conflicting RLS policies on crm_accounts

-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can create accounts in their tenant" ON crm_accounts;
DROP POLICY IF EXISTS "Members can insert by tenant" ON crm_accounts;

-- Create ONE clear policy that handles account creation
CREATE POLICY "Users can create accounts in their tenant"
    ON crm_accounts FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id()
        AND created_by = auth.uid()
    );
