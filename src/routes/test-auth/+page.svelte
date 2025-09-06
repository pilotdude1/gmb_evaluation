<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import type { User } from '@supabase/supabase-js';
  
  let user: User | null = null;
  let sessionInfo = '';
  let envInfo = '';

  onMount(async () => {
    // Check environment variables
    envInfo = `VITE_SUPABASE_URL: ${import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing'}
VITE_SUPABASE_ANON_KEY: ${import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing'}`;

    // Check session
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (session) {
      user = session.user;
      sessionInfo = `Authenticated: ${session.user.email}
User ID: ${session.user.id}
Session expires: ${new Date(session.expires_at! * 1000).toLocaleString()}`;
    } else {
      sessionInfo = `Not authenticated. Error: ${error?.message || 'No error'}`;
    }
  });

  async function signOut() {
    await supabase.auth.signOut();
    window.location.reload();
  }
</script>

<div class="min-h-screen bg-gray-100 dark:bg-gray-900 p-8">
  <div class="max-w-2xl mx-auto">
    <h1 class="text-3xl font-bold mb-6">Authentication Test</h1>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Environment Variables</h2>
      <pre class="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm">{envInfo}</pre>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 mb-6">
      <h2 class="text-xl font-semibold mb-4">Session Status</h2>
      <pre class="bg-gray-100 dark:bg-gray-700 p-4 rounded text-sm">{sessionInfo}</pre>
    </div>
    
    {#if user}
      <div class="bg-green-100 dark:bg-green-900 rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 text-green-800 dark:text-green-200">✅ Authenticated</h2>
        <p class="text-green-700 dark:text-green-300">You are logged in and should be able to access /profile and /dashboard</p>
        <button on:click={signOut} class="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700">
          Sign Out
        </button>
      </div>
    {:else}
      <div class="bg-red-100 dark:bg-red-900 rounded-lg p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4 text-red-800 dark:text-red-200">❌ Not Authenticated</h2>
        <p class="text-red-700 dark:text-red-300">You need to sign in first</p>
        <a href="/" class="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          Go to Login
        </a>
      </div>
    {/if}
  </div>
</div> 