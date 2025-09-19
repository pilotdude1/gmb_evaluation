-- Debug RLS Policies for CRM Account Creation
-- Run this in your Supabase SQL Editor to diagnose the issue

-- 1. Check which INSERT policies are currently active for crm_accounts
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'crm_accounts' 
AND cmd = 'INSERT'
ORDER BY policyname;

-- 2. Test if get_user_tenant_id() function works
SELECT 
    auth.uid() as current_user_id,
    get_user_tenant_id() as tenant_from_function;

-- 3. Check user profile and tenant
SELECT 
    id as user_id,
    current_tenant_id,
    created_at
FROM user_profiles 
WHERE id = auth.uid();

-- 4. Check tenant_users table for permissions
SELECT 
    tenant_id,
    user_id,
    role,
    permissions,
    joined_at
FROM tenant_users 
WHERE user_id = auth.uid();

-- 5. Test user_has_permission function (if it exists)
-- This might fail if the function doesn't exist yet
SELECT user_has_permission('crm:accounts:write') as has_write_permission;

-- 6. Show all functions related to user/tenant
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND (p.proname LIKE '%user%' OR p.proname LIKE '%tenant%')
ORDER BY p.proname;

-- 7. Test what values would be used in an INSERT
SELECT 
    auth.uid() as auth_uid,
    get_user_tenant_id() as tenant_id,
    'Test Account' as name,
    'technology' as industry;
