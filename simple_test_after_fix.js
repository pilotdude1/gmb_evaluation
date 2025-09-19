// Simple Test After Permissive Policy Fix
// Run this on /crm/accounts/new and try creating an account

console.log('🧪 Testing After Permissive Policy Fix...\n');

function testAfterFix() {
  console.log('✅ Permissive policies applied');
  console.log('📝 These policies should now allow account creation');
  console.log('');
  console.log('📋 What the new policies check:');
  console.log('1. ✅ User is authenticated (basic)');
  console.log('2. ✅ created_by = current user (security)');
  console.log('3. ✅ tenant_id is not null (validation)');
  console.log('4. 🔄 Tenant matching is optional (permissive)');
  console.log('');
  console.log('🎯 Try creating an account now!');
  console.log('');
  console.log('Expected outcomes:');
  console.log('✅ SUCCESS: Account creation works');
  console.log('❌ STILL FAILS: Need even simpler policies');
  console.log('');

  // Monitor for success/failure
  const originalLog = console.log;
  const originalError = console.error;

  console.log = function (...args) {
    originalLog.apply(console, args);
    const message = args.join(' ');

    if (
      message.includes('Account creation response') &&
      message.includes('"data":')
    ) {
      originalLog('🎉 SUCCESS! Permissive policies work!');
    }
  };

  console.error = function (...args) {
    originalError.apply(console, args);
    const message = args.join(' ');

    if (message.includes('row-level security')) {
      originalError('🚨 STILL BLOCKED! Need ultra-simple policies');
    }
  };

  // Auto-restore after 90 seconds
  setTimeout(() => {
    console.log = originalLog;
    console.error = originalError;
  }, 90000);
}

testAfterFix();
