-- Complete fix for sign up database error
-- This addresses the common issues with user profile creation during signup
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. Drop existing problematic trigger and function
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- =====================================================
-- 2. Ensure the profiles table exists with correct structure
-- =====================================================

-- For the CRM system, we need user_profiles table (not just profiles)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  avatar_url TEXT,
  current_tenant_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Also ensure profiles table exists for compatibility
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  display_name TEXT,
  bio TEXT,
  location TEXT,
  website TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. Enable RLS on both tables
-- =====================================================

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 4. Drop and recreate RLS policies for user_profiles
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable update access for users based on id" ON public.user_profiles;
DROP POLICY IF EXISTS "Enable insert access for users based on id" ON public.user_profiles;

-- Create comprehensive RLS policies for user_profiles
CREATE POLICY "Enable read access for own profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Enable insert access for own profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update access for own profile" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 5. Drop and recreate RLS policies for profiles
-- =====================================================

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.profiles;
DROP POLICY IF EXISTS "Enable update access for users based on id" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert access for users based on id" ON public.profiles;

-- Create comprehensive RLS policies for profiles
CREATE POLICY "Enable read access for own profile" 
  ON public.profiles 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Enable insert access for own profile" 
  ON public.profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable update access for own profile" 
  ON public.profiles 
  FOR UPDATE 
  USING (auth.uid() = id) 
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 6. Create a robust profile creation function
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  display_name_value TEXT;
BEGIN
  -- Extract display name from metadata or use email
  display_name_value := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'display_name',
    NEW.email
  );

  -- Try to create user_profiles entry
  BEGIN
    INSERT INTO public.user_profiles (id, display_name)
    VALUES (NEW.id, display_name_value);
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'Failed to create user_profiles for user %: %', NEW.id, SQLERRM;
  END;

  -- Try to create profiles entry for compatibility
  BEGIN
    INSERT INTO public.profiles (id, display_name)
    VALUES (NEW.id, display_name_value);
  EXCEPTION
    WHEN OTHERS THEN
      -- Log the error but don't fail the user creation
      RAISE WARNING 'Failed to create profiles for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$;

-- =====================================================
-- 7. Create the trigger
-- =====================================================

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 8. Grant necessary permissions
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Grant permissions on user_profiles table
GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT ON public.user_profiles TO anon;

-- Grant permissions on profiles table
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;

-- =====================================================
-- 9. Create a manual profile creation function (fallback)
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_user_profile_manual(user_id UUID, user_email TEXT DEFAULT NULL)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  display_name_value TEXT;
BEGIN
  -- Set display name
  display_name_value := COALESCE(user_email, 'User');
  
  -- Try to create user_profiles entry
  BEGIN
    INSERT INTO public.user_profiles (id, display_name)
    VALUES (user_id, display_name_value)
    ON CONFLICT (id) DO UPDATE SET
      display_name = COALESCE(public.user_profiles.display_name, display_name_value),
      updated_at = NOW();
      
    -- Also create profiles entry for compatibility
    INSERT INTO public.profiles (id, display_name)
    VALUES (user_id, display_name_value)
    ON CONFLICT (id) DO UPDATE SET
      display_name = COALESCE(public.profiles.display_name, display_name_value),
      updated_at = NOW();
    
    SELECT json_build_object(
      'success', true,
      'message', 'Profile created successfully',
      'user_id', user_id
    ) INTO result;
    
  EXCEPTION WHEN OTHERS THEN
    SELECT json_build_object(
      'success', false,
      'error', SQLERRM,
      'error_detail', SQLSTATE
    ) INTO result;
  END;
  
  RETURN result;
END;
$$;

-- Grant execute permission on the manual function
GRANT EXECUTE ON FUNCTION public.create_user_profile_manual(UUID, TEXT) TO authenticated;

-- =====================================================
-- Comments for documentation
-- =====================================================

COMMENT ON FUNCTION public.handle_new_user() IS 
'Trigger function that creates user profiles automatically on signup. Uses exception handling to prevent signup failures.';

COMMENT ON FUNCTION public.create_user_profile_manual(UUID, TEXT) IS 
'Manual function to create user profiles. Can be called if automatic profile creation fails.';

-- =====================================================
-- Verification queries (run these to check if it worked)
-- =====================================================

-- Check if the trigger exists
-- SELECT trigger_name, event_object_table 
-- FROM information_schema.triggers 
-- WHERE trigger_name = 'on_auth_user_created';

-- Check if tables exist and have RLS enabled
-- SELECT schemaname, tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE tablename IN ('profiles', 'user_profiles') 
-- AND schemaname = 'public';

-- Check RLS policies
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
-- FROM pg_policies 
-- WHERE tablename IN ('profiles', 'user_profiles');
