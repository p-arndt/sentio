<script lang="ts">
	import '../app.css';
	import { onMount } from 'svelte';
	import favicon from '$lib/assets/favicon.png';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';
	import { initializeNotifications } from '$lib/client/notifications';

	let { children } = $props();

	onMount(async () => {
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
