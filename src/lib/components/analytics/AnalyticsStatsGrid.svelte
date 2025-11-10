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
	}: Props = $props();

	// Prepare additional stats with inferred badges for better visuals
	const preparedStats = (additionalStats || []).map((stat) => {
		const s: any = { ...stat };
		// if the stat already contains badge, keep it
		if (s.badge) return s;

		// Mood Trend: value like "▲ +0.6" or "▼ 0.6"
		if (s.label && s.label.toLowerCase().includes('trend') && typeof s.value === 'string') {
			const m = s.value.match(/[▲▼]\s*([+-]?\d+(?:\.\d+)?)/);
			if (m) {
				const num = parseFloat(m[1]);
				s.badge = { text: s.value, variant: num >= 0 ? 'default' : 'destructive' };
				// hide the plain value to avoid duplication in the card
				s.value = '';
				return s;
			}
		}

		// Mood Stability: numeric 0..1
		if (s.label && s.label.toLowerCase().includes('stability')) {
			const num = typeof s.value === 'string' ? parseFloat(s.value) : Number(s.value);
			const variant = Number.isFinite(num)
				? num >= 0.66
					? 'default'
					: num >= 0.33
						? 'secondary'
						: 'destructive'
				: 'secondary';
			s.badge = { text: Number.isFinite(num) ? num.toFixed(2) : String(s.value), variant };
			s.value = '';
			return s;
		}

		// Default: no badge
		return s;
	});
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
		context={`${last7DaysCount} entries in last 7 days`}
	/>

	<StatCard
		title="Team Mood"
		description="Average emotional valence"
		value={averageValence30Days.toFixed(1)}
		badge={{
			text:
				averageValence30Days > 0 ? 'Positive' : averageValence30Days < 0 ? 'Negative' : 'Neutral',
			variant:
				averageValence30Days > 0
					? 'default'
					: averageValence30Days < 0
						? 'destructive'
						: 'secondary'
		}}
		context="Based on last 30 days"
	/>

	{#each preparedStats as stat}
		<StatCard
			title={stat.label}
			description={stat.description}
			value={stat.value}
			badge={stat.badge}
			context={stat.context}
		/>
	{/each}
</div>
