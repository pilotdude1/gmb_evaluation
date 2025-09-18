<script lang="ts">
  import { onMount } from 'svelte';
  import { crmClient } from '$lib/crm/crmClient';
  
  let dashboardStats: any = null;
  let loading = true;
  let error: string | null = null;

  onMount(async () => {
    await loadDashboardStats();
  });

  async function loadDashboardStats() {
    loading = true;
    error = null;
    
    const { data, error: err } = await crmClient.getDashboardStats();
    
    if (err) {
      error = 'Failed to load dashboard statistics';
      console.error('Dashboard error:', err);
    } else {
      dashboardStats = data;
    }
    
    loading = false;
  }

  // Format currency
  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  // Format percentage
  function formatPercentage(value: number): string {
    return `${Math.round(value)}%`;
  }
</script>

<svelte:head>
  <title>CRM Dashboard</title>
  <meta name="description" content="CRM System Dashboard - Overview of accounts, contacts, deals, and activities" />
</svelte:head>

<div class="px-4 sm:px-6 lg:px-8">
  <!-- Page Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-gray-900">CRM Dashboard</h1>
    <p class="mt-2 text-gray-600">Overview of your sales pipeline and customer relationships</p>
  </div>

  {#if loading}
    <!-- Loading State -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {#each Array(4) as _}
        <div class="bg-white rounded-lg shadow p-6 animate-pulse">
          <div class="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div class="h-8 bg-gray-200 rounded w-1/2"></div>
        </div>
      {/each}
    </div>
  {:else if error}
    <!-- Error State -->
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="text-red-400">⚠️</span>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-red-800">Error</h3>
          <p class="text-sm text-red-700 mt-1">{error}</p>
          <button
            on:click={loadDashboardStats}
            class="mt-2 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm font-medium transition-colors duration-200"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  {:else if dashboardStats}
    <!-- Dashboard Stats -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <!-- Accounts Stats -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-md bg-blue-500 text-white">
              🏢
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Total Accounts</dt>
              <dd class="text-lg font-medium text-gray-900">{dashboardStats.accounts.total}</dd>
            </dl>
          </div>
        </div>
        <div class="mt-4 text-sm text-gray-600">
          <div class="flex justify-between">
            <span>Prospects:</span>
            <span class="font-medium">{dashboardStats.accounts.prospects}</span>
          </div>
          <div class="flex justify-between">
            <span>Customers:</span>
            <span class="font-medium">{dashboardStats.accounts.customers}</span>
          </div>
        </div>
      </div>

      <!-- Contacts Stats -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-md bg-green-500 text-white">
              👥
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Total Contacts</dt>
              <dd class="text-lg font-medium text-gray-900">{dashboardStats.contacts.total}</dd>
            </dl>
          </div>
        </div>
        <div class="mt-4 text-sm text-gray-600">
          <div class="flex justify-between">
            <span>New:</span>
            <span class="font-medium">{dashboardStats.contacts.new}</span>
          </div>
          <div class="flex justify-between">
            <span>Qualified:</span>
            <span class="font-medium">{dashboardStats.contacts.qualified}</span>
          </div>
        </div>
      </div>

      <!-- Deals Stats -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-md bg-purple-500 text-white">
              💼
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Pipeline Value</dt>
              <dd class="text-lg font-medium text-gray-900">{formatCurrency(dashboardStats.deals.pipelineValue)}</dd>
            </dl>
          </div>
        </div>
        <div class="mt-4 text-sm text-gray-600">
          <div class="flex justify-between">
            <span>Total Deals:</span>
            <span class="font-medium">{dashboardStats.deals.total}</span>
          </div>
          <div class="flex justify-between">
            <span>Avg Value:</span>
            <span class="font-medium">{formatCurrency(dashboardStats.deals.avgValue)}</span>
          </div>
        </div>
      </div>

      <!-- Activities Stats -->
      <div class="bg-white rounded-lg shadow p-6">
        <div class="flex items-center">
          <div class="flex-shrink-0">
            <div class="flex items-center justify-center h-8 w-8 rounded-md bg-orange-500 text-white">
              📅
            </div>
          </div>
          <div class="ml-5 w-0 flex-1">
            <dl>
              <dt class="text-sm font-medium text-gray-500 truncate">Activities This Week</dt>
              <dd class="text-lg font-medium text-gray-900">{dashboardStats.activities.thisWeek}</dd>
            </dl>
          </div>
        </div>
        <div class="mt-4 text-sm text-gray-600">
          <div class="flex justify-between">
            <span>Total:</span>
            <span class="font-medium">{dashboardStats.activities.total}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Quick Actions -->
    <div class="bg-white rounded-lg shadow p-6 mb-8">
      <h2 class="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/crm/accounts/new"
          class="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          <span class="mr-2">🏢</span>
          Add New Account
        </a>
        <a
          href="/crm/contacts/new"
          class="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 transition-colors duration-200"
        >
          <span class="mr-2">👤</span>
          Add New Contact
        </a>
        <a
          href="/crm/deals/new"
          class="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 transition-colors duration-200"
        >
          <span class="mr-2">💼</span>
          Create New Deal
        </a>
      </div>
    </div>

    <!-- Recent Activity (if we have activity data) -->
    {#if dashboardStats.activities.byType}
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-medium text-gray-900 mb-4">Activity Breakdown</h2>
        <div class="space-y-3">
          {#each Object.entries(dashboardStats.activities.byType) as [type, count]}
            <div class="flex items-center justify-between">
              <div class="flex items-center">
                <div class="flex-shrink-0 w-3 h-3 rounded-full bg-blue-500 mr-3"></div>
                <span class="text-sm font-medium text-gray-900 capitalize">{type.replace('_', ' ')}</span>
              </div>
              <span class="text-sm text-gray-500">{count}</span>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  {/if}
</div>

<style>
  /* Add any custom styles if needed */
</style>
