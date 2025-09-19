// Simple account creation test - paste into browser console
// No import.meta or module syntax

console.log('🧪 Testing account creation...');

// Get auth data from localStorage
const authKey = Object.keys(localStorage).find(key => key.includes('auth-token'));
if (!authKey) {
  console.log('❌ No auth token found');
} else {
  const authData = JSON.parse(localStorage.getItem(authKey) || '{}');
  console.log('👤 User:', authData.user?.email, authData.user?.id);
  
  if (!authData.access_token || !authData.user?.id) {
    console.log('❌ Missing auth data');
  } else {
    // Test account creation
    const accountData = {
      name: 'Test Account via Console',
      industry: 'technology',
      business_type: 'prospect',
      created_by: authData.user.id,
      tenant_id: '4a58e4c6-3d06-499b-a9ca-96d7dc6b33dc'
    };
    
    console.log('📝 Account data:', accountData);
    
    fetch('https://gcgejeliljokhkuvpsxf.supabase.co/rest/v1/crm_accounts', {
      method: 'POST',
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ2VqZWxpbGpva2hrdXZwc3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc0MDgsImV4cCI6MjA2ODYxMzQwOH0.Q7s3HU2EoPt9CH2CEasEqk5jXWQtWdTGnS5jQEPVLEc',
        'Authorization': 'Bearer ' + authData.access_token,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(accountData)
    })
    .then(response => response.json())
    .then(result => {
      console.log('📊 Response result:', result);
      if (result[0] && result[0].id) {
        console.log('✅ Account created successfully!', result[0]);
      } else {
        console.log('❌ Account creation failed:', result);
        if (result.message) console.log('Error message:', result.message);
        if (result.details) console.log('Error details:', result.details);
        if (result.hint) console.log('Error hint:', result.hint);
      }
    })
    .catch(error => {
      console.log('❌ Network error:', error.message);
    });
  }
}
