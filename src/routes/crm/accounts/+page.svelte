<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { crmClient, type CRMAccount } from '$lib/crm/crmClient';
  
  let accounts: CRMAccount[] = [];
  let loading = true;
  let error: string | null = null;
  let searchTerm = '';
  let selectedIndustry = '';
  let selectedBusinessType = '';

  // Pagination
  let currentPage = 1;
  let pageSize = 20;

  // Filter options
  const industries = [
    'event_planning',
    'pet_care', 
    'landscape',
    'real_estate',
    'healthcare',
    'technology',
    'consulting',
    'retail',
    'manufacturing'
  ];

  const businessTypes = [
    'prospect',
    'customer', 
    'partner',
    'competitor'
  ];

  onMount(async () => {
    await loadAccounts();
  });

  async function loadAccounts() {
    loading = true;
    error = null;
    
    const options = {
      limit: pageSize,
      offset: (currentPage - 1) * pageSize,
      search: searchTerm || undefined,
      industry: selectedIndustry || undefined,
      business_type: selectedBusinessType || undefined
    };

    const { data, error: err } = await crmClient.getAccounts(options);
    
    if (err) {
      error = 'Failed to load accounts';
      console.error('Accounts error:', err);
    } else {
      accounts = data || [];
    }
    
    loading = false;
  }

  // Handle search
  function handleSearch() {
    currentPage = 1;
    loadAccounts();
  }

  // Handle filter changes
  function handleFilterChange() {
    currentPage = 1;
    loadAccounts();
  }

  // Format phone number
  function formatPhone(phone: string | null): string {
    if (!phone) return '';
    // Basic phone formatting - you can enhance this
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  }

  // Get business type badge color
  function getBusinessTypeBadge(type: string | null): string {
    switch (type) {
      case 'customer': return 'bg-green-100 text-green-800';
      case 'prospect': return 'bg-blue-100 text-blue-800';
      case 'partner': return 'bg-purple-100 text-purple-800';
      case 'competitor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  // Get lead score color
  function getLeadScoreColor(score: number | null): string {
    if (!score) return 'text-gray-500';
    if (score >= 80) return 'text-green-600 font-bold';
    if (score >= 60) return 'text-blue-600 font-medium';
    if (score >= 40) return 'text-yellow-600';
    return 'text-red-600';
  }
</script>

<svelte:head>
  <title>CRM Accounts</title>
  <meta name="description" content="Manage your business accounts and prospects" />
</svelte:head>

<div class="px-4 sm:px-6 lg:px-8">
  <!-- Page Header -->
  <div class="sm:flex sm:items-center sm:justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900">Accounts</h1>
      <p class="mt-2 text-gray-600">Manage your business accounts and prospects</p>
    </div>
    <div class="mt-4 sm:mt-0">
      <button
        on:click={() => goto('/crm/accounts/new')}
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        <span class="mr-2">+</span>
        Add Account
      </button>
    </div>
  </div>

  <!-- Filters and Search -->
  <div class="bg-white rounded-lg shadow p-6 mb-6">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <!-- Search -->
      <div>
        <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
        <input
          id="search"
          type="text"
          bind:value={searchTerm}
          on:keydown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search accounts..."
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        />
      </div>

      <!-- Industry Filter -->
      <div>
        <label for="industry" class="block text-sm font-medium text-gray-700 mb-1">Industry</label>
        <select
          id="industry"
          bind:value={selectedIndustry}
          on:change={handleFilterChange}
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">All Industries</option>
          {#each industries as industry}
            <option value={industry}>{industry.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
          {/each}
        </select>
      </div>

      <!-- Business Type Filter -->
      <div>
        <label for="business-type" class="block text-sm font-medium text-gray-700 mb-1">Type</label>
        <select
          id="business-type"
          bind:value={selectedBusinessType}
          on:change={handleFilterChange}
          class="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="">All Types</option>
          {#each businessTypes as type}
            <option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
          {/each}
        </select>
      </div>

      <!-- Search Button -->
      <div class="flex items-end">
        <button
          on:click={handleSearch}
          class="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          🔍 Search
        </button>
      </div>
    </div>
  </div>

  <!-- Accounts Table -->
  <div class="bg-white shadow rounded-lg overflow-hidden">
    {#if loading}
      <!-- Loading State -->
      <div class="p-8 text-center">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="mt-2 text-gray-500">Loading accounts...</p>
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="p-8 text-center">
        <div class="text-red-500 mb-2">⚠️</div>
        <p class="text-gray-500 mb-4">{error}</p>
        <button
          on:click={loadAccounts}
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    {:else if accounts.length === 0}
      <!-- Empty State -->
      <div class="p-8 text-center">
        <div class="text-gray-400 mb-2">🏢</div>
        <p class="text-gray-500 mb-4">No accounts found</p>
        <button
          on:click={() => goto('/crm/accounts/new')}
          class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
        >
          <span class="mr-2">+</span>
          Create First Account
        </button>
      </div>
    {:else}
      <!-- Accounts List -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Account
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Industry
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Lead Score
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Location
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each accounts as account}
              <tr class="hover:bg-gray-50 transition-colors duration-200">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div class="text-sm font-medium text-gray-900">
                      <a href="/crm/accounts/{account.id}" class="hover:text-blue-600">
                        {account.name}
                      </a>
                    </div>
                    {#if account.website}
                      <div class="text-sm text-gray-500">
                        <a href={account.website} target="_blank" class="hover:text-blue-600">
                          {account.website}
                        </a>
                      </div>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {account.industry ? account.industry.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : '-'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex px-2 py-1 text-xs font-semibold rounded-full {getBusinessTypeBadge(account.business_type)}">
                    {account.business_type || 'Unknown'}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm {getLeadScoreColor(account.lead_score)}">
                  {account.lead_score || 0}/100
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    {#if account.email}
                      <div><a href="mailto:{account.email}" class="hover:text-blue-600">{account.email}</a></div>
                    {/if}
                    {#if account.phone}
                      <div class="text-gray-500">{formatPhone(account.phone)}</div>
                    {/if}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {#if account.city || account.state}
                    <div>{account.city}{account.city && account.state ? ', ' : ''}{account.state}</div>
                  {:else}
                    <span class="text-gray-500">-</span>
                  {/if}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <a href="/crm/accounts/{account.id}" class="text-blue-600 hover:text-blue-900">View</a>
                    <a href="/crm/accounts/{account.id}/edit" class="text-gray-600 hover:text-gray-900">Edit</a>
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <!-- Pagination (if needed) -->
      <div class="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
        <div class="flex items-center justify-between">
          <div class="flex-1 flex justify-between sm:hidden">
            <button
              on:click={() => { if (currentPage > 1) { currentPage--; loadAccounts(); } }}
              disabled={currentPage <= 1}
              class="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              on:click={() => { if (accounts.length === pageSize) { currentPage++; loadAccounts(); } }}
              disabled={accounts.length < pageSize}
              class="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
          <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p class="text-sm text-gray-700">
                Showing page <span class="font-medium">{currentPage}</span>
                {#if accounts.length > 0}
                  - {accounts.length} results
                {/if}
              </p>
            </div>
            <div>
              <nav class="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <button
                  on:click={() => { if (currentPage > 1) { currentPage--; loadAccounts(); } }}
                  disabled={currentPage <= 1}
                  class="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  on:click={() => { if (accounts.length === pageSize) { currentPage++; loadAccounts(); } }}
                  disabled={accounts.length < pageSize}
                  class="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>
