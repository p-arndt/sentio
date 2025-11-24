<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import favicon from '$lib/assets/favicon.png';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import { initializeNotifications } from '$lib/client/notifications';
	import { isBackendConfigured } from '$lib/client/config';

	let { children } = $props();

	onMount(async () => {
		// Check if we're in Tauri and if backend is configured
		if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
			const configured = await isBackendConfigured();
			const currentPath = window.location.pathname;
			
			// Only redirect if not already on setup page
			if (!configured && currentPath !== '/setup') {
				goto('/setup');
				return;
			}
		}

		try {
			await initializeNotifications();
		} catch (error) {
			console.warn('[App] Failed to initialize notifications:', error);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Sentio</title>
</svelte:head>

<Toaster position="top-center" />
<ModeWatcher />
<div class="min-h-screen bg-background text-foreground">
	{@render children()}
</div>
