<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import { isOnline, addOnlineStatusListener } from '$lib/pwa';

	let online = isOnline();
	let cleanup: (() => void) | null = null;

	onMount(() => {
		cleanup = addOnlineStatusListener((status: boolean) => {
			online = status;
		});
	});

	onDestroy(() => {
		if (cleanup) {
			cleanup();
		}
	});
</script>

{#if !online}
	<div class="fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-md shadow-lg z-50 flex items-center space-x-2">
		<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M12 2.25a9.75 9.75 0 100 19.5 9.75 9.75 0 000-19.5z"></path>
		</svg>
		<span class="text-sm font-medium">You're offline</span>
	</div>
{/if} 