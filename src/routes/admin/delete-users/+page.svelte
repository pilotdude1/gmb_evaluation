<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';
  
  let users = [];
  let isLoading = false;
  let message = '';
  let error = '';
  
  onMount(async () => {
    await loadUsers();
  });
  
  async function loadUsers() {
    isLoading = true;
    try {
      // Get current user to check if they're admin
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        error = 'You must be signed in to access this page';
        return;
      }
      
      // Note: This requires admin privileges or a custom function
      // For now, we'll show a message about using the dashboard
      message = 'To delete users, use the Supabase Dashboard or SQL Editor';
      
    } catch (err) {
      error = 'Error loading users: ' + err.message;
    }
    isLoading = false;
  }
  
  async function deleteUser(userId: string, email: string) {
    if (!confirm(`Are you sure you want to delete user: ${email}?`)) {
      return;
    }
    
    try {
      // This would require admin privileges
      const { error } = await supabase.auth.admin.deleteUser(userId);
      
      if (error) {
        throw error;
      }
      
      message = `User ${email} deleted successfully`;
      await loadUsers();
      
    } catch (err) {
      error = 'Error deleting user: ' + err.message;
    }
  }
</script>

<svelte:head>
  <title>Delete Users - Admin</title>
</svelte:head>

<div class="container mx-auto p-6">
  <h1 class="text-3xl font-bold mb-6">Delete Users</h1>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
      {error}
    </div>
  {/if}
  
  {#if message}
    <div class="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
      {message}
    </div>
  {/if}
  
  <div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
    <h3 class="font-bold">⚠️ Important:</h3>
    <p>To delete users, you have several options:</p>
    <ul class="list-disc list-inside mt-2">
      <li><strong>Supabase Dashboard:</strong> Go to Authentication → Users → Delete user</li>
      <li><strong>SQL Editor:</strong> Use DELETE FROM auth.users WHERE email = 'user@example.com'</li>
      <li><strong>Service Role Key:</strong> Use the delete-test-users.js script with admin privileges</li>
    </ul>
  </div>
  
  <div class="bg-gray-100 p-4 rounded">
    <h3 class="font-bold mb-2">Quick SQL Commands:</h3>
    <div class="bg-white p-3 rounded border">
      <code class="text-sm">
        -- Delete specific user<br/>
        DELETE FROM auth.users WHERE email = 'testuser123@gmail.com';<br/><br/>
        
        -- Delete all test users<br/>
        DELETE FROM auth.users WHERE email LIKE 'testuser%@gmail.com';<br/><br/>
        
        -- Delete users created in last 24 hours<br/>
        DELETE FROM auth.users WHERE created_at > NOW() - INTERVAL '1 day';
      </code>
    </div>
  </div>
  
  <div class="mt-6">
    <a href="/" class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
      Back to Home
    </a>
  </div>
</div>

