<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>CRM Deals</title>
  <meta name="description" content="Manage your sales pipeline and deals" />
</svelte:head>

<div class="px-4 sm:px-6 lg:px-8">
  <!-- Page Header -->
  <div class="sm:flex sm:items-center sm:justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Deals</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">Manage your sales pipeline and opportunities</p>
    </div>
    <div class="mt-4 sm:mt-0">
      <button
        on:click={() => goto('/crm/deals/new')}
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
      >
        <span class="mr-2">+</span>
        Create Deal
      </button>
    </div>
  </div>

  <!-- Coming Soon Notice -->
  <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8 text-center">
    <div class="text-purple-500 mb-4 text-4xl">💼</div>
    <h2 class="text-xl font-semibold text-purple-900 dark:text-purple-300 mb-2">Sales Pipeline Coming Soon</h2>
    <p class="text-purple-700 dark:text-purple-400 mb-6">
      The deals and pipeline management interface is currently under development. This page will include:
    </p>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 text-left">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">🎯 Pipeline Management</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Visual sales pipeline with drag-and-drop</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">💰 Deal Tracking</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Track deal values, probabilities, and stages</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">📈 Sales Analytics</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Revenue forecasting and performance metrics</p>
      </div>
    </div>

    <div class="flex justify-center space-x-4">
      <button
        on:click={() => goto('/crm')}
        class="inline-flex items-center px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm text-sm font-medium text-purple-700 dark:text-purple-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
      >
        ← Back to Dashboard
      </button>
      <button
        on:click={() => goto('/crm/accounts')}
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
      >
        View Accounts Instead
      </button>
    </div>
  </div>
</div>
