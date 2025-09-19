-- Safe Tenant-Based RLS Policies for crm_accounts
-- This upgrade adds proper tenant isolation while maintaining compatibility

-- 1. First, check what's currently working
SELECT 'CURRENT POLICIES:' as status;
SELECT policyname, cmd, with_check FROM pg_policies WHERE tablename = 'crm_accounts' ORDER BY cmd;

-- 2. Test current user's tenant setup
SELECT 'CURRENT USER TENANT:' as status;
SELECT 
    auth.uid() as user_id,
    (SELECT current_tenant_id FROM user_profiles WHERE id = auth.uid()) as user_tenant_from_profile,
    get_user_tenant_id() as user_tenant_from_function;

-- 3. Check tenant_users relationship for current user
SELECT 'TENANT MEMBERSHIP:' as status;
SELECT tu.tenant_id, tu.role, tu.status 
FROM tenant_users tu 
WHERE tu.user_id = auth.uid();

-- 4. Backup current policies (they're working!)
-- We'll replace them with tenant-aware versions

-- 5. Drop current simple policies
DROP POLICY IF EXISTS "Allow authenticated select" ON crm_accounts;
DROP POLICY IF EXISTS "Allow authenticated insert" ON crm_accounts;
DROP POLICY IF EXISTS "Allow authenticated update" ON crm_accounts;
DROP POLICY IF EXISTS "Allow authenticated delete" ON crm_accounts;

-- 6. Create tenant-aware policies that use the SAME logic as the form

-- SELECT: Users can see accounts in their tenant
CREATE POLICY "Tenant members can select accounts"
    ON crm_accounts FOR SELECT
    USING (
        -- Check if user's current tenant matches the account's tenant
        tenant_id = (
            SELECT current_tenant_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        )
        -- AND ensure user is actually a member of that tenant
        AND EXISTS (
            SELECT 1 FROM tenant_users tu 
            WHERE tu.user_id = auth.uid() 
            AND tu.tenant_id = crm_accounts.tenant_id
            AND tu.status = 'active'
        )
    );

-- INSERT: Users can create accounts in their tenant
CREATE POLICY "Tenant members can insert accounts"
    ON crm_accounts FOR INSERT
    WITH CHECK (
        -- Require authentication
        auth.role() = 'authenticated'
        -- AND require created_by to be current user
        AND created_by = auth.uid()
        -- AND require tenant_id to match user's current tenant
        AND tenant_id = (
            SELECT current_tenant_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        )
        -- AND ensure user is actually a member of that tenant
        AND EXISTS (
            SELECT 1 FROM tenant_users tu 
            WHERE tu.user_id = auth.uid() 
            AND tu.tenant_id = crm_accounts.tenant_id
            AND tu.status = 'active'
        )
    );

-- UPDATE: Users can update accounts they created in their tenant
CREATE POLICY "Tenant members can update their accounts"
    ON crm_accounts FOR UPDATE
    USING (
        created_by = auth.uid()
        AND tenant_id = (
            SELECT current_tenant_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        )
    )
    WITH CHECK (
        created_by = auth.uid()
        AND tenant_id = (
            SELECT current_tenant_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- DELETE: Users can delete accounts they created in their tenant
CREATE POLICY "Tenant members can delete their accounts"
    ON crm_accounts FOR DELETE
    USING (
        created_by = auth.uid()
        AND tenant_id = (
            SELECT current_tenant_id 
            FROM user_profiles 
            WHERE id = auth.uid()
        )
    );

-- 7. Verify the new policies
SELECT 'NEW POLICIES:' as status;
SELECT policyname, cmd, with_check FROM pg_policies WHERE tablename = 'crm_accounts' ORDER BY cmd;

-- 8. Test the INSERT policy with same values as the form would send
SELECT 'POLICY TEST:' as status;
SELECT 
    'Would INSERT work?' as test,
    auth.role() = 'authenticated' as is_authenticated,
    auth.uid() is not null as has_user_id,
    (SELECT current_tenant_id FROM user_profiles WHERE id = auth.uid()) is not null as has_tenant,
    EXISTS (
        SELECT 1 FROM tenant_users tu 
        WHERE tu.user_id = auth.uid() 
        AND tu.tenant_id = (SELECT current_tenant_id FROM user_profiles WHERE id = auth.uid())
        AND tu.status = 'active'
    ) as is_tenant_member;
