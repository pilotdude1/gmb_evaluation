<script lang="ts">
	import { onMount } from 'svelte';
	import { canInstallPWA, getInstallPrompt, installPWA } from '$lib/pwa';

	interface BeforeInstallPromptEvent extends Event {
		readonly platforms: string[];
		readonly userChoice: Promise<{
			outcome: 'accepted' | 'dismissed';
			platform: string;
		}>;
		prompt(): Promise<void>;
	}

	let showInstallPrompt = false;
	let installPromptEvent: BeforeInstallPromptEvent | null = null;

	onMount(() => {
		// Check if PWA can be installed
		if (canInstallPWA()) {
			getInstallPrompt().then((prompt) => {
				if (prompt) {
					installPromptEvent = prompt;
					showInstallPrompt = true;
				}
			});
		}
	});

	function handleInstall(): void {
		if (installPromptEvent) {
			installPWA().then(() => {
				showInstallPrompt = false;
				installPromptEvent = null;
			});
		}
	}

	function dismissInstall(): void {
		showInstallPrompt = false;
		installPromptEvent = null;
	}
</script>

{#if showInstallPrompt}
	<div class="fixed bottom-4 right-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4 max-w-sm z-50">
		<div class="flex items-start space-x-3">
			<div class="flex-shrink-0">
				<svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"></path>
				</svg>
			</div>
			<div class="flex-1 min-w-0">
				<p class="text-sm font-medium text-gray-900 dark:text-gray-100">
					Install LocalSocialMax
				</p>
				<p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
					Install this app on your device for quick and easy access when you're on the go.
				</p>
			</div>
			<button
				on:click={dismissInstall}
				class="flex-shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
				aria-label="Dismiss install prompt"
			>
				<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
				</svg>
			</button>
		</div>
		<div class="mt-3 flex space-x-2">
			<button
				on:click={handleInstall}
				class="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-md transition-colors"
			>
				Install
			</button>
			<button
				on:click={dismissInstall}
				class="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium py-2 px-3 rounded-md transition-colors"
			>
				Not now
			</button>
		</div>
	</div>
{/if} 