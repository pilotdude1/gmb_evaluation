-- Delete Test Users Script
-- Run this in Supabase SQL Editor

-- =====================================================
-- 1. View all users (to see what you have)
-- =====================================================
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC;

-- =====================================================
-- 2. Delete specific test users by email
-- =====================================================
-- Uncomment and modify the email addresses as needed

-- DELETE FROM auth.users WHERE email = 'testuser123@gmail.com';
-- DELETE FROM auth.users WHERE email = 'testuser456@gmail.com';

-- =====================================================
-- 3. Delete all test users (be careful!)
-- =====================================================
-- This will delete ALL users with emails containing 'testuser'

-- DELETE FROM auth.users WHERE email LIKE 'testuser%@gmail.com';

-- =====================================================
-- 4. Delete users created in the last 24 hours
-- =====================================================
-- Useful for cleaning up test users after development

-- DELETE FROM auth.users WHERE created_at > NOW() - INTERVAL '1 day';

-- =====================================================
-- 5. Delete users with specific patterns
-- =====================================================
-- Delete users with test emails

-- DELETE FROM auth.users WHERE email LIKE '%test%@gmail.com';
-- DELETE FROM auth.users WHERE email LIKE '%@example.com';

-- =====================================================
-- 6. Verify deletion (run after deleting)
-- =====================================================
-- Check that users were deleted

SELECT COUNT(*) as remaining_users FROM auth.users;
SELECT COUNT(*) as test_users FROM auth.users WHERE email LIKE 'testuser%@gmail.com';

