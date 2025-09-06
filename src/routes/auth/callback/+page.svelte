<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  
  let isLoading = true;
  let error = '';
  let message = '';

  onMount(async () => {
    try {
      console.log('Auth callback started');
      
      // Get URL parameters
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('access_token');
      const refreshToken = urlParams.get('refresh_token');
      const errorParam = urlParams.get('error');
      const errorDescription = urlParams.get('error_description');

      console.log('URL params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, errorParam });

      // Handle error from OAuth provider
      if (errorParam) {
        error = errorDescription || 'Authentication failed. Please try again.';
        isLoading = false;
        return;
      }

      // If we have tokens, set the session
      if (accessToken && refreshToken) {
        console.log('Setting session with tokens');
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          error = sessionError.message;
          isLoading = false;
          return;
        }

        if (data.session) {
          console.log('Session created successfully');
          message = 'Authentication successful! Redirecting...';
          setTimeout(() => {
            goto('/dashboard');
          }, 2000);
        } else {
          console.error('No session after setting tokens');
          error = 'Authentication failed. Please try again.';
          isLoading = false;
        }
      } else {
        console.log('No tokens in URL, checking existing session');
        // Check if we already have a valid session
        const { data, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Get session error:', sessionError);
          error = sessionError.message;
          isLoading = false;
          return;
        }

        if (data.session) {
          console.log('Existing session found');
          message = 'Authentication successful! Redirecting...';
          setTimeout(() => {
            goto('/dashboard');
          }, 2000);
        } else {
          console.error('No session found');
          error = 'Authentication failed. Please try again.';
          isLoading = false;
        }
      }
    } catch (err) {
      console.error('Auth callback error:', err);
      error = 'An unexpected error occurred.';
      isLoading = false;
    }
  });
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">LocalSocialMax</h1>
      <p class="text-gray-600 dark:text-gray-300">Processing authentication...</p>
    </div>

    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors duration-300">
      {#if isLoading}
        <div class="text-center">
          <svg
            class="animate-spin mx-auto h-12 w-12 text-blue-600"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              class="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              stroke-width="4"
            ></circle>
            <path
              class="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p class="mt-4 text-gray-600 dark:text-gray-300">Completing authentication...</p>
        </div>
      {:else if message}
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
          </svg>
          <p class="mt-4 text-green-600 dark:text-green-400">{message}</p>
        </div>
      {:else if error}
        <div class="text-center">
          <svg class="mx-auto h-12 w-12 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
          <p class="mt-4 text-red-600 dark:text-red-400">{error}</p>
          <a href="/" class="mt-4 inline-block text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
            Back to Login
          </a>
        </div>
      {/if}
    </div>
  </div>
</div> 