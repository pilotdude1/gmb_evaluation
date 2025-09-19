-- =====================================================
-- CORRECTED Secure User Profile Setup Functions
-- Fixed to match actual database schema
-- =====================================================

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS setup_user_tenant_secure(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_user_profile_secure(UUID);

-- Create a secure function that can create user profiles
CREATE OR REPLACE FUNCTION create_user_profile_secure(user_id UUID)
RETURNS user_profiles AS $$
DECLARE
    new_profile user_profiles;
BEGIN
    -- Check if profile already exists
    SELECT * INTO new_profile FROM user_profiles WHERE id = user_id;
    
    IF FOUND THEN
        RETURN new_profile;
    END IF;
    
    -- Create new profile (this bypasses RLS because function has SECURITY DEFINER)
    INSERT INTO user_profiles (id)
    VALUES (user_id)
    RETURNING * INTO new_profile;
    
    RETURN new_profile;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_user_profile_secure(UUID) TO authenticated;

-- =====================================================
-- Complete setup function (CORRECTED)
-- =====================================================

CREATE OR REPLACE FUNCTION setup_user_tenant_secure(
    user_id UUID,
    user_email TEXT,
    tenant_name TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    new_tenant tenants;
    new_profile user_profiles;
    result JSONB;
    tenant_slug TEXT;
BEGIN
    -- Create or get user profile
    SELECT * INTO new_profile FROM create_user_profile_secure(user_id);
    
    -- Check if user already has a tenant
    IF new_profile.current_tenant_id IS NOT NULL THEN
        SELECT json_build_object(
            'success', true,
            'message', 'User already has tenant',
            'tenant_id', new_profile.current_tenant_id,
            'profile_id', new_profile.id
        ) INTO result;
        RETURN result;
    END IF;
    
    -- Generate unique slug for tenant
    tenant_slug := lower(regexp_replace(
        COALESCE(tenant_name, split_part(user_email, '@', 1) || '-org'), 
        '[^a-z0-9]+', '-', 'g'
    ));
    
    -- Ensure slug is unique by adding suffix if needed
    WHILE EXISTS (SELECT 1 FROM tenants WHERE slug = tenant_slug) LOOP
        tenant_slug := tenant_slug || '-' || floor(random() * 1000)::text;
    END LOOP;
    
    -- Create new tenant (using only existing columns)
    INSERT INTO tenants (
        name,
        slug,
        industry,
        settings
    ) VALUES (
        COALESCE(tenant_name, split_part(user_email, '@', 1) || '''s Organization'),
        tenant_slug,
        'general',
        json_build_object(
            'setup_type', 'auto', 
            'created_via', 'secure_function',
            'user_email', user_email
        )
    )
    RETURNING * INTO new_tenant;
    
    -- Update user profile with tenant
    UPDATE user_profiles 
    SET current_tenant_id = new_tenant.id,
        updated_at = NOW()
    WHERE id = user_id;
    
    -- Add user to tenant with admin role
    INSERT INTO tenant_users (
        tenant_id,
        user_id,
        role,
        permissions,
        joined_at
    ) VALUES (
        new_tenant.id,
        user_id,
        'admin',
        json_build_object(
            'crm:accounts:write', true,
            'crm:contacts:write', true,
            'crm:deals:write', true,
            'crm:activities:write', true,
            'crm:campaigns:write', true
        ),
        NOW()
    );
    
    SELECT json_build_object(
        'success', true,
        'message', 'Tenant setup completed successfully',
        'tenant_id', new_tenant.id,
        'tenant_name', new_tenant.name,
        'tenant_slug', new_tenant.slug,
        'profile_id', new_profile.id
    ) INTO result;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    SELECT json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_detail', SQLSTATE,
        'error_hint', 'Check if all required tables exist and user has proper authentication'
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION setup_user_tenant_secure(UUID, TEXT, TEXT) TO authenticated;

-- =====================================================
-- Update the auth trigger to use secure function
-- =====================================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Use the secure function to create profile
    PERFORM create_user_profile_secure(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Test the functions (optional - comment out for production)
-- =====================================================

-- These are just for verification - you can run them to test
/*
-- Test profile creation (replace with actual user ID)
SELECT create_user_profile_secure('your-user-id-here');

-- Test complete setup (replace with actual user ID and email)
SELECT setup_user_tenant_secure('your-user-id-here', 'test@example.com', NULL);
*/

-- =====================================================
-- Verification queries
-- =====================================================

-- Check if functions exist
SELECT 
    p.proname as function_name,
    p.prosecdef as is_security_definer,
    pg_get_function_identity_arguments(p.oid) as arguments
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' 
AND p.proname IN ('create_user_profile_secure', 'setup_user_tenant_secure');

-- Check RLS policies
SELECT tablename, policyname, cmd, permissive
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'tenants', 'tenant_users')
ORDER BY tablename, policyname;
