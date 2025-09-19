-- EMERGENCY RLS FIX - Copy/Paste This EXACTLY Into Supabase SQL Editor
-- This creates a temporary permissive policy to get things working

-- 1. Check current policies
SELECT 'BEFORE FIX - Current Policies:' as status;
SELECT policyname, cmd, with_check FROM pg_policies WHERE tablename = 'crm_accounts';

-- 2. Drop ALL existing policies on crm_accounts 
DROP POLICY IF EXISTS "Users can create accounts in their tenant" ON crm_accounts;
DROP POLICY IF EXISTS "Members can insert by tenant" ON crm_accounts;
DROP POLICY IF EXISTS "Members can select by tenant" ON crm_accounts;
DROP POLICY IF EXISTS "Temporary permissive policy" ON crm_accounts;

-- 3. Create SIMPLE permissive policies that just check authentication
-- SELECT policy
CREATE POLICY "Allow authenticated select" ON crm_accounts 
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- INSERT policy 
CREATE POLICY "Allow authenticated insert" ON crm_accounts 
    FOR INSERT 
    WITH CHECK (
        auth.role() = 'authenticated' 
        AND created_by = auth.uid()
    );

-- UPDATE policy
CREATE POLICY "Allow authenticated update" ON crm_accounts 
    FOR UPDATE 
    USING (created_by = auth.uid())
    WITH CHECK (created_by = auth.uid());

-- DELETE policy  
CREATE POLICY "Allow authenticated delete" ON crm_accounts 
    FOR DELETE 
    USING (created_by = auth.uid());

-- 4. Verify the new policies
SELECT 'AFTER FIX - New Policies:' as status;
SELECT policyname, cmd, with_check FROM pg_policies WHERE tablename = 'crm_accounts' ORDER BY cmd;

-- 5. Test authentication
SELECT 'AUTH TEST:' as status, auth.uid() as user_id, auth.role() as role;
