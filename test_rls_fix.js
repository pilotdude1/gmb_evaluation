// Test RLS Fix for User Profiles
// Run this in browser console after logging in

async function testRLSFix() {
  console.log('🧪 Testing RLS Fix for User Profiles...');
  
  try {
    // Import Supabase client
    const supabaseModule = await import('/src/lib/supabaseClient.ts');
    const { supabase, authUtils } = supabaseModule;
    
    // Get current user
    const user = await authUtils.getCurrentUser();
    if (!user) {
      console.log('❌ No authenticated user. Please log in first.');
      return;
    }
    
    console.log('✅ Authenticated user:', user.email);
    
    // Check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    if (checkError) {
      console.log('❌ Error checking existing profile:', checkError.message);
      return;
    }
    
    if (existingProfile) {
      console.log('✅ User profile already exists:', existingProfile);
      console.log('🎯 RLS policies are working - user can read their profile');
      
      // Test if we can update the profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', user.id);
        
      if (updateError) {
        console.log('❌ Cannot update profile:', updateError.message);
      } else {
        console.log('✅ Can update own profile - UPDATE policy works');
      }
      
    } else {
      console.log('🔄 No profile exists, testing profile creation...');
      
      // Test profile creation (this should work now with RLS fix)
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({ id: user.id })
        .select()
        .single();
        
      if (createError) {
        console.log('❌ Profile creation failed:', createError.message);
        console.log('💡 RLS fix may not be applied or there\'s another issue');
        return;
      }
      
      console.log('✅ Profile creation successful!', newProfile);
      console.log('🎉 RLS INSERT policy is working!');
    }
    
    // Test tenant setup
    console.log('🔄 Testing tenant setup...');
    
    const setupModule = await import('/src/lib/crm/setupTenant.ts');
    const { setupUserTenant } = setupModule;
    
    const setupResult = await setupUserTenant(user.id, user.email || '');
    
    if (setupResult.success) {
      console.log('✅ Tenant setup successful!', setupResult);
      console.log('🎯 Ready to test account creation!');
      
      // Test account creation
      console.log('🔄 Testing account creation...');
      
      const crmModule = await import('/src/lib/crm/crmClient.ts');
      const { crmClient } = crmModule;
      
      const testAccount = {
        name: 'RLS Test Company',
        industry: 'technology',
        business_type: 'prospect'
      };
      
      const { data: account, error: accountError } = await crmClient.createAccount(testAccount);
      
      if (accountError) {
        console.log('❌ Account creation failed:', accountError.message);
      } else {
        console.log('✅ Account creation successful!', account);
        console.log('🎉 COMPLETE SUCCESS - All RLS issues fixed!');
      }
      
    } else {
      console.log('❌ Tenant setup failed:', setupResult.error?.message);
    }
    
  } catch (error) {
    console.log('❌ Test failed with error:', error.message);
  }
}

// Instructions
console.log('🚀 RLS Fix Test Ready!');
console.log('📋 Instructions:');
console.log('   1. Make sure you are logged in');
console.log('   2. Run: testRLSFix()');
console.log('   3. Check the console output');

// Make function available globally
window.testRLSFix = testRLSFix;
