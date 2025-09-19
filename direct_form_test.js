// Direct Form Test - Run this on the /crm/accounts/new page
// This bypasses the need to access Supabase directly

console.log('🧪 Testing Account Creation via Form...\n');

function testViaForm() {
  // Check if we're on the right page
  if (!window.location.pathname.includes('/crm/accounts/new')) {
    console.log('❌ Please navigate to /crm/accounts/new first');
    return;
  }

  console.log('✅ On account creation page');

  // Find form elements
  const nameInput = document.querySelector('input[name="name"]') || 
                    document.querySelector('[id*="name"]') ||
                    document.querySelector('input[type="text"]');
  
  const submitButton = document.querySelector('button[type="submit"]') ||
                       document.querySelector('button:contains("Create")') ||
                       document.querySelector('button:contains("Save")');

  if (!nameInput) {
    console.log('❌ Could not find name input field');
    console.log('💡 Try manually filling out the form and clicking submit');
    return;
  }

  if (!submitButton) {
    console.log('❌ Could not find submit button');
    console.log('💡 Try manually clicking the submit/create button');
    return;
  }

  console.log('✅ Found form elements');

  // Fill out the form
  console.log('📝 Filling out test form...');
  
  nameInput.value = `Test Account ${Date.now()}`;
  nameInput.dispatchEvent(new Event('input', { bubbles: true }));
  nameInput.dispatchEvent(new Event('change', { bubbles: true }));

  // Find and fill other common fields
  const industrySelect = document.querySelector('select[name="industry"]') ||
                         document.querySelector('[id*="industry"]');
  if (industrySelect) {
    industrySelect.value = 'technology';
    industrySelect.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const businessTypeSelect = document.querySelector('select[name="business_type"]') ||
                             document.querySelector('[id*="business_type"]');
  if (businessTypeSelect) {
    businessTypeSelect.value = 'prospect';
    businessTypeSelect.dispatchEvent(new Event('change', { bubbles: true }));
  }

  console.log('✅ Form filled out');

  // Set up console monitoring to catch the result
  const originalLog = console.log;
  const originalError = console.error;
  
  let testCompleted = false;
  const timeout = setTimeout(() => {
    if (!testCompleted) {
      console.log('⏰ Test timeout - check network tab for any requests');
      console.log = originalLog;
      console.error = originalError;
    }
  }, 10000);

  // Monitor console for success/failure
  console.log = function(...args) {
    originalLog.apply(console, args);
    const message = args.join(' ');
    
    if (message.includes('Account creation response:') || 
        message.includes('created successfully') ||
        message.includes('Account creation failed:')) {
      testCompleted = true;
      clearTimeout(timeout);
      
      if (message.includes('successfully') || message.includes('created')) {
        originalLog('🎉 SUCCESS: Account creation worked!');
      } else if (message.includes('failed') || message.includes('error')) {
        originalLog('❌ FAILED: Account creation failed');
        originalLog('Check the error message above for details');
      }
      
      // Restore original console after a delay
      setTimeout(() => {
        console.log = originalLog;
        console.error = originalError;
      }, 2000);
    }
  };

  console.error = function(...args) {
    originalError.apply(console, args);
    const message = args.join(' ');
    
    if (message.includes('Account creation') || 
        message.includes('RLS') ||
        message.includes('row-level security')) {
      testCompleted = true;
      clearTimeout(timeout);
      originalError('❌ RLS ERROR detected in the logs above');
      originalError('💡 The fix may not have been applied or there\'s another issue');
      
      setTimeout(() => {
        console.log = originalLog;
        console.error = originalError;
      }, 2000);
    }
  };

  // Submit the form
  console.log('🚀 Submitting form...');
  console.log('📊 Watch for success/error messages...\n');
  
  submitButton.click();
}

// Alternative: Manual test instructions
function manualTestInstructions() {
  console.log('📋 MANUAL TEST INSTRUCTIONS:');
  console.log('1. Navigate to /crm/accounts/new');
  console.log('2. Fill out the form with any test data');
  console.log('3. Click Submit/Create Account');
  console.log('4. Watch the browser console for:');
  console.log('   ✅ "Account creation response: { data: {...}, error: null }"');
  console.log('   ❌ "Account creation failed:" or RLS errors');
  console.log('5. If successful: ✅ RLS fix worked!');
  console.log('6. If failed: ❌ Check error details for next steps');
}

// Run the test
console.log('Choose your test method:');
console.log('- testViaForm() - Automated form test');
console.log('- manualTestInstructions() - Manual test steps');
console.log('');

// Try automated first
testViaForm();
