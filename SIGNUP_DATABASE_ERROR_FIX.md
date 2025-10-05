# Sign Up Database Error Fix

## Problem Description

The sign up functionality was failing with a "Database error saving new user" error. This was caused by issues with the Supabase authentication trigger that automatically creates user profiles when a new user registers.

## Root Cause Analysis

The issue was related to:

1. **Database Trigger Problems**: The `handle_new_user()` trigger function was failing to create user profiles due to:
   - Row Level Security (RLS) policy conflicts
   - Missing or incorrectly configured tables
   - Insufficient permissions for the trigger function

2. **RLS Policy Issues**: The Row Level Security policies were either:
   - Too restrictive, preventing the trigger from inserting profiles
   - Missing entirely, causing permission errors
   - Conflicting with each other

3. **Table Structure**: The application expected both `profiles` and `user_profiles` tables, but they might not exist or have the correct structure.

## Solution Implemented

### 1. Database Fix (`sql-files/fix_signup_database_error.sql`)

This comprehensive SQL script:

- **Drops and recreates the problematic trigger and function**
- **Ensures both `profiles` and `user_profiles` tables exist** with proper structure
- **Implements robust RLS policies** that allow users to manage their own profiles
- **Creates an error-resilient trigger function** that won't fail user signup if profile creation fails
- **Includes a manual profile creation function** as a fallback
- **Grants proper permissions** to all necessary roles

Key features of the fix:
- Uses `SECURITY DEFINER` to run with elevated privileges
- Includes exception handling to prevent signup failures
- Creates both table types for compatibility
- Provides comprehensive RLS policies
- Includes a manual fallback function

### 2. Client-Side Enhancement (`src/routes/signup/+page.svelte`)

Enhanced the signup page to:

- **Handle specific database error types** with appropriate user messaging
- **Attempt manual profile creation** if automatic creation might have failed
- **Provide better error messages** for different failure scenarios
- **Include network error handling**
- **Log detailed error information** for debugging

## How to Apply the Fix

### Step 1: Apply Database Fix

1. Open your Supabase SQL Editor
2. Copy and paste the contents of `sql-files/fix_signup_database_error.sql`
3. Execute the SQL script
4. Verify that the trigger and tables were created successfully

### Step 2: Test the Fix

1. Try signing up with a new email address
2. Check the browser console for any error messages
3. Verify that the user profile was created in both tables
4. Test the manual profile creation function if needed

### Step 3: Verification Queries

Run these queries in Supabase SQL Editor to verify the fix:

```sql
-- Check if the trigger exists
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if tables exist and have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('profiles', 'user_profiles') 
AND schemaname = 'public';

-- Check RLS policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('profiles', 'user_profiles');
```

## Prevention Measures

To prevent this issue in the future:

1. **Always test authentication flows** in both development and staging environments
2. **Monitor Supabase logs** for trigger failures
3. **Use proper RLS policy testing** before deploying changes
4. **Include exception handling** in all database triggers
5. **Document any custom authentication setup** requirements

## Troubleshooting

If sign up still fails after applying this fix:

1. **Check Supabase logs** for specific error messages
2. **Verify environment variables** are correctly set
3. **Test the manual profile creation function**:
   ```javascript
   const { data, error } = await supabase.rpc('create_user_profile_manual', {
     user_id: 'user-uuid-here',
     user_email: 'user@example.com'
   });
   ```
4. **Check browser console** for client-side errors
5. **Verify Supabase project status** and database connectivity

## Additional Resources

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Triggers Documentation](https://supabase.com/docs/guides/database/functions)
- [Authentication Error Handling](https://supabase.com/docs/guides/auth/error-handling)

## Files Modified

1. `sql-files/fix_signup_database_error.sql` - Comprehensive database fix
2. `src/routes/signup/+page.svelte` - Enhanced error handling
3. `SIGNUP_DATABASE_ERROR_FIX.md` - This documentation

## Testing Checklist

- [ ] New user signup works without errors
- [ ] User profiles are created in both tables
- [ ] Error messages are user-friendly
- [ ] Manual profile creation function works
- [ ] RLS policies protect user data appropriately
- [ ] Authentication flow redirects correctly
