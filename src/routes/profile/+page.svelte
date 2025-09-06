<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import type { User } from '@supabase/supabase-js';
  
  let user: User | null = null;
  let isLoading = true;
  let error = '';
  let message = '';
  
  // Profile form data
  let displayName = '';
  let bio = '';
  let location = '';
  let website = '';
  let isEditing = false;
  let isSaving = false;

  onMount(() => {
    console.log('Profile page onMount started');
    
    // Check Supabase client configuration
    console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? 'Set' : 'Missing');
    console.log('Supabase Anon Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
    
    const checkAuth = async () => {
      // Check if user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Session check result:', { session: !!session, error: sessionError });
      
      if (!session) {
        console.log('No session found, redirecting to login');
        // Redirect to login if not authenticated
        goto('/');
        return;
      }
      
      console.log('Session found, user:', session.user.email);
      user = session.user;
      await loadProfile();
      isLoading = false;
    };
    
    checkAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Profile auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, redirecting to login');
          goto('/');
        }
      }
    );
    
    // Cleanup subscription on component destroy
    return () => subscription.unsubscribe();
  });

  async function loadProfile() {
    try {
      console.log('Loading profile for user:', user?.id);
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      console.log('Profile fetch response:', { data, error: fetchError });

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 is "not found"
        console.error('Error fetching profile:', fetchError);
        error = 'Failed to load profile data.';
        return;
      }

      if (data) {
        console.log('Profile data loaded:', data);
        displayName = data.display_name || '';
        bio = data.bio || '';
        location = data.location || '';
        website = data.website || '';
      } else {
        console.log('No profile found, will create one when user edits');
        // Don't create profile automatically - let user create it when they edit
        displayName = user?.email || '';
        bio = '';
        location = '';
        website = '';
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      error = 'Failed to load profile data.';
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    goto('/');
  }

  async function handleSaveProfile() {
    isSaving = true;
    error = '';
    message = '';
    
    console.log('Starting profile update for user:', user?.id);
    console.log('Profile data to update:', {
      display_name: displayName,
      bio: bio,
      location: location,
      website: website
    });
    
    try {
      // First, check if profile exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user?.id)
        .single();

      if (existingProfile) {
        // Update existing profile
        const { data, error: updateError } = await supabase
          .from('profiles')
          .update({
            display_name: displayName,
            bio: bio,
            location: location,
            website: website,
            updated_at: new Date().toISOString()
          })
          .eq('id', user?.id)
          .select();
        
        console.log('Update response:', { data, error: updateError });
        
        if (updateError) {
          console.error('Error updating profile:', updateError);
          error = updateError.message;
        } else {
          console.log('Profile updated successfully:', data);
          message = 'Profile updated successfully!';
          isEditing = false;
        }
      } else {
        // Create new profile
        const { data, error: insertError } = await supabase
          .from('profiles')
          .insert({
            id: user?.id,
            display_name: displayName,
            bio: bio,
            location: location,
            website: website
          })
          .select();
        
        console.log('Insert response:', { data, error: insertError });
        
        if (insertError) {
          console.error('Error creating profile:', insertError);
          error = insertError.message;
        } else {
          console.log('Profile created successfully:', data);
          message = 'Profile created successfully!';
          isEditing = false;
        }
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      error = 'An unexpected error occurred while saving your profile.';
    }
    
    isSaving = false;
  }

  function startEditing() {
    isEditing = true;
    error = '';
    message = '';
  }

  async function cancelEditing() {
    isEditing = false;
    // Reload profile data to reset form
    await loadProfile();
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100">
  {#if isLoading}
    <!-- Loading State -->
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <svg class="animate-spin mx-auto h-12 w-12 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="mt-4 text-gray-600 dark:text-gray-300">Loading profile...</p>
      </div>
    </div>
  {:else if user}
    <!-- Profile Content -->
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100">Profile</h1>
          <p class="text-gray-600 dark:text-gray-300">Manage your account and profile information</p>
        </div>
        <div class="flex items-center space-x-4">
          <a href="/dashboard" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300">
            Dashboard
          </a>
          <button
            on:click={handleLogout}
            class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Profile Card -->
        <div class="lg:col-span-1">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="text-center">
              <div class="mx-auto h-24 w-24 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center mb-4">
                <svg class="h-12 w-12 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                {displayName || user.email}
              </h2>
              <p class="text-gray-600 dark:text-gray-300 mb-4">{user.email}</p>
              {#if bio}
                <p class="text-gray-700 dark:text-gray-300 mb-4">{bio}</p>
              {/if}
              {#if location}
                <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  📍 {location}
                </p>
              {/if}
              {#if website}
                <a href={website} target="_blank" rel="noopener noreferrer" class="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-500">
                  🌐 {website}
                </a>
              {/if}
            </div>
          </div>
        </div>

        <!-- Profile Form -->
        <div class="lg:col-span-2">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div class="flex justify-between items-center mb-6">
              <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Profile Information</h3>
              {#if !isEditing}
                <button
                  on:click={startEditing}
                  class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
                >
                  Edit Profile
                </button>
              {:else}
                <div class="flex space-x-2">
                  <button
                    on:click={cancelEditing}
                    class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    on:click={handleSaveProfile}
                    disabled={isSaving}
                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              {/if}
            </div>

            {#if message}
              <div class="mb-4 p-4 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md">
                {message}
              </div>
            {/if}
            {#if error}
              <div class="mb-4 p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md">
                {error}
              </div>
            {/if}

            <div class="space-y-4">
              <!-- Display Name -->
              <div>
                <label for="displayName" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Display Name
                </label>
                <input
                  id="displayName"
                  type="text"
                  bind:value={displayName}
                  disabled={!isEditing}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  placeholder="Enter your display name"
                />
              </div>

              <!-- Bio -->
              <div>
                <label for="bio" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Bio
                </label>
                <textarea
                  id="bio"
                  bind:value={bio}
                  disabled={!isEditing}
                  rows="4"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  placeholder="Tell us about yourself..."
                ></textarea>
              </div>

              <!-- Location -->
              <div>
                <label for="location" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  bind:value={location}
                  disabled={!isEditing}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  placeholder="Where are you located?"
                />
              </div>

              <!-- Website -->
              <div>
                <label for="website" class="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                  Website
                </label>
                <input
                  id="website"
                  type="url"
                  bind:value={website}
                  disabled={!isEditing}
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-900 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:cursor-not-allowed"
                  placeholder="https://your-website.com"
                />
              </div>
            </div>
          </div>

          <!-- Account Settings -->
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mt-6">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Account Settings</h3>
            <div class="space-y-4">
              <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-gray-100">Email Address</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                </div>
                <span class="text-sm text-gray-400">Verified</span>
              </div>
              
              <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-gray-100">Account Created</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div class="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div>
                  <h4 class="font-medium text-gray-900 dark:text-gray-100">Last Sign In</h4>
                  <p class="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(user.last_sign_in_at || user.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  {/if}
</div> 