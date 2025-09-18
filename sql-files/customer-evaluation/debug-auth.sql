-- Debug script to check authentication and permissions
-- Run this in your Supabase SQL Editor to diagnose the issue

-- Check current user and authentication
SELECT 
    auth.uid() as current_user_id,
    auth.role() as current_role,
    auth.email() as current_email;

-- Check if customer_evaluation_searches table exists and is accessible
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'customer_evaluation_searches'
) as table_exists;

-- Check table permissions
SELECT 
    grantee, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_name = 'customer_evaluation_searches' 
AND table_schema = 'public';

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename LIKE 'customer_evaluation%';

-- Check existing policies
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
WHERE tablename LIKE 'customer_evaluation%'
ORDER BY tablename, policyname;

-- Test basic insert (this will help us see what's failing)
-- Uncomment the line below and replace 'your-user-id' with a real UUID after checking auth.uid() above
-- INSERT INTO public.customer_evaluation_searches (user_id, search_params) 
-- VALUES ('your-user-id', '{"test": true}'::jsonb);
