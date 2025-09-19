-- Complete RLS Fix for crm_accounts
-- This will ensure proper INSERT policy exists

-- 1. First, let's see what policies currently exist
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'crm_accounts'
ORDER BY cmd, policyname;

-- 2. Drop any existing INSERT policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create accounts in their tenant" ON crm_accounts;
DROP POLICY IF EXISTS "Members can insert by tenant" ON crm_accounts;
DROP POLICY IF EXISTS "Temporary permissive policy" ON crm_accounts;

-- 3. Create a new INSERT policy that matches the SELECT policy pattern
-- This ensures consistency between SELECT and INSERT policies
CREATE POLICY "Members can insert by tenant"
    ON crm_accounts FOR INSERT
    WITH CHECK (
        tenant_id IN (
            SELECT tu.tenant_id 
            FROM tenant_users tu 
            WHERE tu.user_id = auth.uid()
        )
        AND created_by = auth.uid()
    );

-- 4. Verify the policy was created
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'crm_accounts'
ORDER BY cmd, policyname;

-- 5. Test the policy logic
SELECT 
    'Policy Test' as test_type,
    auth.uid() as current_user,
    (
        SELECT array_agg(tu.tenant_id)
        FROM tenant_users tu 
        WHERE tu.user_id = auth.uid()
    ) as user_tenants;
