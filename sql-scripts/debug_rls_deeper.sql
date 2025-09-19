-- Deep RLS Debugging - Run this in Supabase SQL Editor
-- This will help us understand why the policy is still failing

-- 1. Check ALL policies on crm_accounts (not just INSERT)
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'crm_accounts'
ORDER BY cmd, policyname;

-- 2. Test the helper functions directly
SELECT 
    'Function Test Results' as test_type,
    auth.uid() as current_user_id,
    get_user_tenant_id() as user_tenant_id,
    auth.role() as current_role;

-- 3. Check if RLS is actually enabled on the table
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'crm_accounts';

-- 4. Check if there are any restrictive SELECT policies that might interfere
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'crm_accounts' 
AND cmd = 'SELECT';

-- 5. Test what happens when we try a simple insert (this will fail but show us the exact error)
-- DO NOT RUN THIS - Just for reference:
-- INSERT INTO crm_accounts (name, tenant_id, created_by, industry, business_type) 
-- VALUES ('Test', get_user_tenant_id(), auth.uid(), 'technology', 'prospect');
