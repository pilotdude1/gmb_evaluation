// Ultra-simple test - just paste and run
console.log('🔍 Testing Supabase setup...');

// Get auth data from localStorage
const authKey = Object.keys(localStorage).find((key) =>
  key.includes('auth-token')
);
if (!authKey) {
  console.log('❌ No auth token found - are you logged in?');
} else {
  const authData = JSON.parse(localStorage.getItem(authKey) || '{}');
  console.log('✅ User ID:', authData.user?.id);
  console.log('✅ User email:', authData.user?.email);

  if (authData.access_token && authData.user?.id) {
    // Test the setup function directly
    const testSetup = async () => {
      try {
        const response = await fetch(
          'https://gcgejeliljokhkuvpsxf.supabase.co/rest/v1/rpc/setup_user_tenant_secure',
          {
            method: 'POST',
            headers: {
              apikey:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ2VqZWxpbGpva2hrdXZwc3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc0MDgsImV4cCI6MjA2ODYxMzQwOH0.Q7s3HU2EoPt9CH2CEasEqk5jXWQtWdTGnS5jQEPVLEc',
              Authorization: `Bearer ${authData.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              user_id: authData.user.id,
              user_email: authData.user.email || '',
              tenant_name: null,
            }),
          }
        );

        const result = await response.json();

        if (response.ok) {
          console.log('✅ Setup function response:', result);
          if (result.success) {
            console.log('🎉 Setup successful! Try account creation now.');
          } else {
            console.log('❌ Setup failed:', result.error);
          }
        } else {
          console.log('❌ HTTP error:', response.status, result);
          if (
            result.message &&
            result.message.includes('function') &&
            result.message.includes('does not exist')
          ) {
            console.log(
              '💡 The setup function does not exist. You need to run the SQL first.'
            );
          }
        }
      } catch (error) {
        console.log('❌ Network error:', error.message);
      }
    };

    testSetup();
  }
}
