<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase, authUtils } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import type { User, AuthError } from '@supabase/supabase-js';
  import type { PageData } from './$types';

  export let data: PageData;
  
  let email = "";
  let password = "";
  let rememberMe = false;
  let isLoading = false;
  let error = '';
  let message = '';
  let user: User | null = null;
  let isAuthenticated = false;
  let isHydrated = false;
  
  // Generate random field names to prevent autofill
  let emailFieldName = `email-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  let passwordFieldName = `password-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  onMount(() => {
    isHydrated = true;
    console.log('Main page onMount started');
    
    // Clear form inputs every time the page loads
    clearFormInputs();
    
    // Check if user is already authenticated
    checkCurrentSession();
    
    // Listen for auth state changes
    const { data: { subscription } } = authUtils.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session) {
          user = session.user;
          isAuthenticated = true;
          console.log('User signed in:', user.email);
          goto('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          user = null;
          isAuthenticated = false;
          console.log('User signed out');
          // Clear form when user signs out
          clearFormInputs();
        }
      }
    );
    
    // Clear form when page becomes visible (user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        clearFormInputs();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clear form when page gains focus
    const handleFocus = () => {
      clearFormInputs();
    };
    window.addEventListener('focus', handleFocus);
    
    // Cleanup subscriptions and event listeners on component destroy
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  });

  async function checkCurrentSession() {
    try {
      const { data, error } = await authUtils.getSession();
      
      if (error) {
        console.error('Session check error:', error);
        return;
      }
      
      if (data.session) {
        console.log('Session found, user:', data.session.user.email);
        user = data.session.user;
        isAuthenticated = true;
        console.log('User is already authenticated:', user.email);
        // Redirect to dashboard
        goto('/dashboard');
      } else {
        console.log('No session found, showing login form');
      }
    } catch (error) {
      console.error('Unexpected error checking session:', error);
    }
  }

  async function handleLogout() {
    isLoading = true;
    error = '';
    message = '';
    
    try {
      const { error: logoutError } = await authUtils.signOut();
      
      if (logoutError) {
        error = logoutError.message;
        console.error('Logout error:', logoutError);
      } else {
        user = null;
        isAuthenticated = false;
        message = 'Logged out successfully!';
        console.log('Logout successful');
      }
    } catch (error) {
      console.error('Unexpected logout error:', error);
      error = 'An unexpected error occurred during logout.';
    } finally {
      isLoading = false;
    }
  }

  async function handleSubmit() {
    isLoading = true;
    error = '';
    message = '';
    
    try {
      // Basic validation
      if (!email.trim()) {
        error = 'Email is required.';
        return;
      }
      
      if (!password.trim()) {
        error = 'Password is required.';
        return;
      }
      
      // Email format validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        error = 'Please enter a valid email address.';
        return;
      }
      
      console.log('Attempting to sign in with:', email);
      
      const { data, error: authError } = await authUtils.signInWithPassword(email, password);
      
      if (authError) {
        error = getErrorMessage(authError);
        console.error('Authentication error:', authError);
      } else if (data?.user) {
        message = 'Login successful!';
        user = data.user;
        isAuthenticated = true;
        console.log('Login successful for:', data.user.email);
        // Redirect will be handled by auth state change listener
      }
    } catch (error) {
      console.error('Unexpected error during login:', error);
      error = 'An unexpected error occurred. Please try again.';
    } finally {
      isLoading = false;
    }
  }

  function getErrorMessage(authError: AuthError): string {
    // Map Supabase error messages to user-friendly messages
    switch (authError.message) {
      case 'Invalid login credentials':
        return 'Invalid email or password. Please try again.';
      case 'Email not confirmed':
        return 'Please check your email and confirm your account.';
      case 'Too many requests':
        return 'Too many login attempts. Please wait a moment and try again.';
      case 'User not found':
        return 'No account found with this email address.';
      default:
        return authError.message || 'An error occurred during login.';
    }
  }

  function clearFormInputs() {
    // Clear all form inputs and reset form state
    email = '';
    password = '';
    rememberMe = false;
    error = '';
    message = '';
    isLoading = false;
    
    // Regenerate random field names to prevent browser autofill memory
    emailFieldName = `email-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    passwordFieldName = `password-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    
    console.log('Form inputs cleared and field names regenerated');
  }

  async function handleGoogleSignIn() {
    isLoading = true;
    error = '';
    message = '';
    
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (oauthError) {
        error = oauthError.message;
        console.error('Google OAuth error:', oauthError);
        isLoading = false;
      }
      // OAuth redirects to provider, so we don't set loading to false here
    } catch (error) {
      console.error('Unexpected Google OAuth error:', error);
      error = 'An unexpected error occurred during Google sign in.';
      isLoading = false;
    }
  }

  async function handleGitHubSignIn() {
    isLoading = true;
    error = '';
    message = '';
    
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (oauthError) {
        error = oauthError.message;
        console.error('GitHub OAuth error:', oauthError);
        isLoading = false;
      }
      // OAuth redirects to provider, so we don't set loading to false here
    } catch (error) {
      console.error('Unexpected GitHub OAuth error:', error);
      error = 'An unexpected error occurred during GitHub sign in.';
      isLoading = false;
    }
  }

  async function handleMagicLinkSignIn() {
    // Redirect to dedicated magic link page
    goto('/magic-link');
  }

  async function handleFacebookSignIn() {
    isLoading = true;
    error = '';
    message = '';
    
    try {
      const { data, error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (oauthError) {
        error = oauthError.message;
        console.error('Facebook OAuth error:', oauthError);
        isLoading = false;
      }
      // OAuth redirects to provider, so we don't set loading to false here
    } catch (error) {
      console.error('Unexpected Facebook OAuth error:', error);
      error = 'An unexpected error occurred during Facebook sign in.';
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>{data.title}</title>
  <meta name="description" content={data.description} />
</svelte:head>

{#if isHydrated && isAuthenticated && user}
  <!-- Authenticated User View -->
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
    <div class="max-w-md w-full space-y-8">
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">LocalSocialMax</h1>
        <p class="text-gray-600 dark:text-gray-300">Welcome back!</p>
        
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors duration-300">
        <div class="text-center">
          <div class="mx-auto h-12 w-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mb-4">
            <svg class="h-6 w-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
            </svg>
          </div>
          <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">You're logged in!</h2>
          <p class="text-gray-600 dark:text-gray-300 mb-4">Email: {user.email}</p>
          {#if message}
            <p class="text-green-600 dark:text-green-400 mb-4">{message}</p>
          {/if}
          <button
            on:click={handleLogout}
            disabled={isLoading}
            class="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:cursor-not-allowed"
          >
            {#if isLoading}
              <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Signing out...
            {:else}
              Sign Out
            {/if}
          </button>
        </div>
      </div>
    </div>
  </div>
{:else if isHydrated}
  <!-- Login Form -->
  <div
    class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4"
  >
    <div class="max-w-md w-full space-y-8">
      <!-- Header -->
      <div class="text-center">
        <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">LocalSocialMax</h1>
        <p class="text-gray-600 dark:text-gray-300">Welcome back! Please sign in to your account.</p>
        
      </div>

      <!-- Login Form -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 transition-colors duration-300">
        <form on:submit|preventDefault={handleSubmit} class="space-y-6" autocomplete="off" autocapitalize="off" spellcheck="false">
          <!-- Hidden decoy fields to confuse autofill -->
          <div style="position: absolute; left: -9999px; visibility: hidden;">
            <input type="email" name="fake_email" autocomplete="off" tabindex="-1" />
            <input type="password" name="fake_password" autocomplete="off" tabindex="-1" />
          </div>
          
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
              disabled={isLoading}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your email"
              autocomplete="new-password"
              name={emailFieldName}
              data-lpignore="true"
              data-form-type="other"
            />
          </div>

          <!-- Password Field -->
          <div>
            <label
              for="password"
              class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              bind:value={password}
              required
              disabled={isLoading}
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your password"
              autocomplete="new-password"
              name={passwordFieldName}
              data-lpignore="true"
              data-form-type="other"
            />
          </div>

          <!-- Remember Me & Forgot Password -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                bind:checked={rememberMe}
                disabled={isLoading}
                class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label for="remember-me" class="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                Remember me
              </label>
            </div>
            <a href="/forgot-password" class="text-sm text-blue-600 hover:text-blue-500">
              Forgot password?
            </a>
          </div>

          <!-- Submit Button -->
          <button
            type="submit"
            disabled={isLoading}
            class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
              Signing in...
            {:else}
              Sign in
            {/if}
          </button>
        </form>
        
        <!-- Error and Success Messages -->
        {#if message}
          <div class="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
            <p class="text-green-600 dark:text-green-400 text-sm">{message}</p>
          </div>
        {/if}
        {#if error}
          <div class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p class="text-red-600 dark:text-red-400 text-sm">{error}</p>
          </div>
        {/if}

        <!-- Divider -->
        <div class="mt-6">
          <div class="relative">
            <div class="absolute inset-0 flex items-center">
              <div class="w-full border-t border-gray-300"></div>
            </div>
            <div class="relative flex justify-center text-sm">
              <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with</span>
            </div>
          </div>
        </div>

        <!-- Social Login Buttons -->
        <div class="mt-6 grid grid-cols-2 gap-3">
          <!-- Google -->
          <button
            type="button"
            on:click={handleGoogleSignIn}
            disabled={isLoading}
            class="w-full inline-flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white dark:bg-gray-900 text-sm font-medium text-gray-700 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Sign in with Google"
          >
            <svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
              <path d="M21.805 10.023h-9.18v3.955h5.262c-.227 1.19-1.36 3.49-5.262 3.49-3.17 0-5.75-2.62-5.75-5.85s2.58-5.85 5.75-5.85c1.8 0 3.01.77 3.7 1.43l2.53-2.46C17.09 3.54 15.21 2.5 12.625 2.5 7.98 2.5 4.25 6.23 4.25 10.88s3.73 8.38 8.375 8.38c4.82 0 8.005-3.38 8.005-8.14 0-.55-.06-1.09-.17-1.6z"/>
            </svg>
            Google
          </button>
          <!-- GitHub -->
          <button
            type="button"
            on:click={handleGitHubSignIn}
            disabled={isLoading}
            class="w-full inline-flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-gray-900 text-sm font-medium text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Sign in with GitHub"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.28-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.3-1.7-1.3-1.7-1.06-.72.08-.71.08-.71 1.17.08 1.78 1.2 1.78 1.2 1.04 1.78 2.73 1.27 3.4.97.11-.75.41-1.27.74-1.56-2.56-.29-5.26-1.28-5.26-5.7 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.18 1.18a11.1 11.1 0 0 1 2.9-.39c.98.01 1.97.13 2.9.39 2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.09 0 4.43-2.7 5.41-5.27 5.7.42.36.79 1.08.79 2.18 0 1.57-.01 2.84-.01 3.23 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12c0-6.27-5.23-11.5-12-11.5z"/>
            </svg>
            GitHub
          </button>
          <!-- Facebook -->
          <button
            type="button"
            on:click={handleFacebookSignIn}
            disabled={isLoading}
            class="w-full inline-flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Sign in with Facebook"
          >
            <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"/>
            </svg>
            Facebook
          </button>
          <!-- Magic Link -->
          <button
            type="button"
            on:click={handleMagicLinkSignIn}
            disabled={isLoading}
            class="w-full inline-flex items-center justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-violet-600 text-sm font-medium text-white hover:bg-violet-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Sign in with Magic Link"
          >
            <svg class="w-5 h-5 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path d="M12 19V6M5 12l7-7 7 7"/>
            </svg>
            Magic Link
          </button>
        </div>

        <!-- Sign Up Link -->
        <div class="mt-6 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-300">
            Don't have an account?
            <a href="/signup" class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
              Sign up
            </a>
          </p>
        </div>

        <!-- Template Module Links -->
        <div class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div class="text-center mb-4">
            <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Template Modules</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400">Explore available module templates</p>
          </div>
          <div class="grid grid-cols-2 gap-3">
            <a href="/test-templates" class="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              View Templates
            </a>
            <a href="/test-templates/view-template" class="flex items-center justify-center px-3 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
              <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
              Template Inspector
            </a>
          </div>
        </div>
      </div>
    </div>
  </div>
{:else}
  <!-- Loading State -->
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 flex items-center justify-center p-4">
    <div class="text-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p class="text-gray-600 dark:text-gray-300">Loading...</p>
    </div>
  </div>
{/if}
