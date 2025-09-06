<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  
  let email = '';
  let isLoading = false;
  let message = '';
  let error = '';

  async function handleSubmit() {
    isLoading = true;
    message = '';
    error = '';
    
    console.log('Starting password reset for email:', email);
    
    try {
      const { data, error: err } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`
      });
      
      console.log('Password reset response:', { data, error: err });
      
      if (err) {
        console.error('Password reset error:', err);
        error = err.message;
      } else {
        console.log('Password reset email sent');
        message = 'Password reset email sent! Please check your email for a reset link.';
      }
    } catch (err) {
      console.error('Unexpected password reset error:', err);
      error = 'An unexpected error occurred. Please try again.';
    }
    
    isLoading = false;
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Reset Password</h1>
      <p class="text-gray-600 dark:text-gray-300">Enter your email to receive a password reset link.</p>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors duration-300">
      <form on:submit|preventDefault={handleSubmit} class="space-y-6" autocomplete="off">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
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
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {#if isLoading}
            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Sending reset link...
          {:else}
            Send Reset Link
          {/if}
        </button>
      </form>
      
      {#if message}
        <p class="mt-4 text-green-600 dark:text-green-400">{message}</p>
      {/if}
      {#if error}
        <p class="mt-4 text-red-600 dark:text-red-400">{error}</p>
      {/if}
      
      <div class="mt-6 text-center">
        <a href="/" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm">
          Back to Login
        </a>
      </div>
    </div>
  </div>
</div> 