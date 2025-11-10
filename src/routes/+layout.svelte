<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.png';
	import { ModeWatcher } from 'mode-watcher';
	import { Toaster } from '$lib/components/ui/sonner';

	let { children } = $props();
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
