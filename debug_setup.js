// Debug the setup process step by step
async function debugSetupProcess() {
  console.log('🔍 Starting debug process...');
  
  try {
    // Import Supabase client
    const supabaseModule = await import('/src/lib/supabaseClient.ts');
    const { supabase, authUtils } = supabaseModule;
    
    // Step 1: Check authentication
    console.log('Step 1: Checking authentication...');
    const user = await authUtils.getCurrentUser();
    if (!user) {
      console.log('❌ No authenticated user');
      return;
    }
    console.log('✅ User authenticated:', user.email, 'ID:', user.id);
    
    // Step 2: Check if secure functions exist
    console.log('Step 2: Testing if secure functions exist...');
    
    try {
      const { data: testResult, error: testError } = await supabase.rpc('setup_user_tenant_secure', {
        user_id: user.id,
        user_email: user.email || '',
        tenant_name: 'Test Organization'
      });
      
      console.log('Function call result:', { testResult, testError });
      
      if (testError) {
        if (testError.message.includes('function') && testError.message.includes('does not exist')) {
          console.log('❌ Function does not exist - you need to run the SQL first');
          console.log('💡 Run the fixed_secure_setup.sql in your Supabase SQL editor');
          return;
        } else {
          console.log('❌ Function exists but failed:', testError.message);
        }
      } else {
        console.log('✅ Function executed successfully:', testResult);
      }
      
    } catch (funcError) {
      console.log('❌ Error calling function:', funcError.message);
    }
    
    // Step 3: Check user profile
    console.log('Step 3: Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    if (profileError) {
      console.log('❌ Error fetching profile:', profileError.message);
    } else if (!profile) {
      console.log('❌ No user profile exists');
    } else {
      console.log('✅ User profile:', profile);
      
      if (profile.current_tenant_id) {
        console.log('✅ User has tenant ID:', profile.current_tenant_id);
        
        // Check tenant details
        const { data: tenant } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', profile.current_tenant_id)
          .single();
          
        if (tenant) {
          console.log('✅ Tenant details:', tenant);
        }
        
        // Check tenant membership
        const { data: membership } = await supabase
          .from('tenant_users')
          .select('*')
          .eq('user_id', user.id)
          .eq('tenant_id', profile.current_tenant_id)
          .single();
          
        if (membership) {
          console.log('✅ Tenant membership:', membership);
        }
      } else {
        console.log('❌ User profile exists but no tenant assigned');
      }
    }
    
    // Step 4: Test account creation if everything looks good
    if (profile && profile.current_tenant_id) {
      console.log('Step 4: Testing account creation...');
      
      const crmModule = await import('/src/lib/crm/crmClient.ts');
      const { crmClient } = crmModule;
      
      const testAccount = {
        name: 'Debug Test Account',
        industry: 'technology',
        business_type: 'prospect'
      };
      
      const { data: account, error: accountError } = await crmClient.createAccount(testAccount);
      
      if (accountError) {
        console.log('❌ Account creation failed:', accountError.message);
      } else {
        console.log('✅ Account created successfully:', account);
        console.log('🎉 EVERYTHING WORKS!');
      }
    }
    
  } catch (error) {
    console.log('❌ Debug process failed:', error.message);
  }
}

// Instructions
console.log('🚀 Debug Setup Process Ready!');
console.log('📋 Instructions:');
console.log('   1. Make sure you are logged in');
console.log('   2. Run: debugSetupProcess()');
console.log('   3. Check each step in the console output');

// Make function available globally
window.debugSetupProcess = debugSetupProcess;
