<script lang="ts">
	import { onMount } from 'svelte';

	let debugLog: string[] = [];
	let buttonClicked = false;

	onMount(() => {
		debugLog.push('✅ onMount executed');
		console.log('Debug: onMount executed');
	});

	function handleClick() {
		buttonClicked = true;
		debugLog.push('✅ Button clicked');
		console.log('Debug: Button clicked');
	}
</script>

<svelte:head>
	<title>Debug Test</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">Debug Test</h1>
	
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Debug Log</h2>
		<div class="space-y-2">
			{#each debugLog as log}
				<div class="text-sm font-mono bg-green-100 dark:bg-green-900 p-2 rounded">
					{log}
				</div>
			{/each}
		</div>
	</div>
	
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
		<h2 class="text-xl font-semibold mb-4">Interactive Test</h2>
		<div class="space-y-4">
			<button 
				on:click={handleClick}
				class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
			>
				Test Button
			</button>
			
			<div>
				<p class="text-lg">Button clicked: <span class="font-bold">{buttonClicked ? 'Yes' : 'No'}</span></p>
			</div>
		</div>
	</div>
</div>
