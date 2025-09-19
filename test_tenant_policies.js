// Test Tenant-Based RLS Policies
// Run this AFTER applying safe_tenant_policies.sql

console.log('🧪 Testing Tenant-Based RLS Policies...\n');

async function testTenantPolicies() {
  try {
    // Test 1: Check authentication and tenant setup
    const authData = localStorage.getItem('sb-gcgejeliljokhkuvpsxf-auth-token');
    if (!authData) {
      console.log('❌ Not authenticated - please sign in');
      return;
    }

    const authToken = JSON.parse(authData);
    console.log('✅ Authenticated as:', authToken.user?.email);
    console.log('User ID:', authToken.user?.id);

    // Test 2: Check what the form logic would do
    console.log('\n🔍 Checking form logic...');

    // Simulate what the form does - check tenant setup
    console.log('Form would call tenant setup functions...');
    console.log(
      'Expected tenant from logs: 4a58e4c6-3d06-499b-a9ca-96d7dc6b33dc'
    );

    // Test 3: Create test account data (same as what worked before)
    const testAccount = {
      name: `Tenant Policy Test ${Date.now()}`,
      tenant_id: '4a58e4c6-3d06-499b-a9ca-96d7dc6b33dc', // From successful test
      created_by: authToken.user.id,
      industry: 'technology',
      business_type: 'prospect',
    };

    console.log('\n🎯 Testing account creation with tenant policies...');
    console.log('Test data:', testAccount);

    console.log('\n✅ If the new policies work correctly:');
    console.log('- INSERT should succeed (same tenant + auth checks)');
    console.log("- SELECT should return only accounts in user's tenant");
    console.log("- UPDATE/DELETE should work only for user's own records");

    console.log('\n⚠️ If policies are too restrictive:');
    console.log("- We'll see RLS policy violation errors");
    console.log('- Need to adjust the tenant membership checks');

    console.log(
      '\n🚀 Ready to test! Fill out the form and see if it still works...'
    );
  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

testTenantPolicies();
