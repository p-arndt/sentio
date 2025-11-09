<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { isToday, formatDate } from '$lib/utils/date';
	type Props = { date: Date };
	let { date }: Props = $props();
	let today = $derived(isToday(date));
	let label = $derived(formatDate(date, { weekday: 'short' }));
	let sub = $derived(formatDate(date, { month: 'short', day: 'numeric' }));
</script>

<div class="text-center">
	<div class="text-sm font-semibold" class:text-primary={today}>{label}</div>
	<div class="text-xs text-muted-foreground" class:text-primary={today}>{sub}</div>
	{#if today}
		<Badge variant="outline" class="mt-1 text-xs">Today</Badge>
	{/if}
</div>
