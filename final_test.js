// Final Test - Just monitor what happens when you submit the form
// Run this on /crm/accounts/new page and then manually submit the form

console.log('🎯 Final Test - Monitoring Form Submission...\n');

// Override console methods to catch CRM-related logs
const originalLog = console.log;
const originalError = console.error;

// Monitor console output for CRM-related messages
console.log = function (...args) {
  originalLog.apply(console, args);
  const message = args.join(' ');

  if (
    message.includes('Account creation') ||
    message.includes('Creating account') ||
    message.includes('CRM') ||
    message.includes('tenant')
  ) {
    originalLog('🔍 RELEVANT LOG:', ...args);
  }
};

console.error = function (...args) {
  originalError.apply(console, args);
  const message = args.join(' ');

  if (
    message.includes('Account') ||
    message.includes('RLS') ||
    message.includes('row-level security') ||
    message.includes('Database error')
  ) {
    originalError('🚨 RELEVANT ERROR:', ...args);
  }
};

// Monitor fetch requests
const originalFetch = window.fetch;
window.fetch = function (...args) {
  const url = args[0];
  if (url && url.includes('crm_accounts')) {
    console.log('📡 CRM Account API Call:', url);
  }

  return originalFetch
    .apply(this, arguments)
    .then((response) => {
      if (url && url.includes('crm_accounts')) {
        console.log('📡 CRM Response Status:', response.status);
        if (!response.ok) {
          console.log('❌ CRM Request Failed');
        } else {
          console.log('✅ CRM Request Succeeded');
        }
      }
      return response;
    })
    .catch((error) => {
      if (url && url.includes('crm_accounts')) {
        console.log('💥 CRM Request Error:', error);
      }
      throw error;
    });
};

console.log('✅ Monitoring active - now fill out the form and click submit');
console.log('📋 I will capture all relevant logs, errors, and network calls');
console.log('');

// Auto-restore after 2 minutes
setTimeout(() => {
  console.log = originalLog;
  console.error = originalError;
  window.fetch = originalFetch;
  console.log('🔄 Monitoring stopped - original functions restored');
}, 120000);
