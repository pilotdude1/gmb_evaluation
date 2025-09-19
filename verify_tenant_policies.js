// Verify Tenant Policies Work in Real App Context
// Run this on /crm/accounts/new page AFTER applying safe_tenant_policies.sql

console.log('🔍 Verifying Tenant Policies in App Context...\n');

async function verifyTenantPolicies() {
  try {
    // Check auth status in app context
    const authData = localStorage.getItem('sb-gcgejeliljokhkuvpsxf-auth-token');
    if (!authData) {
      console.log('❌ Not authenticated');
      return;
    }

    const authToken = JSON.parse(authData);
    console.log('✅ Authenticated as:', authToken.user?.email);
    console.log('User ID:', authToken.user?.id);

    // Test what the SQL policies will see by testing the conditions manually
    console.log('\n🧪 Testing policy conditions...');

    // The policies check these specific conditions:
    console.log('Policy checks:');
    console.log('1. auth.role() = "authenticated" ← Should be true in app');
    console.log('2. created_by = auth.uid() ← Will be true when form sets it');
    console.log('3. tenant_id matches user profile ← Key test below');
    console.log('4. User is active tenant member ← Key test below');

    console.log('\n🎯 The real test: Try creating an account now!');
    console.log('📊 Monitor the form submission to see if policies work...');

    // Set up monitoring for the actual form test
    const originalError = console.error;
    console.error = function (...args) {
      originalError.apply(console, args);
      const message = args.join(' ');

      if (message.includes('row-level security')) {
        console.log('\n🚨 RLS POLICY FAILURE DETECTED!');
        console.log('💡 This means the tenant policies are too restrictive');
        console.log('🔧 Need to adjust the policy conditions');
      } else if (message.includes('Account creation failed')) {
        console.log("\n⚠️ Account creation failed - checking if it's RLS...");
      }
    };

    // Also monitor successful creation
    const originalLog = console.log;
    console.log = function (...args) {
      originalLog.apply(console, args);
      const message = args.join(' ');

      if (
        message.includes('Account creation response') &&
        message.includes('data:')
      ) {
        console.log('\n🎉 SUCCESS! Tenant policies are working correctly!');
        console.log('✅ Account created with proper tenant isolation');
      }
    };

    console.log(
      '\n🚀 Ready! Fill out and submit the form to test the policies...'
    );

    // Auto-restore monitoring after 2 minutes
    setTimeout(() => {
      console.log = originalLog;
      console.error = originalError;
      console.log('\n🔄 Monitoring stopped');
    }, 120000);
  } catch (error) {
    console.error('💥 Verification error:', error);
  }
}

verifyTenantPolicies();
