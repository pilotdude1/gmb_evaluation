-- =====================================================
-- Alternative User Profile Setup Solution
-- Create a function that bypasses RLS for profile creation
-- =====================================================

-- Create a secure function that can create user profiles
-- This function runs with SECURITY DEFINER (elevated privileges)
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
-- Also create a tenant setup function
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
    tenant_user_record tenant_users;
    result JSONB;
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
    
    -- Create new tenant
    INSERT INTO tenants (
        name,
        slug,
        industry,
        settings
    ) VALUES (
        COALESCE(tenant_name, split_part(user_email, '@', 1) || '''s Organization'),
        lower(regexp_replace(split_part(user_email, '@', 1), '[^a-z0-9]+', '-', 'g')),
        'general',
        json_build_object('setup_type', 'auto', 'created_via', 'secure_function')
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
        'message', 'Tenant setup completed',
        'tenant_id', new_tenant.id,
        'tenant_name', new_tenant.name,
        'profile_id', new_profile.id
    ) INTO result;
    
    RETURN result;
    
EXCEPTION WHEN OTHERS THEN
    SELECT json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_detail', SQLSTATE
    ) INTO result;
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION setup_user_tenant_secure(UUID, TEXT, TEXT) TO authenticated;

-- =====================================================
-- Update the trigger to use the secure function
-- =====================================================

-- Replace the existing trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- Use the secure function to create profile
    PERFORM create_user_profile_secure(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON FUNCTION create_user_profile_secure(UUID) IS 
'Securely creates a user profile bypassing RLS. Used during signup and manual setup.';

COMMENT ON FUNCTION setup_user_tenant_secure(UUID, TEXT, TEXT) IS 
'Completes user setup including profile creation, tenant creation, and tenant membership. Bypasses RLS for setup operations.';

COMMENT ON FUNCTION handle_new_user() IS 
'Updated trigger function that uses secure profile creation to avoid RLS issues.';
