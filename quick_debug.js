// Quick debug - paste this directly into browser console

// Check if user is authenticated and has profile
(async () => {
  console.log('🔍 Quick Debug Check...');
  
  try {
    const supabaseModule = await import('/src/lib/supabaseClient.ts');
    const { supabase, authUtils } = supabaseModule;
    
    const user = await authUtils.getCurrentUser();
    console.log('👤 Current user:', user?.email, user?.id);
    
    if (!user) {
      console.log('❌ Not logged in');
      return;
    }
    
    // Check profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
      
    console.log('📝 User profile:', profile);
    
    if (!profile) {
      console.log('❌ No profile - calling setup function...');
      
      const { data: setupResult, error: setupError } = await supabase.rpc(
        'setup_user_tenant_secure',
        {
          user_id: user.id,
          user_email: user.email || '',
          tenant_name: null
        }
      );
      
      console.log('🔧 Setup result:', setupResult);
      console.log('🔧 Setup error:', setupError);
      
      if (setupResult?.success) {
        console.log('✅ Setup succeeded! Try account creation again.');
      } else {
        console.log('❌ Setup failed:', setupResult?.error || setupError?.message);
      }
    } else if (!profile.current_tenant_id) {
      console.log('❌ Profile exists but no tenant - running setup...');
      
      const { data: setupResult } = await supabase.rpc(
        'setup_user_tenant_secure',
        {
          user_id: user.id,
          user_email: user.email || '',
          tenant_name: null
        }
      );
      
      console.log('🔧 Setup result:', setupResult);
    } else {
      console.log('✅ Profile and tenant exist:', profile.current_tenant_id);
      console.log('🎯 Account creation should work now!');
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message);
  }
})();
