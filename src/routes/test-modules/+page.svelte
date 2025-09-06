<script lang="ts">
	import { onMount } from 'svelte';
	import { moduleSystem, modulesStore, enabledModulesStore } from '$lib/modules';

	let isLoaded = false;
	let stats: any = null;
	let modules: any[] = [];
	let enabledModules: any[] = [];

	onMount(async () => {
		try {
			// Initialize the module system
			await moduleSystem.initialize();
			isLoaded = true;

			// Get initial stats
			stats = moduleSystem.getStats();

			// Subscribe to stores
			const unsubscribeModules = modulesStore.subscribe((value) => {
				modules = value;
			});

			const unsubscribeEnabled = enabledModulesStore.subscribe((value) => {
				enabledModules = value;
			});

			// Load a test module
			await moduleSystem.loadModule('auth');

			// Update stats
			stats = moduleSystem.getStats();

			return () => {
				unsubscribeModules();
				unsubscribeEnabled();
			};
		} catch (error) {
			console.error('Failed to initialize module system:', error);
		}
	});

	async function loadTestModule() {
		try {
			await moduleSystem.loadModule('users');
			stats = moduleSystem.getStats();
		} catch (error) {
			console.error('Failed to load test module:', error);
		}
	}

	async function enableAuthModule() {
		try {
			await moduleSystem.enableModule('auth');
			stats = moduleSystem.getStats();
		} catch (error) {
			console.error('Failed to enable auth module:', error);
		}
	}

	async function disableAuthModule() {
		try {
			await moduleSystem.disableModule('auth');
			stats = moduleSystem.getStats();
		} catch (error) {
			console.error('Failed to disable auth module:', error);
		}
	}
</script>

<svelte:head>
	<title>Module System Test</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
	<h1 class="text-3xl font-bold mb-8">Module System Test</h1>

	{#if !isLoaded}
		<div class="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
			Loading module system...
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
			<!-- Module System Status -->
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Module System Status</h2>
				
				{#if stats}
					<div class="space-y-3">
						<div class="flex justify-between">
							<span class="font-medium">Registry:</span>
							<span class="text-sm">
								{stats.registry.totalModules} total, 
								{stats.registry.enabledModules} enabled, 
								{stats.registry.disabledModules} disabled, 
								{stats.registry.errorModules} errors
							</span>
						</div>
						<div class="flex justify-between">
							<span class="font-medium">Loader:</span>
							<span class="text-sm">
								{stats.loader.loadedModules} loaded, 
								{stats.loader.cachedModules} cached
							</span>
						</div>
						<div class="flex justify-between">
							<span class="font-medium">Router:</span>
							<span class="text-sm">
								{stats.router.totalRoutes} routes, 
								{stats.router.totalMiddleware} middleware
							</span>
						</div>
					</div>
				{/if}
			</div>

			<!-- Module Actions -->
			<div class="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
				<h2 class="text-xl font-semibold mb-4">Module Actions</h2>
				
				<div class="space-y-3">
					<button
						on:click={loadTestModule}
						class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
					>
						Load Users Module
					</button>
					
					<button
						on:click={enableAuthModule}
						class="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors"
					>
						Enable Auth Module
					</button>
					
					<button
						on:click={disableAuthModule}
						class="w-full bg-red-600 hover:bg-red-700 text-white font-medium py-2 px-4 rounded transition-colors"
					>
						Disable Auth Module
					</button>
				</div>
			</div>
		</div>

		<!-- Loaded Modules -->
		<div class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h2 class="text-xl font-semibold mb-4">Loaded Modules ({modules.length})</h2>
			
			{#if modules.length === 0}
				<p class="text-gray-500">No modules loaded yet.</p>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each modules as module}
						<div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<h3 class="font-semibold">{module.metadata.name}</h3>
								<span class="text-xs px-2 py-1 rounded-full {module.config.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
									{module.status}
								</span>
							</div>
							<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
								{module.metadata.description}
							</p>
							<div class="text-xs text-gray-500">
								Version: {module.metadata.version} | Category: {module.metadata.category}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Enabled Modules -->
		<div class="mt-8 bg-white dark:bg-gray-800 rounded-lg shadow p-6">
			<h2 class="text-xl font-semibold mb-4">Enabled Modules ({enabledModules.length})</h2>
			
			{#if enabledModules.length === 0}
				<p class="text-gray-500">No modules enabled yet.</p>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{#each enabledModules as module}
						<div class="border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-700 rounded-lg p-4">
							<div class="flex items-center justify-between mb-2">
								<h3 class="font-semibold">{module.metadata.name}</h3>
								<span class="text-xs px-2 py-1 rounded-full bg-green-100 text-green-800">
									{module.status}
								</span>
							</div>
							<p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
								{module.metadata.description}
							</p>
							<div class="text-xs text-gray-500">
								Version: {module.metadata.version} | Category: {module.metadata.category}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
