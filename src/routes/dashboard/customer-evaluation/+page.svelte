<script lang="ts">
  import { onMount } from 'svelte';
  import { supabase } from '$lib/supabaseClient';
  import { goto } from '$app/navigation';
  import type { User } from '@supabase/supabase-js';
  
  let user: User | null = null;
  let isLoading = true;

  // Form state
  let formData = {
    marketVertical: '',
    subCategory: '',
    city: 'Phoenix',
    state: 'AZ',
    radius: 25,
    minReviews: 25,
    minRating: 4.0,
    recentPosts: true,
    hasWebsite: true,
    hasPhotos: false,
    respondsReviews: false,
    excludeClosed: true,
    excludeChains: false,
    excludeExisting: false,
    batchSize: 50,
    campaignEnabled: false,
    campaignName: '',
    savedTemplate: ''
  };

  // Progress state
  let isSearching = false;
  let currentStep = 0;
  let foundCount = 0;
  let searchResults = [];

  // Market vertical subcategories
  const subCategories = {
    restaurant: ['Italian', 'Mexican', 'Chinese', 'Fast Food', 'Fine Dining', 'Cafes', 'Bakery', 'Pizza', 'Steakhouse', 'Seafood'],
    contractor: ['Plumbing', 'Electrical', 'HVAC', 'Roofing', 'Flooring', 'Painting', 'Landscaping', 'Handyman', 'Solar', 'Windows'],
    petcare: ['Veterinary', 'Pet Grooming', 'Pet Boarding', 'Dog Training', 'Pet Sitting', 'Pet Supplies', 'Animal Hospital'],
    landscape: ['Lawn Care', 'Tree Service', 'Irrigation', 'Garden Design', 'Pest Control', 'Snow Removal', 'Hardscaping'],
    events: ['Wedding Planning', 'Corporate Events', 'Party Planning', 'Catering', 'Event Venues', 'Entertainment'],
    professional: ['Legal Services', 'Accounting', 'Real Estate', 'Insurance', 'Financial Planning', 'Consulting', 'Medical', 'Dental']
  };

  // Reactive estimates
  $: estimates = getEstimates(formData.batchSize);

  function getEstimates(batchSize: number) {
    const estimateData = {
      25: { time: '2-3 minutes', cost: '$1.25', results: '18-22 qualified businesses' },
      50: { time: '3-5 minutes', cost: '$2.50', results: '35-45 qualified businesses' },
      75: { time: '5-7 minutes', cost: '$3.75', results: '52-68 qualified businesses' },
      100: { time: '7-10 minutes', cost: '$5.00', results: '70-85 qualified businesses' }
    };
    return estimateData[batchSize] || estimateData[50];
  }

  function updateSubCategories() {
    formData.subCategory = '';
  }

  function previewSearch() {
    const searchParams = {
      market: formData.marketVertical,
      location: `${formData.city}, ${formData.state}`,
      batchSize: formData.batchSize,
      minReviews: formData.minReviews,
      minRating: formData.minRating
    };
    
    alert(`🔍 Search Preview:\n\n` + 
          `Market: ${searchParams.market || 'Not selected'}\n` +
          `Location: ${searchParams.location}\n` +
          `Batch Size: ${searchParams.batchSize}\n` +
          `Min Reviews: ${searchParams.minReviews}+\n` +
          `Min Rating: ${searchParams.minRating}+ stars\n\n` +
          'This preview shows what would be sent to your n8n workflow.');
  }

  async function startSearch() {
    isSearching = true;
    currentStep = 0;
    foundCount = 0;
    
    // Simulate the progress steps
    await simulateProgress();
  }

  async function simulateProgress() {
    const steps = [
      'Initializing search parameters',
      'Connecting to Apify GMB scraper', 
      'Scraping business data',
      'Processing & quality scoring',
      'Storing in Supabase',
      'Triggering follow-up workflows'
    ];
    
    for (let i = 0; i < steps.length; i++) {
      currentStep = i;
      
      // Special handling for step 3 (scraping) to show counter
      if (i === 2) {
        let count = 0;
        const targetCount = formData.batchSize;
        
        while (count < targetCount) {
          await new Promise(resolve => setTimeout(resolve, 200));
          count += Math.floor(Math.random() * 5) + 1;
          if (count > targetCount) count = targetCount;
          foundCount = count;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else {
        await new Promise(resolve => setTimeout(resolve, i === 0 ? 1000 : 2000));
      }
    }
    
    // Complete
    currentStep = steps.length;
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    alert(`🎉 Search Complete!\n\n` +
          `✅ Found ${foundCount} businesses\n` +
          `✅ Data stored in Supabase\n` +
          `✅ ClickUp tasks created\n` +
          `✅ Agile CRM leads updated\n\n` +
          'Check your dashboard for detailed results!');
    
    isSearching = false;
  }

  onMount(() => {
    console.log('Customer Evaluation page onMount started');
    
    // Check if user is authenticated
    const checkAuth = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Customer Evaluation session check result:', { session: !!session, error: sessionError });
      
      if (!session) {
        console.log('No session found, redirecting to login');
        goto('/');
        return;
      }
      
      console.log('Session found, user:', session.user.email);
      user = session.user;
      isLoading = false;
    };
    
    checkAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Customer Evaluation auth state change:', event, session?.user?.email);
        
        if (event === 'SIGNED_OUT') {
          console.log('User signed out, redirecting to login');
          goto('/');
        }
      }
    );
    
    // Cleanup subscription on component destroy
    return () => subscription.unsubscribe();
  });
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
        <p class="mt-4 text-gray-600 dark:text-gray-300">Loading Customer Evaluation System...</p>
      </div>
    </div>
  {:else if user}
    <!-- Customer Evaluation Content -->
    <div class="container mx-auto px-4 py-8">
      <!-- Header -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <a href="/dashboard" class="text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 mb-2 inline-flex items-center">
            <svg class="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
            </svg>
            Back to Dashboard
          </a>
          <h1 class="text-4xl font-bold text-gray-900 dark:text-gray-100">🎯 Customer Evaluation System</h1>
          <p class="text-gray-600 dark:text-gray-300">Intelligent Google My Business data collection for lead qualification</p>
        </div>
      </div>

      <form class="space-y-8">
        <!-- Market Vertical Selection -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div class="flex items-center mb-6">
            <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">1</div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Market Vertical Selection</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label for="marketVertical" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Primary Market Vertical</label>
              <select bind:value={formData.marketVertical} on:change={updateSubCategories} id="marketVertical" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100">
                <option value="">Select Market Vertical</option>
                <option value="restaurant">Restaurants & Food Service</option>
                <option value="contractor">Service Contractors</option>
                <option value="petcare">Pet Care Services</option>
                <option value="landscape">Lawn & Landscape</option>
                <option value="events">Event Planning</option>
                <option value="professional">Professional Services</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label for="subCategory" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sub-Category</label>
              <select bind:value={formData.subCategory} id="subCategory" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100">
                <option value="">Select primary vertical first</option>
                {#if formData.marketVertical && subCategories[formData.marketVertical]}
                  {#each subCategories[formData.marketVertical] as sub}
                    <option value={sub.toLowerCase().replace(/\s+/g, '_')}>{sub}</option>
                  {/each}
                {/if}
              </select>
            </div>
          </div>
        </div>

        <!-- Geographic Targeting -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div class="flex items-center mb-6">
            <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">2</div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Geographic Targeting</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label for="city" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
              <input bind:value={formData.city} type="text" id="city" placeholder="e.g., Phoenix" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100">
            </div>
            <div>
              <label for="state" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">State</label>
              <select bind:value={formData.state} id="state" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100">
                <option value="AZ">Arizona</option>
                <option value="CA">California</option>
                <option value="TX">Texas</option>
                <option value="FL">Florida</option>
                <option value="NY">New York</option>
                <option value="OTHER">Other...</option>
              </select>
            </div>
            <div>
              <label for="radius" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search Radius (miles)</label>
              <select bind:value={formData.radius} id="radius" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100">
                <option value={5}>5 miles</option>
                <option value={10}>10 miles</option>
                <option value={25}>25 miles</option>
                <option value={50}>50 miles</option>
                <option value={100}>100 miles</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Business Quality Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div class="flex items-center mb-6">
            <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">3</div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Business Quality Filters</h2>
          </div>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label for="minReviews" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum Review Count</label>
              <select bind:value={formData.minReviews} id="minReviews" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100">
                <option value={1}>1+ reviews</option>
                <option value={5}>5+ reviews</option>
                <option value={10}>10+ reviews</option>
                <option value={25}>25+ reviews</option>
                <option value={50}>50+ reviews</option>
                <option value={100}>100+ reviews</option>
              </select>
            </div>
            <div>
              <label for="minRating" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum Rating</label>
              <select bind:value={formData.minRating} id="minRating" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100">
                <option value={3.0}>3.0+ stars</option>
                <option value={3.5}>3.5+ stars</option>
                <option value={4.0}>4.0+ stars</option>
                <option value={4.5}>4.5+ stars</option>
              </select>
            </div>
          </div>
          
          <div class="space-y-4">
            <h3 class="font-medium text-gray-900 dark:text-gray-100">Activity & Engagement Filters</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="flex items-center space-x-3 cursor-pointer">
                <input bind:checked={formData.recentPosts} type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-gray-700 dark:text-gray-300">Recent GMB posts/updates</span>
              </label>
              <label class="flex items-center space-x-3 cursor-pointer">
                <input bind:checked={formData.hasWebsite} type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-gray-700 dark:text-gray-300">Has business website</span>
              </label>
              <label class="flex items-center space-x-3 cursor-pointer">
                <input bind:checked={formData.hasPhotos} type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-gray-700 dark:text-gray-300">Has recent photos</span>
              </label>
              <label class="flex items-center space-x-3 cursor-pointer">
                <input bind:checked={formData.respondsReviews} type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-gray-700 dark:text-gray-300">Responds to reviews</span>
              </label>
            </div>

            <h3 class="font-medium text-gray-900 dark:text-gray-100 mt-6">Exclusion Filters</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="flex items-center space-x-3 cursor-pointer">
                <input bind:checked={formData.excludeClosed} type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-gray-700 dark:text-gray-300">Skip closed businesses</span>
              </label>
              <label class="flex items-center space-x-3 cursor-pointer">
                <input bind:checked={formData.excludeChains} type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-gray-700 dark:text-gray-300">Skip franchises/chains</span>
              </label>
              <label class="flex items-center space-x-3 cursor-pointer">
                <input bind:checked={formData.excludeExisting} type="checkbox" class="rounded border-gray-300 text-blue-600 focus:ring-blue-500">
                <span class="text-gray-700 dark:text-gray-300">Skip existing customers</span>
              </label>
            </div>
          </div>
        </div>

        <!-- Batch & Processing Settings -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div class="flex items-center mb-6">
            <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">4</div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Batch & Processing Settings</h2>
          </div>
          <div class="space-y-6">
            <h3 class="font-medium text-gray-900 dark:text-gray-100">Select Batch Size</h3>
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              {#each [25, 50, 75, 100] as size, index}
                <label class="cursor-pointer">
                  <input bind:group={formData.batchSize} type="radio" value={size} class="sr-only">
                  <div class="p-4 border-2 rounded-lg text-center transition-all {formData.batchSize === size ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'}">
                    <div class="text-2xl font-bold text-gray-900 dark:text-gray-100">{size}</div>
                    <div class="text-sm text-gray-600 dark:text-gray-400">
                      {#if size === 25}Quick scan
                      {:else if size === 50}Standard search
                      {:else if size === 75}Comprehensive
                      {:else}Deep analysis{/if}
                    </div>
                  </div>
                </label>
              {/each}
            </div>

            <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <h4 class="font-medium text-yellow-800 dark:text-yellow-200 mb-2">📊 Estimated Processing Info</h4>
              <div class="text-sm text-yellow-700 dark:text-yellow-300 space-y-1">
                <p><strong>Estimated time:</strong> {estimates.time}</p>
                <p><strong>API cost:</strong> {estimates.cost}</p>
                <p><strong>Expected results:</strong> {estimates.results}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Campaign Management -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div class="flex items-center mb-6">
            <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">5</div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Campaign Management</h2>
          </div>
          
          <div class="flex items-center space-x-4 mb-6">
            <label class="relative inline-flex items-center cursor-pointer">
              <input bind:checked={formData.campaignEnabled} type="checkbox" class="sr-only peer">
              <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
            </label>
            <div>
              <div class="font-medium text-gray-900 dark:text-gray-100">Save as Campaign Template</div>
              <div class="text-sm text-gray-600 dark:text-gray-400">Enable to save these settings for future use or scheduling</div>
            </div>
          </div>

          {#if formData.campaignEnabled}
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label for="campaignName" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Campaign Name</label>
                <input bind:value={formData.campaignName} type="text" id="campaignName" placeholder="e.g., Phoenix Restaurants Q1 2025" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100">
              </div>
              <div>
                <label for="savedTemplate" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Or Load Saved Template</label>
                <select bind:value={formData.savedTemplate} id="savedTemplate" class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100">
                  <option value="">Select a saved template</option>
                  <option value="template1">Phoenix Contractors - Standard</option>
                  <option value="template2">Arizona Pet Care - Comprehensive</option>
                  <option value="template3">Southwest Restaurants - Quick</option>
                </select>
              </div>
            </div>
          {/if}
        </div>

        <!-- Action Buttons -->
        <div class="flex justify-center space-x-4">
          <button type="button" on:click={previewSearch} class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
            👁️ Preview Search
          </button>
          <button type="button" on:click={startSearch} disabled={isSearching} class="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors">
            {isSearching ? '⏳ Searching...' : '🚀 Start GMB Search'}
          </button>
        </div>
      </form>

      <!-- Real-time Progress Section -->
      {#if isSearching}
        <div class="mt-8 bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-6">
          <div class="flex items-center mb-6">
            <div class="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd" />
              </svg>
            </div>
            <h2 class="text-xl font-semibold text-gray-900 dark:text-gray-100">Real-time Processing Status</h2>
          </div>
          
          <div class="space-y-4">
            {#each ['Initializing search parameters', 'Connecting to Apify GMB scraper', 'Scraping business data', 'Processing & quality scoring', 'Storing in Supabase', 'Triggering follow-up workflows'] as step, index}
              <div class="flex items-center p-4 bg-white dark:bg-gray-800 rounded-lg {currentStep === index ? 'border-l-4 border-blue-500' : currentStep > index ? 'border-l-4 border-green-500' : ''}">
                <div class="w-10 h-10 rounded-full flex items-center justify-center mr-4 {currentStep === index ? 'bg-blue-500 text-white animate-pulse' : currentStep > index ? 'bg-green-500 text-white' : 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400'}">
                  {#if currentStep > index}
                    ✓
                  {:else if currentStep === index}
                    {index + 1}
                  {:else}
                    {index + 1}
                  {/if}
                </div>
                <div class="flex-1">
                  <h4 class="font-medium text-gray-900 dark:text-gray-100">{step}</h4>
                  {#if index === 2 && currentStep === index}
                    <p class="text-sm text-gray-600 dark:text-gray-400">Finding and extracting business information</p>
                  {/if}
                </div>
                {#if index === 2 && currentStep >= index}
                  <div class="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    {foundCount} found
                  </div>
                {/if}
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
  {/if}
</div>
