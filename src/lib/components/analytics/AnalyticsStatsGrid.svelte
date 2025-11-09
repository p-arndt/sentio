<script lang="ts">
	import StatCard from './StatCard.svelte';
	import type { MoodEntry } from '$lib/types';

	type Props = {
		totalEntries: number;
		last30DaysCount: number;
		last7DaysCount: number;
		averageValence30Days: number;
		last30DaysEntries: MoodEntry[];
		additionalStats?: {
			label: string;
			value: string | number;
			description?: string;
			badge?: { text: string; variant?: 'default' | 'destructive' | 'secondary' };
			context?: string;
		}[];
	};

	let {
		totalEntries,
		last30DaysCount,
		last7DaysCount,
		averageValence30Days,
		last30DaysEntries,
		additionalStats = []
	} = $props();
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
	<StatCard
		title="Total Entries"
		description="All-time mood entries"
		value={totalEntries.toLocaleString()}
		context="Since creation"
	/>

	<StatCard
		title="Recent Activity"
		description="Last 30 days engagement"
		value={last30DaysCount}
		context="{last7DaysCount} entries in last 7 days"
	/>

	<StatCard
		title="Team Mood"
		description="Average emotional valence"
		value={averageValence30Days.toFixed(1)}
		badge={{
			text: averageValence30Days > 0 ? 'Positive' : averageValence30Days < 0 ? 'Negative' : 'Neutral',
			variant: averageValence30Days > 0 ? 'default' : averageValence30Days < 0 ? 'destructive' : 'secondary'
		}}
		context="Based on last 30 days"
	/>

	{#each additionalStats as stat}
		<StatCard
			title={stat.label}
			description={stat.description}
			value={stat.value}
			badge={stat.badge}
			context={stat.context}
		/>
	{/each}
</div>
