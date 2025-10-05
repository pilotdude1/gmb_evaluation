<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  
  let testResults = '';
  let isLoading = false;
  
  async function testSignupFlow() {
    isLoading = true;
    testResults = '';
    
    const testEmail = `testuser${Date.now()}@gmail.com`;
    const testPassword = 'TestPassword123!';
    
    try {
      testResults += `Testing signup flow with email: ${testEmail}\n\n`;
      
      // Test signup
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      testResults += `Signup Response:\n`;
      testResults += `- Error: ${error ? error.message : 'None'}\n`;
      testResults += `- User exists: ${data.user ? 'Yes' : 'No'}\n`;
      testResults += `- Session exists: ${data.session ? 'Yes' : 'No'}\n`;
      testResults += `- Email confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}\n`;
      testResults += `- User ID: ${data.user?.id || 'None'}\n`;
      testResults += `- User email: ${data.user?.email || 'None'}\n`;
      testResults += `- Created at: ${data.user?.created_at || 'None'}\n\n`;
      
      if (error) {
        testResults += `❌ Signup failed with error: ${error.message}\n`;
        testResults += `Error code: ${error.status || 'Unknown'}\n\n`;
      }
      
      if (data.user) {
        testResults += `Analysis:\n`;
        if (data.session) {
          testResults += `✅ User created and automatically signed in (email confirmation disabled)\n`;
        } else if (data.user.email_confirmed_at) {
          testResults += `⚠️ User already exists and is confirmed\n`;
        } else {
          testResults += `📧 User created but needs email confirmation\n`;
        }
      }
      
      // Clean up - sign out if we got a session
      if (data.session) {
        await supabase.auth.signOut();
        testResults += `\n🧹 Cleaned up test session\n`;
      }
      
    } catch (err) {
      testResults += `❌ Test failed: ${err.message}\n`;
    }
    
    isLoading = false;
  }
  
  async function testExistingUser() {
    isLoading = true;
    testResults = '';
    
    const existingEmail = 'test@gmail.com'; // Use a known existing email
    const testPassword = 'TestPassword123!';
    
    try {
      testResults += `Testing signup with existing email: ${existingEmail}\n\n`;
      
      const { data, error } = await supabase.auth.signUp({
        email: existingEmail,
        password: testPassword,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      testResults += `Signup Response:\n`;
      testResults += `- Error: ${error ? error.message : 'None'}\n`;
      testResults += `- User exists: ${data.user ? 'Yes' : 'No'}\n`;
      testResults += `- Session exists: ${data.session ? 'Yes' : 'No'}\n`;
      testResults += `- Email confirmed: ${data.user?.email_confirmed_at ? 'Yes' : 'No'}\n`;
      testResults += `- User ID: ${data.user?.id || 'None'}\n`;
      testResults += `- User email: ${data.user?.email || 'None'}\n\n`;
      
      if (data.user) {
        testResults += `Analysis:\n`;
        if (data.session) {
          testResults += `✅ User signed in automatically\n`;
        } else if (data.user.email_confirmed_at) {
          testResults += `⚠️ User already exists and is confirmed - should sign in instead\n`;
        } else {
          testResults += `📧 User exists but needs email confirmation\n`;
        }
      }
      
    } catch (err) {
      testResults += `❌ Test failed: ${err.message}\n`;
    }
    
    isLoading = false;
  }
  
  async function checkAuthSettings() {
    isLoading = true;
    testResults = '';
    
    try {
      testResults += `Checking current authentication settings:\n\n`;
      
      // Get current session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      testResults += `Current session: ${sessionData.session ? 'Active' : 'None'}\n`;
      
      // Get current user
      const { data: userData, error: userError } = await supabase.auth.getUser();
      testResults += `Current user: ${userData.user ? userData.user.email : 'None'}\n`;
      
      testResults += `\nSupabase configuration analysis:\n`;
      testResults += `- Email confirmations should be DISABLED based on config.toml\n`;
      testResults += `- Users should be automatically signed in after signup\n`;
      testResults += `- If getting "User already exists" message, check:\n`;
      testResults += `  1. Is email confirmation actually enabled in Supabase dashboard?\n`;
      testResults += `  2. Is the user actually already confirmed?\n`;
      testResults += `  3. Are there RLS policy issues?\n`;
      
    } catch (err) {
      testResults += `❌ Check failed: ${err.message}\n`;
    }
    
    isLoading = false;
  }
</script>

<div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
      Authentication Flow Test
    </h1>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
      <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Test Authentication Flow
      </h2>
      
      <div class="space-y-4">
        <button
          on:click={testSignupFlow}
          disabled={isLoading}
          class="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isLoading ? 'Testing...' : 'Test New User Signup'}
        </button>
        
        <button
          on:click={testExistingUser}
          disabled={isLoading}
          class="w-full bg-yellow-600 hover:bg-yellow-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isLoading ? 'Testing...' : 'Test Existing User Signup'}
        </button>
        
        <button
          on:click={checkAuthSettings}
          disabled={isLoading}
          class="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {isLoading ? 'Checking...' : 'Check Auth Settings'}
        </button>
      </div>
    </div>
    
    {#if testResults}
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Test Results
        </h3>
        <pre class="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 p-4 rounded-md overflow-auto">{testResults}</pre>
      </div>
    {/if}
    
    <div class="mt-6 bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
      <h3 class="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
        Expected Behavior
      </h3>
      <ul class="text-blue-800 dark:text-blue-200 space-y-1">
        <li>• New user signup should create user AND session (auto sign-in)</li>
        <li>• Existing user signup should show "User already exists" message</li>
        <li>• No email confirmation should be required</li>
        <li>• User should be redirected to dashboard after successful signup</li>
      </ul>
    </div>
  </div>
</div>
