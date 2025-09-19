// Test CRM Account Creation RLS Policies
// Run this to test if account creation works with proper RLS setup

// Simple CommonJS version for Node.js
const { createClient } = require('@supabase/supabase-js');

// Test configuration - update with your Supabase details
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAccountCreation() {
  console.log('🧪 Testing CRM Account Creation...\n');

  try {
    // Step 1: Check if we have a user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ No authenticated user found');
      console.log('Please sign in first at your app URL');
      return;
    }

    console.log('✅ Authenticated user:', user.email);

    // Step 2: Check user profile and tenant
    console.log('\n📋 Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('current_tenant_id')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
      return;
    }

    if (!profile?.current_tenant_id) {
      console.log('❌ No tenant found for user');
      console.log('🔧 Attempting to set up tenant...');
      
      const { data: setupResult, error: setupError } = await supabase.rpc(
        'setup_user_tenant_secure',
        {
          user_id: user.id,
          user_email: user.email,
          tenant_name: null
        }
      );

      if (setupError || !setupResult?.success) {
        console.log('❌ Tenant setup failed:', setupError?.message || setupResult?.error);
        return;
      }

      console.log('✅ Tenant setup completed:', setupResult.tenant_id);
      profile.current_tenant_id = setupResult.tenant_id;
    } else {
      console.log('✅ User has tenant:', profile.current_tenant_id);
    }

    // Step 3: Check current RLS policies
    console.log('\n🔐 Checking RLS policies...');
    const { data: policies, error: policyError } = await supabase
      .from('pg_policies')
      .select('policyname, cmd, qual, with_check')
      .eq('tablename', 'crm_accounts')
      .eq('cmd', 'INSERT');

    if (policyError) {
      console.log('⚠️  Could not fetch policies (this is normal)');
    } else {
      console.log('📝 INSERT policies for crm_accounts:');
      policies.forEach(policy => {
        console.log(`  - ${policy.policyname}: ${policy.with_check || policy.qual}`);
      });
    }

    // Step 4: Test account creation
    console.log('\n🏢 Testing account creation...');
    
    const testAccount = {
      name: `Test Account ${Date.now()}`,
      tenant_id: profile.current_tenant_id,
      created_by: user.id,
      industry: 'technology',
      business_type: 'prospect',
      email: 'test@example.com',
      phone: '555-0123'
    };

    console.log('📤 Creating account with data:', testAccount);

    const { data: account, error: createError } = await supabase
      .from('crm_accounts')
      .insert(testAccount)
      .select()
      .single();

    if (createError) {
      console.log('❌ Account creation failed:', createError.message);
      console.log('💡 Full error:', createError);
      
      // Check specific RLS error patterns
      if (createError.message.includes('row-level security policy')) {
        console.log('\n🔍 RLS Policy Violation Detected');
        console.log('This suggests one of:');
        console.log('1. Missing required fields (tenant_id, created_by)');
        console.log('2. get_user_tenant_id() function returns null');
        console.log('3. user_has_permission() check failing');
        console.log('4. auth.uid() not matching created_by');
      }
      
      return;
    }

    console.log('✅ Account created successfully!');
    console.log('📄 Account details:', {
      id: account.id,
      name: account.name,
      tenant_id: account.tenant_id,
      created_by: account.created_by
    });

    // Step 5: Verify we can read the account back
    console.log('\n🔍 Testing account retrieval...');
    const { data: retrievedAccount, error: readError } = await supabase
      .from('crm_accounts')
      .select('*')
      .eq('id', account.id)
      .single();

    if (readError) {
      console.log('❌ Could not read account back:', readError.message);
    } else {
      console.log('✅ Account retrieved successfully');
    }

    // Clean up test account
    console.log('\n🧹 Cleaning up test account...');
    const { error: deleteError } = await supabase
      .from('crm_accounts')
      .delete()
      .eq('id', account.id);

    if (deleteError) {
      console.log('⚠️  Could not delete test account:', deleteError.message);
    } else {
      console.log('✅ Test account cleaned up');
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.log('💥 Unexpected error:', error.message);
    console.log('Full error:', error);
  }
}

// Run the test
testAccountCreation();
