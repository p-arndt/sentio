<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	type Props = {
		title: string;
		description?: string;
		value: string | number;
		badge?: {
			text: string;
			variant?: 'default' | 'destructive' | 'secondary';
		};
		context?: string;
	};

	let { title, description, value, badge, context }:Props = $props();
</script>

<Card>
	<CardHeader class="pb-2">
		<CardTitle class="text-sm font-medium text-muted-foreground">{title}</CardTitle>
		{#if description}
			<CardDescription class="text-xs">{description}</CardDescription>
		{/if}
	</CardHeader>
	<CardContent>
		<div class="flex items-baseline gap-2">
			<span class="text-2xl font-bold">{value}</span>
			{#if badge}
				<Badge variant={badge.variant || 'default'}>
					{badge.text}
				</Badge>
			{/if}
		</div>
		{#if context}
			<p class="text-muted-foreground text-xs mt-1">{context}</p>
		{/if}
	</CardContent>
</Card>
