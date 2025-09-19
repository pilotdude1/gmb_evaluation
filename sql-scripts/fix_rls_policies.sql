-- =====================================================
-- Fix User Profiles RLS Policies for Cloud Deployment
-- Add missing INSERT policies safely
-- =====================================================

-- Add policy to allow users to create their own profile
-- Use CREATE OR REPLACE to handle existing policies safely
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
CREATE POLICY "Users can create their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Add policy to allow users to join tenants during signup
-- This is needed for the tenant setup process
DROP POLICY IF EXISTS "Users can join tenants during signup" ON tenant_users;
CREATE POLICY "Users can join tenants during signup"
    ON tenant_users FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Verify the policies were created
-- =====================================================

-- Check user_profiles policies
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- Check tenant_users policies  
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'tenant_users' 
AND policyname LIKE '%signup%'
ORDER BY policyname;

-- =====================================================
-- Test queries to verify RLS is working correctly
-- =====================================================

-- These are informational queries - comment them out if running in production
/*
-- Check if we can see the policies
\d+ user_profiles
\d+ tenant_users

-- Check existing data
SELECT id, current_tenant_id, created_at 
FROM user_profiles 
LIMIT 5;

SELECT tenant_id, user_id, role 
FROM tenant_users 
LIMIT 5;
*/
