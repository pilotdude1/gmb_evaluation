-- =====================================================
-- Fix User Profiles RLS Policies
-- Add missing INSERT policy to allow profile creation
-- =====================================================

-- Add policy to allow users to create their own profile
-- This is needed for the signup flow and profile auto-creation
CREATE POLICY "Users can create their own profile"
    ON user_profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Optional: Add policy to allow users to delete their own profile
-- (Commented out for safety, uncomment if needed)
-- CREATE POLICY "Users can delete their own profile"
--     ON user_profiles FOR DELETE
--     USING (auth.uid() = id);

-- =====================================================
-- Also fix tenant_users INSERT policy if needed
-- =====================================================

-- Check if we need to add INSERT policy for tenant_users
-- Users might need to be able to join tenants during signup
CREATE POLICY "Users can join tenants during signup"
    ON tenant_users FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Add helpful comment for documentation
-- =====================================================

COMMENT ON POLICY "Users can create their own profile" ON user_profiles IS 
'Allows authenticated users to create their own user_profiles record during signup process. Required for auto-profile creation and tenant setup.';

COMMENT ON POLICY "Users can join tenants during signup" ON tenant_users IS 
'Allows users to be added to tenants during the signup/setup process. Required for tenant membership creation.';
