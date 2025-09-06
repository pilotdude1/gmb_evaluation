-- Test script to verify profiles table setup
-- Run this in your Supabase SQL Editor

-- 1. Check if profiles table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'profiles'
);

-- 2. Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 3. Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'profiles';

-- 4. Check if trigger exists
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 5. Test insert (replace 'your-user-id' with actual UUID)
-- INSERT INTO profiles (id, display_name, bio, location, website) 
-- VALUES ('your-user-id', 'Test User', 'Test Bio', 'Test Location', 'https://test.com')
-- ON CONFLICT (id) DO UPDATE SET 
--   display_name = EXCLUDED.display_name,
--   bio = EXCLUDED.bio,
--   location = EXCLUDED.location,
--   website = EXCLUDED.website,
--   updated_at = NOW();

-- 6. Check existing profiles (if any)
SELECT * FROM profiles LIMIT 5; 