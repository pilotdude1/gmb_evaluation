<script lang="ts">
	import { onMount } from 'svelte';

	let testStatus: string[] = [];
	let counter = 0;

	onMount(() => {
		testStatus.push('✅ onMount executed successfully');
		testStatus.push('✅ Svelte functionality working');
	});

	function incrementCounter() {
		counter++;
		testStatus.push(`Counter incremented to: ${counter}`);
	}
</script>

<svelte:head>
	<title>Basic Test</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">Basic Svelte Test</h1>
	
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
		<h2 class="text-xl font-semibold mb-4">Test Status</h2>
		<div class="space-y-2">
			{#each testStatus as status}
				<div class="text-sm font-mono bg-gray-100 dark:bg-gray-700 p-2 rounded">
					{status}
				</div>
			{/each}
		</div>
	</div>
	
	<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
		<h2 class="text-xl font-semibold mb-4">Interactive Test</h2>
		<div class="space-y-4">
			<div>
				<button 
					on:click={incrementCounter}
					class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
				>
					Increment Counter
				</button>
			</div>
			<div>
				<p class="text-lg">Counter: <span class="font-bold">{counter}</span></p>
			</div>
		</div>
	</div>
</div>
