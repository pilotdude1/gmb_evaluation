-- Temporary fix: Disable the profiles trigger to allow signup to work
-- Run this in your Supabase SQL Editor

-- Drop the trigger that's causing the signup error
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Now signup should work without trying to create a profile
-- You can manually create profiles later or re-enable the trigger after fixing it 