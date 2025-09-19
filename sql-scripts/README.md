# SQL Scripts

This directory contains SQL scripts for debugging, fixing, and maintaining the GMB Evaluation CRM database.

## 🔧 **RLS Policy Scripts**

### Working Solutions (Use These)
- **`permissive_tenant_policies.sql`** ✅ **FINAL WORKING VERSION** - Tenant-based RLS policies that allow account creation while providing proper isolation
- **`emergency_rls_fix.sql`** ✅ **EMERGENCY FALLBACK** - Simple authentication-only policies (used as stepping stone)

### Development/Debug Scripts  
- **`safe_tenant_policies.sql`** - First attempt at tenant policies (too restrictive)
- **`fix_account_creation_rls.sql`** - Early RLS fix attempt
- **`debug_rls_policies.sql`** - Diagnostic queries for RLS issues
- **`debug_rls_deeper.sql`** - Deep RLS debugging queries
- **`fix_rls_complete.sql`** - Alternative RLS fix approach
- **`fix_crm_rls_policies.sql`** - CRM-specific RLS fixes

## 📊 **Migration Scripts**

- **`complete_migration.sql`** - Complete database schema setup
- **`safe_migration.sql`** - Safe migration that handles existing objects
- **`init-db.sql`** - Database initialization
- **`fixed_secure_setup.sql`** - Secure user setup functions
- **`fix_rls_policies.sql`** - General RLS policy fixes

## 🎯 **Evolution Summary**

The RLS policy evolution:
1. **Started with**: Simple auth-only policies (`emergency_rls_fix.sql`)
2. **Attempted**: Strict tenant policies (`safe_tenant_policies.sql`) - too restrictive
3. **Final solution**: Permissive tenant policies (`permissive_tenant_policies.sql`) - ✅ **WORKS**

## 🚀 **Usage**

For new deployments, use:
1. `complete_migration.sql` or `safe_migration.sql` for schema
2. `permissive_tenant_policies.sql` for RLS policies

For troubleshooting:
- Use `debug_rls_*.sql` scripts to diagnose RLS issues
- Apply `emergency_rls_fix.sql` as temporary fallback if needed
