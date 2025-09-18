<script lang="ts">
  import { goto } from '$app/navigation';
  import { crmClient, type CRMAccountInsert } from '$lib/crm/crmClient';
  import { authUtils, supabase } from '$lib/supabaseClient';
  import { setupUserTenant, checkUserTenantSetup } from '$lib/crm/setupTenant';
  
  let loading = false;
  let error: string | null = null;
  let success = false;

  // Form data
  let formData: Partial<CRMAccountInsert> = {
    name: '',
    legal_name: '',
    website: '',
    phone: '',
    email: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: 'US',
    industry: '',
    business_type: 'prospect',
    employee_count_range: '',
    annual_revenue_range: '',
    lead_score: 0,
    qualification_status: 'unqualified',
    custom_fields: {}
  };

  // Form validation
  $: isValid = formData.name && formData.name.trim().length > 0;

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

  const employeeRanges = [
    '1-10',
    '11-50',
    '51-200',
    '201-500',
    '501-1000',
    '1000+'
  ];

  const revenueRanges = [
    'under_100k',
    '100k_500k',
    '500k_1m',
    '1m_5m',
    '5m_10m',
    '10m_plus'
  ];

  async function handleSubmit() {
    if (!isValid) return;
    
    loading = true;
    error = null;

    try {
      // Get current user for created_by field
      const user = await authUtils.getCurrentUser();
      if (!user) {
        error = 'You must be logged in to create an account';
        return;
      }

      // Get user's tenant_id from their profile (handle missing profile)
      let { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('current_tenant_id')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to handle no rows gracefully

      // If no profile exists, create one using secure function
      if (!userProfile && (!profileError || profileError.code === 'PGRST116')) {
        console.log('No user profile found, using secure setup...');
        
        try {
          console.log('Calling secure setup function for user:', user.id, user.email);
          
          // Use the secure setup function that bypasses RLS
          const { data: setupResult, error: setupError } = await supabase.rpc(
            'setup_user_tenant_secure',
            {
              user_id: user.id,
              user_email: user.email || '',
              tenant_name: null
            }
          );

          console.log('Setup function response:', { setupResult, setupError });

          if (setupError) {
            console.error('Setup function error:', setupError);
            throw setupError;
          }

          if (!setupResult || !setupResult.success) {
            console.error('Setup function failed:', setupResult);
            throw new Error(setupResult?.error || 'Setup failed for unknown reason');
          }

          console.log('Secure setup completed:', setupResult);

          // Use the tenant_id directly from the setup result
          if (setupResult.tenant_id) {
            userProfile = { current_tenant_id: setupResult.tenant_id };
            console.log('Using tenant_id from setup result:', setupResult.tenant_id);
          } else {
            // Fallback: try to refresh profile
            const { data: updatedProfile, error: refreshError } = await supabase
              .from('user_profiles')
              .select('current_tenant_id')
              .eq('id', user.id)
              .maybeSingle();
              
            if (refreshError) {
              console.error('Error refreshing profile:', refreshError);
              error = `Failed to refresh user profile: ${refreshError.message}`;
              return;
            }
            
            console.log('Updated profile after setup:', updatedProfile);
            userProfile = updatedProfile;
          }
          
        } catch (setupErr: any) {
          console.error('Error in secure setup:', setupErr);
          error = `Unable to set up user profile: ${setupErr.message}`;
          return;
        }
      } else if (profileError && profileError.code !== 'PGRST116') {
        console.error('Error fetching user profile:', profileError);
        error = `Unable to fetch user profile: ${profileError.message}`;
        return;
      }

      // Final validation - ensure we have a tenant_id
      if (!userProfile?.current_tenant_id) {
        error = 'Unable to determine your organization. Please try again or contact support.';
        return;
      }

      console.log('Creating account for tenant:', userProfile.current_tenant_id);

      // Add required fields including tenant_id
      const accountData: CRMAccountInsert = {
        ...formData,
        name: formData.name!,
        created_by: user.id,
        tenant_id: userProfile.current_tenant_id,
      };

      const { data, error: createError } = await crmClient.createAccount(accountData);
      
      if (createError) {
        throw createError;
      }

      success = true;
      
      // Redirect to the new account or accounts list after a delay
      setTimeout(() => {
        if (data?.id) {
          goto(`/crm/accounts/${data.id}`);
        } else {
          goto('/crm/accounts');
        }
      }, 1500);

    } catch (err) {
      console.error('Error creating account:', err);
      error = err instanceof Error ? err.message : 'Failed to create account';
    } finally {
      loading = false;
    }
  }

  function handleCancel() {
    goto('/crm/accounts');
  }
</script>

<svelte:head>
  <title>New Account - CRM</title>
  <meta name="description" content="Create a new business account" />
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
            <a href="/crm/accounts" class="ml-4 text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400">Accounts</a>
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
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Create New Account</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-300">Add a new business account to your CRM</p>
    </div>
  </div>

  {#if success}
    <!-- Success State -->
    <div class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-8">
      <div class="flex">
        <div class="flex-shrink-0">
          <span class="text-green-400">✅</span>
        </div>
        <div class="ml-3">
          <h3 class="text-sm font-medium text-green-800 dark:text-green-300">Success!</h3>
          <p class="text-sm text-green-700 dark:text-green-400 mt-1">Account created successfully. Redirecting...</p>
        </div>
      </div>
    </div>
  {:else}
    <!-- Form -->
    <form on:submit|preventDefault={handleSubmit} class="space-y-8">
      <!-- Error Message -->
      {#if error}
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div class="flex">
            <div class="flex-shrink-0">
              <span class="text-red-400">⚠️</span>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-red-800 dark:text-red-300">Error</h3>
              <p class="text-sm text-red-700 dark:text-red-400 mt-1">{error}</p>
            </div>
          </div>
        </div>
      {/if}

      <!-- Basic Information -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Basic Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Account Name (Required) -->
          <div class="md:col-span-1">
            <label for="name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Account Name *
            </label>
            <input
              id="name"
              type="text"
              bind:value={formData.name}
              required
              placeholder="Enter account name"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <!-- Legal Name -->
          <div class="md:col-span-1">
            <label for="legal_name" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Legal Name
            </label>
            <input
              id="legal_name"
              type="text"
              bind:value={formData.legal_name}
              placeholder="Legal business name"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <!-- Website -->
          <div class="md:col-span-1">
            <label for="website" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Website
            </label>
            <input
              id="website"
              type="url"
              bind:value={formData.website}
              placeholder="https://example.com"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <!-- Phone -->
          <div class="md:col-span-1">
            <label for="phone" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone
            </label>
            <input
              id="phone"
              type="tel"
              bind:value={formData.phone}
              placeholder="(555) 123-4567"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <!-- Email -->
          <div class="md:col-span-2">
            <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              bind:value={formData.email}
              placeholder="contact@example.com"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <!-- Address Information -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Address Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Address Line 1 -->
          <div class="md:col-span-2">
            <label for="address_line1" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address Line 1
            </label>
            <input
              id="address_line1"
              type="text"
              bind:value={formData.address_line1}
              placeholder="123 Main Street"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <!-- Address Line 2 -->
          <div class="md:col-span-2">
            <label for="address_line2" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Address Line 2
            </label>
            <input
              id="address_line2"
              type="text"
              bind:value={formData.address_line2}
              placeholder="Suite 100"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <!-- City -->
          <div class="md:col-span-1">
            <label for="city" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              City
            </label>
            <input
              id="city"
              type="text"
              bind:value={formData.city}
              placeholder="City"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <!-- State -->
          <div class="md:col-span-1">
            <label for="state" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              State
            </label>
            <input
              id="state"
              type="text"
              bind:value={formData.state}
              placeholder="State"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <!-- Postal Code -->
          <div class="md:col-span-1">
            <label for="postal_code" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Postal Code
            </label>
            <input
              id="postal_code"
              type="text"
              bind:value={formData.postal_code}
              placeholder="12345"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>

          <!-- Country -->
          <div class="md:col-span-1">
            <label for="country" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Country
            </label>
            <input
              id="country"
              type="text"
              bind:value={formData.country}
              placeholder="US"
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      <!-- Business Classification -->
      <div class="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 class="text-lg font-medium text-gray-900 dark:text-white mb-6">Business Classification</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Industry -->
          <div>
            <label for="industry" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Industry
            </label>
            <select
              id="industry"
              bind:value={formData.industry}
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select Industry</option>
              {#each industries as industry}
                <option value={industry}>{industry.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              {/each}
            </select>
          </div>

          <!-- Business Type -->
          <div>
            <label for="business_type" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Business Type
            </label>
            <select
              id="business_type"
              bind:value={formData.business_type}
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              {#each businessTypes as type}
                <option value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
              {/each}
            </select>
          </div>

          <!-- Employee Count -->
          <div>
            <label for="employee_count_range" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Employee Count
            </label>
            <select
              id="employee_count_range"
              bind:value={formData.employee_count_range}
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select Range</option>
              {#each employeeRanges as range}
                <option value={range}>{range}</option>
              {/each}
            </select>
          </div>

          <!-- Annual Revenue -->
          <div>
            <label for="annual_revenue_range" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Annual Revenue
            </label>
            <select
              id="annual_revenue_range"
              bind:value={formData.annual_revenue_range}
              class="block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select Range</option>
              {#each revenueRanges as range}
                <option value={range}>{range.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
              {/each}
            </select>
          </div>
        </div>
      </div>

      <!-- Form Actions -->
      <div class="flex justify-end space-x-4 pt-6">
        <button
          type="button"
          on:click={handleCancel}
          class="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!isValid || loading}
          class="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center"
        >
          {#if loading}
            <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {/if}
          {loading ? 'Creating...' : 'Create Account'}
        </button>
      </div>
    </form>
  {/if}
</div>
