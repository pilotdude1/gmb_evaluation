<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { authUtils } from '$lib/supabaseClient';
  
  let user: any = null;
  let loading = true;

  onMount(async () => {
    // Check authentication
    user = await authUtils.getCurrentUser();
    if (!user) {
      goto('/auth/login?redirect=/crm');
      return;
    }
    loading = false;
  });

  const navItems = [
    { href: '/crm', label: 'Dashboard', icon: '📊' },
    { href: '/crm/accounts', label: 'Accounts', icon: '🏢' },
    { href: '/crm/contacts', label: 'Contacts', icon: '👥' },
    { href: '/crm/deals', label: 'Deals', icon: '💼' },
    { href: '/crm/activities', label: 'Activities', icon: '📅' },
    { href: '/crm/campaigns', label: 'Campaigns', icon: '📢' }
  ];

  $: currentPath = $page.url.pathname;
</script>

{#if loading}
  <div class="flex items-center justify-center min-h-screen">
    <div class="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
  </div>
{:else if user}
  <div class="min-h-screen bg-gray-50">
    <!-- Navigation -->
    <nav class="bg-white shadow-sm border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <!-- Logo -->
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-gray-900">CRM System</h1>
            </div>
            
            <!-- Navigation Links -->
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              {#each navItems as item}
                <a
                  href={item.href}
                  class="inline-flex items-center px-1 pt-1 text-sm font-medium border-b-2 transition-colors duration-200 {
                    currentPath === item.href || (item.href !== '/crm' && currentPath.startsWith(item.href))
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }"
                >
                  <span class="mr-2">{item.icon}</span>
                  {item.label}
                </a>
              {/each}
            </div>
          </div>

          <!-- User Menu -->
          <div class="flex items-center">
            <div class="flex items-center space-x-4">
              <span class="text-sm text-gray-700">Welcome, {user.email}</span>
              <button
                on:click={() => authUtils.signOut().then(() => goto('/'))}
                class="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mobile menu -->
      <div class="sm:hidden">
        <div class="pt-2 pb-3 space-y-1">
          {#each navItems as item}
            <a
              href={item.href}
              class="block pl-3 pr-4 py-2 text-base font-medium transition-colors duration-200 {
                currentPath === item.href || (item.href !== '/crm' && currentPath.startsWith(item.href))
                  ? 'bg-blue-50 border-r-4 border-blue-500 text-blue-700'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }"
            >
              <span class="mr-2">{item.icon}</span>
              {item.label}
            </a>
          {/each}
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <slot />
    </main>
  </div>
{/if}

<style>
  /* Custom scrollbar for better UX */
  :global(html) {
    scrollbar-width: thin;
    scrollbar-color: #cbd5e0 #f7fafc;
  }
  
  :global(html::-webkit-scrollbar) {
    width: 8px;
  }
  
  :global(html::-webkit-scrollbar-track) {
    background: #f7fafc;
  }
  
  :global(html::-webkit-scrollbar-thumb) {
    background-color: #cbd5e0;
    border-radius: 4px;
  }
  
  :global(html::-webkit-scrollbar-thumb:hover) {
    background-color: #a0aec0;
  }
</style>
