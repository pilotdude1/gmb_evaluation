# 🔧 Apply RLS Policy Fix

## **URGENT**: Apply this fix to resolve the account creation error

### Step 1: Go to Supabase SQL Editor
1. Open your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project: `gcgejeliljokhkuvpsxf`
3. Click **SQL Editor** in the left sidebar

### Step 2: Run This SQL
Copy and paste this exact SQL into the editor:

```sql
-- Fix Account Creation RLS Issues
-- Drop any existing conflicting policies
DROP POLICY IF EXISTS "Users can create accounts in their tenant" ON crm_accounts;
DROP POLICY IF EXISTS "Members can insert by tenant" ON crm_accounts;

-- Create ONE clear policy that handles account creation
CREATE POLICY "Users can create accounts in their tenant"
    ON crm_accounts FOR INSERT
    WITH CHECK (
        tenant_id = get_user_tenant_id()
        AND created_by = auth.uid()
    );

-- Verify the fix worked
SELECT 
    policyname, 
    cmd,
    with_check
FROM pg_policies 
WHERE tablename = 'crm_accounts' 
AND cmd = 'INSERT';
```

### Step 3: Test Again
After running the SQL:
1. Go back to `/crm/accounts/new`
2. Run the test script: `final_test.js` 
3. Fill out and submit the form
4. You should see success instead of the RLS error

### Expected Result
✅ **SUCCESS**: Account creation should work  
❌ **Still failing**: Check the verification query output for policy conflicts

---
## 🎯 **Why This Fixes It**

The issue was **conflicting RLS policies**:
- **Before**: Multiple INSERT policies on `crm_accounts` (confusing PostgreSQL)
- **After**: Single, clear INSERT policy with proper conditions

This ensures only authenticated users can create accounts in their own tenant.
