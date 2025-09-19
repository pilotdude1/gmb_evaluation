// Browser Console Test for CRM Account Creation
// Copy and paste this into your browser console while signed in to the app

console.log('🧪 Testing CRM Account Creation from Browser...\n');

async function testAccountCreationInBrowser() {
  try {
    // Test if supabase is available
    if (typeof supabase === 'undefined') {
      console.log('❌ Supabase client not found in global scope');
      console.log('💡 Try: window.supabase or check the console on a page with Supabase loaded');
      return;
    }

    // Step 1: Check authentication
    console.log('🔐 Checking authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.log('❌ Not authenticated:', authError?.message || 'No user');
      console.log('💡 Please sign in first');
      return;
    }
    
    console.log('✅ Authenticated as:', user.email);

    // Step 2: Test the RLS functions directly
    console.log('\n🔍 Testing RLS functions...');
    
    const { data: authTest, error: authTestError } = await supabase
      .from('user_profiles')
      .select('current_tenant_id')
      .eq('id', user.id)
      .maybeSingle();
    
    console.log('User profile query result:', { authTest, authTestError });

    // Step 3: Test a simple RPC call to check auth.uid()
    const { data: rpcTest, error: rpcError } = await supabase.rpc('get_user_tenant_id');
    console.log('get_user_tenant_id() result:', { rpcTest, rpcError });

    // Step 4: Try creating a test account
    console.log('\n🏢 Testing account creation...');
    
    const testAccount = {
      name: `Browser Test Account ${Date.now()}`,
      tenant_id: rpcTest, // Use the tenant from the RPC call
      created_by: user.id,
      industry: 'technology',
      business_type: 'prospect'
    };

    console.log('Creating account with data:', testAccount);

    const { data: account, error: createError } = await supabase
      .from('crm_accounts')
      .insert(testAccount)
      .select()
      .single();

    if (createError) {
      console.log('❌ Account creation failed:', createError);
      
      // Check if it's an RLS error
      if (createError.message.includes('row-level security')) {
        console.log('\n🔍 RLS Policy Analysis:');
        console.log('- auth.uid():', user.id);
        console.log('- get_user_tenant_id():', rpcTest);
        console.log('- created_by in data:', testAccount.created_by);
        console.log('- tenant_id in data:', testAccount.tenant_id);
        
        if (!rpcTest) {
          console.log('💡 Issue: get_user_tenant_id() returned null - no tenant setup');
        } else if (testAccount.tenant_id !== rpcTest) {
          console.log('💡 Issue: tenant_id mismatch');
        } else {
          console.log('💡 Issue: Likely permission check failing');
        }
      }
      return;
    }

    console.log('✅ Account created successfully:', account);

    // Clean up
    console.log('\n🧹 Cleaning up test account...');
    const { error: deleteError } = await supabase
      .from('crm_accounts')
      .delete()
      .eq('id', account.id);

    if (deleteError) {
      console.log('⚠️ Could not delete test account:', deleteError.message);
    } else {
      console.log('✅ Test account cleaned up');
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.log('💥 Unexpected error:', error);
  }
}

// Run the test
testAccountCreationInBrowser();
