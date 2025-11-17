<script lang="ts">
	let {
		version
	}: {
		version: string;
	} = $props();
</script>

<div class="text-sm text-muted-foreground" aria-live="polite">
	<span class="font-medium">Sentio</span>
	<span class="ml-2 opacity-80">v{version}</span>
</div>
