-- Fix Account Creation RLS Issues
-- Run this in your Supabase SQL Editor

-- 1. First, check what policies are currently active
SELECT 
    policyname, 
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'crm_accounts' 
AND cmd = 'INSERT';

-- 2. Drop BOTH conflicting policies to avoid multiple policy conflicts
DROP POLICY IF EXISTS "Users can create accounts in their tenant" ON crm_accounts;
DROP POLICY IF EXISTS "Members can insert by tenant" ON crm_accounts;

-- 3. Create ONE clear policy that handles account creation
CREATE POLICY "Users can create accounts in their tenant"
    ON crm_accounts FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id()
        AND created_by = auth.uid()
    );

-- 4. Also ensure the helper functions exist and work correctly
-- Test the functions
SELECT 
    'Testing functions...' as status,
    auth.uid() as current_user_id,
    get_user_tenant_id() as user_tenant_id;

-- 5. If you're still having issues, create a temporary permissive policy for testing
-- Uncomment the lines below ONLY for testing:

-- DROP POLICY IF EXISTS "Temporary permissive policy" ON crm_accounts;
-- CREATE POLICY "Temporary permissive policy"
--     ON crm_accounts FOR INSERT
--     WITH CHECK (auth.role() = 'authenticated');

-- 6. Verify the policy was created correctly
SELECT 
    policyname, 
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'crm_accounts' 
AND cmd = 'INSERT';
