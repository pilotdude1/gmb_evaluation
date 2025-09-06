<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  
  let testResults = '';
  let isLoading = false;

  onMount(async () => {
    await runTests();
  });

  async function runTests() {
    isLoading = true;
    testResults = 'Running Supabase tests...\n\n';
    
    try {
      // Test 1: Check environment variables
      testResults += '1. Environment Variables:\n';
      testResults += `   VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? '✅ Set' : '❌ Missing'}\n`;
      testResults += `   VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}\n\n`;
      
      // Test 2: Check Supabase client
      testResults += '2. Supabase Client:\n';
      if (supabase) {
        testResults += '   ✅ Supabase client created successfully\n';
      } else {
        testResults += '   ❌ Supabase client creation failed\n';
      }
      
      // Test 3: Check current session
      testResults += '\n3. Current Session:\n';
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        testResults += `   ❌ Session error: ${sessionError.message}\n`;
      } else if (session) {
        testResults += `   ✅ Session found: ${session.user.email}\n`;
      } else {
        testResults += '   ℹ️ No active session (this is normal for new users)\n';
      }
      
      // Test 4: Check auth settings
      testResults += '\n4. Auth Settings:\n';
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          testResults += `   ❌ Auth error: ${error.message}\n`;
        } else {
          testResults += '   ✅ Auth service responding\n';
        }
      } catch (err) {
        testResults += `   ❌ Auth test failed: ${err}\n`;
      }
      
      // Test 5: Check if email confirmation is required
      testResults += '\n5. Email Confirmation:\n';
      testResults += '   ℹ️ This would need to be checked in Supabase Dashboard\n';
      testResults += '   ℹ️ Go to Authentication > Settings > Email Templates\n';
      
    } catch (err) {
      testResults += `\n❌ Test failed: ${err}\n`;
    }
    
    isLoading = false;
  }

  async function testSignup() {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    testResults += `\n6. Testing Signup:\n`;
    testResults += `   Email: ${testEmail}\n`;
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });
      
      if (error) {
        testResults += `   ❌ Signup error: ${error.message}\n`;
        if (error.message.includes('500')) {
          testResults += `   💡 This suggests a server-side configuration issue\n`;
          testResults += `   💡 Check Supabase Dashboard > Authentication > Settings\n`;
        }
      } else {
        testResults += `   ✅ Signup successful (check email for confirmation)\n`;
      }
    } catch (err) {
      testResults += `   ❌ Signup test failed: ${err}\n`;
    }
  }
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
  <div class="max-w-4xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Supabase Configuration Test</h1>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Test Results</h2>
      <pre class="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm whitespace-pre-wrap">{testResults}</pre>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Actions</h2>
      <div class="space-y-4">
        <button 
          on:click={runTests}
          disabled={isLoading}
          class="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Running Tests...' : 'Run Tests'}
        </button>
        
        <button 
          on:click={testSignup}
          class="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 ml-4"
        >
          Test Signup
        </button>
      </div>
    </div>
    
    <div class="bg-yellow-100 dark:bg-yellow-900 rounded-lg p-6">
      <h2 class="text-xl font-semibold mb-4 text-yellow-800 dark:text-yellow-200">Troubleshooting 500 Error</h2>
      <ul class="text-yellow-700 dark:text-yellow-300 space-y-2">
        <li>• Check Supabase Dashboard > Authentication > Settings</li>
        <li>• Verify Email Templates are configured</li>
        <li>• Ensure Email Confirmation is properly set up</li>
        <li>• Check if your Supabase project is active</li>
        <li>• Verify API keys are correct</li>
      </ul>
    </div>
  </div>
</div> 