<script lang="ts">
  import { supabase } from '$lib/supabaseClient';
  import { onMount } from 'svelte';

  let result: any = null;
  let error: any = null;

  onMount(async () => {
    // Fetch all profiles from the 'profiles' table
    const { data, error: err } = await supabase.from('profiles').select('*');
    result = data;
    error = err;
    console.log('Supabase test:', { data, err });
  });
</script>

<h1>Supabase Test</h1>
{#if error}
  <p class="text-red-600">Error: {error.message}</p>
{:else if result}
  <pre>{JSON.stringify(result, null, 2)}</pre>
{:else}
  <p>Loading...</p>
{/if} 