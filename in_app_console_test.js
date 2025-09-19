// In-App Console Test for CRM Account Creation
// Run this in browser console on a page where Supabase is loaded (like /crm or /dashboard)

console.log('🧪 Testing CRM Account Creation from App Context...\n');

async function testAccountCreationInApp() {
  try {
    // Try different ways to access Supabase
    let supabaseClient = null;
    
    if (typeof supabase !== 'undefined') {
      supabaseClient = supabase;
    } else if (typeof window !== 'undefined' && window.supabase) {
      supabaseClient = window.supabase;
    } else if (typeof globalThis !== 'undefined' && globalThis.supabase) {
      supabaseClient = globalThis.supabase;
    } else {
      console.log('❌ Supabase client not accessible');
      console.log('💡 Make sure you are on a page with the CRM app loaded (like /crm or /dashboard)');
      console.log('💡 Alternative: Open DevTools Network tab and look for supabase requests to confirm it\'s working');
      return;
    }

    console.log('✅ Found Supabase client');

    // Step 1: Check authentication
    console.log('🔐 Checking authentication...');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Not authenticated:', authError?.message || 'No user');
      console.log('💡 Please sign in first');
      return;
    }
    
    console.log('✅ Authenticated as:', user.email);
    console.log('User ID:', user.id);

    // Step 2: Test the RLS functions directly
    console.log('\n🔍 Testing RLS functions...');
    
    // Test get_user_tenant_id function
    const { data: tenantId, error: tenantError } = await supabaseClient.rpc('get_user_tenant_id');
    console.log('get_user_tenant_id() result:', { tenantId, tenantError });

    if (tenantError) {
      console.log('❌ get_user_tenant_id() failed:', tenantError.message);
      return;
    }

    if (!tenantId) {
      console.log('❌ get_user_tenant_id() returned null - no tenant setup');
      console.log('💡 User needs tenant setup - try the secure setup function');
      
      // Try to set up tenant
      console.log('🔧 Attempting tenant setup...');
      const { data: setupResult, error: setupError } = await supabaseClient.rpc(
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
      
      console.log('✅ Tenant setup completed:', setupResult);
      const finalTenantId = setupResult.tenant_id;
      
      // Test again
      const { data: newTenantId } = await supabaseClient.rpc('get_user_tenant_id');
      console.log('get_user_tenant_id() after setup:', newTenantId);
    }

    // Get final tenant ID
    const { data: finalTenantId } = await supabaseClient.rpc('get_user_tenant_id');

    // Step 3: Try creating a test account
    console.log('\n🏢 Testing account creation...');
    
    const testAccount = {
      name: `Console Test Account ${Date.now()}`,
      tenant_id: finalTenantId,
      created_by: user.id,
      industry: 'technology',
      business_type: 'prospect',
      email: 'test@example.com'
    };

    console.log('Creating account with data:', testAccount);

    const { data: account, error: createError } = await supabaseClient
      .from('crm_accounts')
      .insert(testAccount)
      .select()
      .single();

    if (createError) {
      console.log('❌ Account creation failed:', createError);
      
      // Detailed RLS analysis
      if (createError.message.includes('row-level security')) {
        console.log('\n🔍 RLS Policy Analysis:');
        console.log('- auth.uid():', user.id);
        console.log('- get_user_tenant_id():', finalTenantId);
        console.log('- created_by in data:', testAccount.created_by);
        console.log('- tenant_id in data:', testAccount.tenant_id);
        console.log('- Policy expects: tenant_id = get_user_tenant_id() AND created_by = auth.uid()');
        
        if (!finalTenantId) {
          console.log('💡 Issue: get_user_tenant_id() returned null');
        } else if (testAccount.tenant_id !== finalTenantId) {
          console.log('💡 Issue: tenant_id mismatch');
        } else if (testAccount.created_by !== user.id) {
          console.log('💡 Issue: created_by mismatch');
        } else {
          console.log('💡 Issue: RLS policy still failing despite matching values');
          console.log('💡 Check if functions are working properly in RLS context');
        }
      }
      return;
    }

    console.log('✅ Account created successfully!');
    console.log('Account details:', {
      id: account.id,
      name: account.name,
      tenant_id: account.tenant_id,
      created_by: account.created_by
    });

    // Clean up
    console.log('\n🧹 Cleaning up test account...');
    const { error: deleteError } = await supabaseClient
      .from('crm_accounts')
      .delete()
      .eq('id', account.id);

    if (deleteError) {
      console.log('⚠️ Could not delete test account:', deleteError.message);
      console.log('You may need to delete it manually: ID =', account.id);
    } else {
      console.log('✅ Test account cleaned up');
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.log('💥 Unexpected error:', error);
  }
}

// Run the test
testAccountCreationInApp();
