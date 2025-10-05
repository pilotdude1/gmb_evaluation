<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  let email = '';
  let password = '';
  let isLoading = false;
  let message = '';
  let error = '';

  async function handleSubmit() {
    isLoading = true;
    message = '';
    error = '';
    
    console.log('Starting signup for email:', email);
    
    try {
      const { data, error: err } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      console.log('Signup response:', { data, error: err });
      
      if (err) {
        console.error('Signup error:', err);
        
        // Handle specific database errors
        if (err.message?.includes('Database error saving new user') || 
            err.message?.includes('Failed to create profile') ||
            err.message?.includes('violates row-level security policy')) {
          error = 'Database configuration issue detected. Please contact support or try again later.';
          console.error('Database/RLS policy error during signup:', err);
        } else if (err.message?.includes('User already registered')) {
          error = 'An account with this email already exists. Please sign in instead.';
        } else if (err.message?.includes('Password should be at least')) {
          error = 'Password must be at least 6 characters long.';
        } else if (err.message?.includes('Invalid email')) {
          error = 'Please enter a valid email address.';
        } else {
          error = err.message || 'An error occurred during signup. Please try again.';
        }
      } else {
        console.log('Signup successful:', data);
        
        // Check if user was created successfully
        if (data.user) {
          // Check if user was automatically signed in (email confirmation disabled)
          if (data.session) {
            // User created and automatically signed in (email confirmation disabled)
            try {
              // Attempt to ensure profile exists by calling manual creation function
              const { data: profileResult, error: profileError } = await supabase.rpc('create_user_profile_manual', {
                user_id: data.user.id,
                user_email: data.user.email
              });
              
              if (profileError) {
                console.warn('Profile creation function error (non-critical):', profileError);
              } else {
                console.log('Profile creation result:', profileResult);
              }
            } catch (profileErr) {
              console.warn('Profile creation attempt failed (non-critical):', profileErr);
            }
            
            message = 'Account created successfully! Redirecting to dashboard...';
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 2000);
          } else {
            // User created but no session - this means email confirmation is required
            // Check if this is a new user or existing user by looking at email_confirmed_at
            if (data.user.email_confirmed_at) {
              // User already exists and is confirmed - they should sign in instead
              message = 'An account with this email already exists. Please sign in instead.';
            } else {
              // New user created, needs email confirmation
              message = 'Account created successfully! Please check your email for a confirmation link to complete your registration.';
            }
          }
        } else {
          // This shouldn't happen, but handle it gracefully
          message = 'Account creation in progress. Please check your email for further instructions.';
        }
      }
    } catch (err) {
      console.error('Unexpected signup error:', err);
      
      // Check if it's a network or database connectivity issue
      if (err instanceof TypeError && err.message?.includes('fetch')) {
        error = 'Network error. Please check your connection and try again.';
      } else if (err.message?.includes('Database error') || err.message?.includes('connection')) {
        error = 'Database connection issue. Please try again in a moment.';
      } else {
        error = 'An unexpected error occurred during signup. Please try again.';
      }
    }
    
    isLoading = false;
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
  <div class="max-w-md w-full space-y-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">Sign Up</h1>
      <p class="text-gray-600 dark:text-gray-300">Create a new account below.</p>
    </div>
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors duration-300">
      <form on:submit|preventDefault={handleSubmit} class="space-y-6" autocomplete="off">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Email Address</label>
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
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Password</label>
          <input
            id="password"
            type="password"
            bind:value={password}
            required
            class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Enter your password"
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
            Signing up...
          {:else}
            Sign Up
          {/if}
        </button>
      </form>
      {#if message}
        <p class="mt-4 text-green-600 dark:text-green-400">{message}</p>
        {#if message.includes('already exists')}
          <div class="mt-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-md">
            <p class="text-blue-700 dark:text-blue-300 text-sm mb-2">
              Already have an account? 
              <a href="/" class="font-medium underline">Sign in here</a>
            </p>
            <p class="text-blue-700 dark:text-blue-300 text-sm">
              Forgot your password? 
              <a href="/forgot-password" class="font-medium underline">Reset it here</a>
            </p>
          </div>
        {/if}
      {/if}
      {#if error}
        <p class="mt-4 text-red-600 dark:text-red-400">{error}</p>
      {/if}
      <div class="mt-6 text-center">
        <a href="/" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm mr-4">Back to Login</a>
        <a href="/forgot-password" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 text-sm">Forgot Password?</a>
      </div>
    </div>
  </div>
</div> 