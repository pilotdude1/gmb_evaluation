// Bypass Service Worker Test - Direct Supabase Call
// Paste this in console on ANY page where you're logged in

console.log('🧪 Direct Supabase Test (Bypassing Service Worker)...\n');

async function directSupabaseTest() {
  try {
    // First, let's try to access Supabase from the page's modules
    // Since this is SvelteKit, we need to be creative

    // Try to get user session data from localStorage
    const authData = localStorage.getItem('sb-gcgejeliljokhkuvpsxf-auth-token');
    if (!authData) {
      console.log('❌ No auth token found in localStorage');
      console.log('💡 Please make sure you are signed in');
      return;
    }

    const authToken = JSON.parse(authData);
    console.log('✅ Found auth token for user:', authToken.user?.email);

    // Make direct API call to Supabase REST API
    const supabaseUrl = 'https://gcgejeliljokhkuvpsxf.supabase.co'; // From your console logs
    const accessToken = authToken.access_token;

    if (!accessToken) {
      console.log('❌ No access token in auth data');
      return;
    }

    console.log('📡 Making direct API call to Supabase...');

    // Test 1: Get user tenant ID via RPC
    console.log('🔍 Testing get_user_tenant_id function...');

    const rpcResponse = await fetch(
      `${supabaseUrl}/rest/v1/rpc/get_user_tenant_id`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          apikey:
            'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ2VqZWxpbGpva2hrdXZwc3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3NzA4NDcsImV4cCI6MjA0MjM0Njg0N30.r4gYaXuW-S_Pj4b-Mqw0PZRkdZf5_OuHjUULSNVFxf8',
        },
      }
    );

    const tenantId = await rpcResponse.text();
    console.log('get_user_tenant_id() result:', tenantId);

    if (!tenantId || tenantId === 'null' || tenantId.includes('error')) {
      console.log('❌ No tenant ID returned');
      console.log('💡 User needs tenant setup');

      // Try tenant setup
      console.log('🔧 Attempting tenant setup...');
      const setupResponse = await fetch(
        `${supabaseUrl}/rest/v1/rpc/setup_user_tenant_secure`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            apikey:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ2VqZWxpbGpva2hrdXZwc3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3NzA4NDcsImV4cCI6MjA0MjM0Njg0N30.r4gYaXuW-S_Pj4b-Mqw0PZRkdZf5_OuHjUULSNVFxf8',
          },
          body: JSON.stringify({
            user_id: authToken.user.id,
            user_email: authToken.user.email,
            tenant_name: null,
          }),
        }
      );

      const setupResult = await setupResponse.json();
      console.log('Setup result:', setupResult);

      if (setupResult.success) {
        console.log('✅ Tenant setup completed');
        // Get new tenant ID
        const newRpcResponse = await fetch(
          `${supabaseUrl}/rest/v1/rpc/get_user_tenant_id`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
              apikey:
                'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ2VqZWxpbGpva2hrdXZwc3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3NzA4NDcsImV4cCI6MjA0MjM0Njg0N30.r4gYaXuW-S_Pj4b-Mqw0PZRkdZf5_OuHjUULSNVFxf8',
            },
          }
        );
        const newTenantId = await newRpcResponse.text();
        console.log('New tenant ID:', newTenantId);
      }
    }

    // Test 2: Try creating an account directly
    console.log('\n🏢 Testing account creation via direct API...');

    const finalTenantId = tenantId.replace(/"/g, ''); // Remove quotes if present

    const testAccount = {
      name: `Direct API Test ${Date.now()}`,
      tenant_id: finalTenantId,
      created_by: authToken.user.id,
      industry: 'technology',
      business_type: 'prospect',
    };

    console.log('Creating account with data:', testAccount);

    const createResponse = await fetch(`${supabaseUrl}/rest/v1/crm_accounts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        apikey:
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ2VqZWxpbGpva2hrdXZwc3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3NzA4NDcsImV4cCI6MjA0MjM0Njg0N30.r4gYaXuW-S_Pj4b-Mqw0PZRkdZf5_OuHjUULSNVFxf8',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(testAccount),
    });

    console.log('Create response status:', createResponse.status);

    if (createResponse.ok) {
      const account = await createResponse.json();
      console.log('✅ SUCCESS! Account created:', account[0]);
      console.log('🎉 RLS FIX WORKED!');

      // Clean up
      console.log('🧹 Cleaning up test account...');
      const deleteResponse = await fetch(
        `${supabaseUrl}/rest/v1/crm_accounts?id=eq.${account[0].id}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            apikey:
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdjZ2VqZWxpbGpva2hrdXZwc3hmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjY3NzA4NDcsImV4cCI6MjA0MjM0Njg0N30.r4gYaXuW-S_Pj4b-Mqw0PZRkdZf5_OuHjUULSNVFxf8',
          },
        }
      );

      if (deleteResponse.ok) {
        console.log('✅ Test account cleaned up');
      }
    } else {
      const error = await createResponse.text();
      console.log('❌ FAILED! Create response error:', error);

      if (error.includes('row-level security')) {
        console.log(
          '💡 RLS policy still blocking - fix may not have been applied'
        );
      } else {
        console.log('💡 Different error - not RLS related');
      }
    }
  } catch (error) {
    console.log('💥 Unexpected error:', error);
  }
}

// Run the test
directSupabaseTest();
