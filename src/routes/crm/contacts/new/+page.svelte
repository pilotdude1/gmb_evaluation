<script lang="ts">
  import { goto } from '$app/navigation';
</script>

<svelte:head>
  <title>New Contact - CRM</title>
  <meta name="description" content="Create a new contact" />
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
            <a href="/crm/contacts" class="ml-4 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">Contacts</a>
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
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Create New Contact</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">Add a new contact to your CRM</p>
    </div>
  </div>

  <!-- Coming Soon Notice -->
  <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-8 text-center">
    <div class="text-green-500 mb-4 text-4xl">👤</div>
    <h2 class="text-xl font-semibold text-green-900 dark:text-green-300 mb-2">Contact Creation Form Coming Soon</h2>
    <p class="text-green-700 dark:text-green-400 mb-6">
      The contact creation form is currently under development. When available, you'll be able to:
    </p>
    
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 text-left max-w-2xl mx-auto">
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">📝 Personal Information</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Name, email, phone, and job details</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">🏢 Account Association</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Link contacts to business accounts</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">🎯 Lead Information</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Source, status, and scoring</p>
      </div>
      <div class="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
        <h3 class="font-medium text-gray-900 dark:text-white mb-2">⚙️ Custom Fields</h3>
        <p class="text-sm text-gray-600 dark:text-gray-300">Industry-specific data fields</p>
      </div>
    </div>

    <div class="flex justify-center space-x-4">
      <button
        on:click={() => goto('/crm/contacts')}
        class="inline-flex items-center px-4 py-2 border border-green-300 dark:border-green-600 rounded-md shadow-sm text-sm font-medium text-green-700 dark:text-green-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
      >
        ← Back to Contacts
      </button>
      <button
        on:click={() => goto('/crm/accounts/new')}
        class="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
      >
        Create Account Instead
      </button>
    </div>
  </div>
</div>
