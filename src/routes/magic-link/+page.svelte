<script>
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  
  let email = "";
  let isLoading = false;
  let error = '';
  let message = '';
  let isLinkSent = false;

  onMount(() => {
    email = '';
  });

  async function handleMagicLinkRequest() {
    if (!email) {
      error = 'Please enter your email address';
      return;
    }
    
    console.log('Magic Link requested for email:', email);
    isLoading = true;
    error = '';
    message = '';
    
    try {
      const { data, error: err } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      console.log('Magic Link response:', { data, error: err });
      
      if (err) {
        console.error('Magic Link error:', err);
        error = err.message;
      } else {
        console.log('Magic Link sent successfully');
        message = 'Magic link sent! Check your email and click the link to sign in.';
        isLinkSent = true;
      }
    } catch (err) {
      console.error('Magic Link exception:', err);
      error = 'An unexpected error occurred while sending the magic link.';
    }
    
    isLoading = false;
  }

  function goBackToLogin() {
    goto('/');
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
  <div class="max-w-md w-full space-y-8">
    <!-- Header -->
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Magic Link</h1>
      <p class="text-gray-600 dark:text-gray-300">
        {#if isLinkSent}
          We've sent you a magic link!
        {:else}
          Enter your email to receive a magic link for passwordless sign-in.
        {/if}
      </p>
    </div>

    <!-- Magic Link Form -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors duration-300">
      {#if !isLinkSent}
        <form on:submit|preventDefault={handleMagicLinkRequest} class="space-y-6" autocomplete="off">
          <!-- Email Field -->
          <div>
            <label
              for="email"
              class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              bind:value={email}
              required
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
              placeholder="Enter your email"
              autocomplete="off"
              name="email"
            />
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            disabled={isLoading}
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {#if isLoading}
              <svg
                class="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
              Sending magic link...
            {:else}
              <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path d="M12 19V6M5 12l7-7 7 7"/>
              </svg>
              Send Magic Link
            {/if}
          </button>
        </form>
      {:else}
        <!-- Success State -->
        <div class="text-center">
          <div class="mx-auto h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">Check your email!</h2>
          <p class="text-gray-600 dark:text-gray-300 mb-4">
            We've sent a magic link to <strong>{email}</strong>
          </p>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Click the link in your email to sign in. The link will expire in 1 hour.
          </p>
          
          <!-- Resend Button -->
          <button
            on:click={() => { isLinkSent = false; message = ''; }}
            class="w-full bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors mb-4"
          >
            Send another link
          </button>
        </div>
      {/if}

      {#if message}
        <p class="mt-4 text-green-600 dark:text-green-400">{message}</p>
      {/if}
      {#if error}
        <p class="mt-4 text-red-600 dark:text-red-400">{error}</p>
      {/if}

      <!-- Back to Login -->
      <div class="mt-6 text-center">
        <button
          on:click={goBackToLogin}
          class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm"
        >
          ← Back to Login
        </button>
      </div>
    </div>
  </div>
</div> 