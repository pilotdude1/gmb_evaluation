<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>CRM Contacts</title>
  <meta name="description" content="Manage your contacts and leads" />
</svelte:head>

<div class="px-4 sm:px-6 lg:px-8">
  <!-- Page Header -->
  <div class="sm:flex sm:items-center sm:justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Contacts</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">Manage your contacts and leads</p>
    </div>
    <div class="mt-4 sm:mt-0">
      <button
        on:click={() => goto('/crm/contacts/new')}
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
      >
        <span class="mr-2">+</span>
        Add Contact
      </button>
    </div>
  </div>

  <!-- Coming Soon Notice -->
  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-8 text-center">
    <div class="text-blue-500 mb-4 text-4xl">👥</div>
    <h2 class="text-xl font-semibold text-blue-900 dark:text-blue-300 mb-2">Contacts Management Coming Soon</h2>
    <p class="text-blue-700 dark:text-blue-400 mb-6">
      The contacts interface is currently under development. This page will include:
    </p>
    
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6 text-left">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">📝 Contact Management</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Add, edit, and organize contact information</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">🎯 Lead Tracking</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Track lead status and qualification</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">📊 Interaction History</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">View complete interaction timeline</p>
      </div>
    </div>

    <div class="flex justify-center space-x-4">
      <button
        on:click={() => goto('/crm')}
        class="inline-flex items-center px-4 py-2 border border-blue-300 dark:border-blue-600 rounded-md shadow-sm text-sm font-medium text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        ← Back to Dashboard
      </button>
      <button
        on:click={() => goto('/crm/accounts')}
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        View Accounts Instead
      </button>
    </div>
  </div>
</div>
