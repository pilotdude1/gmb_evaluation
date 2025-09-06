<script lang="ts">
  import { theme } from '$lib/hooks/theme';
  import { get } from 'svelte/store';
  let currentTheme: 'light' | 'dark' = get(theme);

  const unsubscribe = theme.subscribe((val) => currentTheme = val);
  function toggleTheme() {
    theme.set(currentTheme === 'light' ? 'dark' : 'light');
  }
  // Clean up subscription if needed
  // onDestroy(() => unsubscribe());
</script>

<button
  class="p-2 rounded border"
  on:click={toggleTheme}
  aria-label="Toggle dark mode"
>
  {#if currentTheme === 'dark'}
    🌙 Dark
  {:else}
    ☀️ Light
  {/if}
</button> 