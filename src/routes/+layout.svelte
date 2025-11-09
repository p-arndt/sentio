<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.png';
	import { ModeWatcher } from 'mode-watcher';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Sentio</title>
</svelte:head>

<ModeWatcher />
<div class="min-h-screen bg-background text-foreground">
	{@render children()}
</div>
