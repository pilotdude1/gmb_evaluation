// Debug User Tenant Mismatch
// Run this in console to see the actual values being used

console.log('🔍 Debugging User/Tenant Data Mismatch...\n');

// Check what the form is actually using
function debugUserTenant() {
  // Try to access the user profile from the page's data
  const userProfileElement = document.querySelector('[data-user-profile]');
  if (userProfileElement) {
    console.log('User profile from DOM:', userProfileElement.dataset.userProfile);
  }
  
  // Check localStorage for user data
  const authData = localStorage.getItem('sb-gcgejeliljokhkuvpsxf-auth-token');
  if (authData) {
    const parsed = JSON.parse(authData);
    console.log('Auth user ID:', parsed.user?.id);
    console.log('Auth user email:', parsed.user?.email);
  }
  
  // Try to access Svelte stores (if available)
  if (window.__SVELTE__) {
    console.log('Svelte detected - checking stores...');
  }
  
  console.log('\n📋 What we need to check:');
  console.log('1. userProfile.current_tenant_id from the form');
  console.log('2. get_user_tenant_id() function result');
  console.log('3. Make sure they match!');
  
  console.log('\n💡 The RLS policy expects:');
  console.log('- tenant_id = get_user_tenant_id()');
  console.log('- created_by = auth.uid()');
  console.log('\n🎯 But the form might be sending different values!');
}

debugUserTenant();
