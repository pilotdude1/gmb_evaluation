<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>New Deal - CRM</title>
  <meta name="description" content="Create a new deal" />
</svelte:head>

<div class="px-4 sm:px-6 lg:px-8">
  <!-- Page Header -->
  <div class="mb-8">
    <nav class="flex" aria-label="Breadcrumb">
      <ol class="flex items-center space-x-4">
        <li>
          <a href="/crm" class="text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">CRM</a>
        </li>
        <li>
          <div class="flex items-center">
            <span class="text-gray-400 dark:text-gray-500">/</span>
            <a href="/crm/deals" class="ml-4 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">Deals</a>
          </div>
        </li>
        <li>
          <div class="flex items-center">
            <span class="text-gray-400 dark:text-gray-500">/</span>
            <span class="ml-4 text-gray-500 dark:text-gray-400">New</span>
          </div>
        </li>
      </ol>
    </nav>
    
    <div class="mt-4">
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Create New Deal</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">Add a new opportunity to your sales pipeline</p>
    </div>
  </div>

  <!-- Coming Soon Notice -->
  <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-8 text-center">
    <div class="text-purple-500 mb-4 text-4xl">💼</div>
    <h2 class="text-xl font-semibold text-purple-900 dark:text-purple-300 mb-2">Deal Creation Form Coming Soon</h2>
    <p class="text-purple-700 dark:text-purple-400 mb-6">
      The deal creation form is currently under development. When available, you'll be able to:
    </p>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left max-w-2xl mx-auto">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">📋 Deal Details</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Name, description, and value</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">🎯 Pipeline Stage</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Current stage and probability</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">🏢 Account & Contact</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Link to existing accounts and contacts</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">📅 Timeline</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Expected and actual close dates</p>
      </div>
    </div>

    <div class="flex justify-center space-x-4">
      <button
        on:click={() => goto('/crm/deals')}
        class="inline-flex items-center px-4 py-2 border border-purple-300 dark:border-purple-600 rounded-md shadow-sm text-sm font-medium text-purple-700 dark:text-purple-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
      >
        ← Back to Deals
      </button>
      <button
        on:click={() => goto('/crm/accounts/new')}
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors duration-200"
      >
        Create Account Instead
      </button>
    </div>
  </div>
</div>
