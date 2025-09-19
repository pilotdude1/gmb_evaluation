// Simple console debug script that works without import.meta
// Paste this directly into browser console

async function simpleDebug() {
  console.log('🔍 Starting simple debug...');
  
  try {
    // Access Supabase from window if available, or try direct access
    let supabase, authUtils;
    
    if (window.supabase) {
      supabase = window.supabase;
      authUtils = window.authUtils;
    } else {
      // Try to access from global scope
      const app = document.querySelector('#svelte');
      if (app && app.__svelte_meta) {
        console.log('Found Svelte app context');
      }
      
      // Alternative: direct API call
      console.log('Trying direct API approach...');
      
      // Get the session from localStorage
      const authKey = Object.keys(localStorage).find(key => key.includes('auth-token'));
      if (authKey) {
        const authData = JSON.parse(localStorage.getItem(authKey) || '{}');
        console.log('Auth data found:', !!authData.access_token);
        
        if (authData.access_token) {
          // Make direct API calls to test
          const baseUrl = 'https://gcgejeliljokhkuvpsxf.supabase.co';
          const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ2VqZWxpbGpva2hrdXZwc3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwMzc0MDgsImV4cCI6MjA2ODYxMzQwOH0.Q7s3HU2EoPt9CH2CEasEqk5jXWQtWdTGnS5jQEPVLEc';
          
          // Test user profile query
          const profileResponse = await fetch(`${baseUrl}/rest/v1/user_profiles?id=eq.${authData.user.id}`, {
            headers: {
              'apikey': anonKey,
              'Authorization': `Bearer ${authData.access_token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const profileData = await profileResponse.json();
          console.log('Profile query result:', profileData);
          
          if (profileData.length === 0) {
            console.log('❌ No profile found - need to create one');
            
            // Test the secure setup function
            const setupResponse = await fetch(`${baseUrl}/rest/v1/rpc/setup_user_tenant_secure`, {
              method: 'POST',
              headers: {
                'apikey': anonKey,
                'Authorization': `Bearer ${authData.access_token}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                user_id: authData.user.id,
                user_email: authData.user.email || '',
                tenant_name: null
              })
            });
            
            const setupResult = await setupResponse.json();
            console.log('Setup function result:', setupResult);
            
            if (setupResponse.ok && setupResult.success) {
              console.log('✅ Setup completed successfully!');
              console.log('🎯 Try account creation again');
            } else {
              console.log('❌ Setup failed:', setupResult);
            }
            
          } else {
            const profile = profileData[0];
            console.log('✅ Profile exists:', profile);
            
            if (profile.current_tenant_id) {
              console.log('✅ User has tenant:', profile.current_tenant_id);
              console.log('🎯 Account creation should work!');
            } else {
              console.log('❌ Profile exists but no tenant - running setup...');
              
              // Run setup function
              const setupResponse = await fetch(`${baseUrl}/rest/v1/rpc/setup_user_tenant_secure`, {
                method: 'POST',
                headers: {
                  'apikey': anonKey,
                  'Authorization': `Bearer ${authData.access_token}`,
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  user_id: authData.user.id,
                  user_email: authData.user.email || '',
                  tenant_name: null
                })
              });
              
              const setupResult = await setupResponse.json();
              console.log('Setup result:', setupResult);
            }
          }
        }
      } else {
        console.log('❌ No auth data found in localStorage');
      }
    }
    
  } catch (error) {
    console.log('❌ Debug error:', error.message);
    console.log('Error details:', error);
  }
}

// Auto-run the debug
simpleDebug();
