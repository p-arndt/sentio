<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	type Props = { title: string; value: string | number; subtitle?: string; icon?: any };
	let { title, value, subtitle, icon: Icon }: Props = $props();
</script>

<Card>
	<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
		<CardTitle class="text-sm font-medium">{title}</CardTitle>
		{#if Icon}
			<Icon class="h-4 w-4 text-muted-foreground" />
		{/if}
	</CardHeader>
	<CardContent>
		<div class="text-2xl font-bold">{value}</div>
		{#if subtitle}
			<p class="text-xs text-muted-foreground">{subtitle}</p>
		{/if}
	</CardContent>
</Card>
