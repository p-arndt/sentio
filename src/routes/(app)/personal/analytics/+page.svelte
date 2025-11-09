<script lang="ts">
	import MoodAnalytics from '$lib/components/MoodAnalytics.svelte';
	import AnalyticsHeader from '$lib/components/analytics/AnalyticsHeader.svelte';
	import AnalyticsStatsGrid from '$lib/components/analytics/AnalyticsStatsGrid.svelte';
	import EmotionDistributionChart from '$lib/components/analytics/EmotionDistributionChart.svelte';
	import MoodTrendChart from '$lib/components/analytics/MoodTrendChart.svelte';
	import { averageValence30Days, consistency } from '$lib/utils/emotion-analytics';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const totalEntries = $derived(data.allEntries.length);
	const last30DaysCount = $derived(data.last30DaysEntries.length);
	const last7DaysCount = $derived(data.last7DaysEntries.length);
</script>

<svelte:head>
	<title>Personal Analytics - Sentio</title>
</svelte:head>

<div class="container mx-auto max-w-6xl space-y-6 px-4 py-8">
	<!-- Header -->
	<AnalyticsHeader
		title="Personal Analytics"
		description="Your mood insights and statistics"
		backHref="/personal"
	/>

	<!-- Quick Stats -->
	<AnalyticsStatsGrid
		{totalEntries}
		{last30DaysCount}
		{last7DaysCount}
		averageValence30Days={averageValence30Days(data.last30DaysEntries)}
		last30DaysEntries={data.last30DaysEntries}
		additionalStats={[
			{
				label: 'Consistency',
				description: 'Days with entries',
				value: `${consistency(data.last30DaysEntries).toFixed(0)}%`,
				context: 'Out of last 30 days'
			}
		]}
	/>

	<!-- Main Analytics Component -->
	<MoodAnalytics
		entries={data.last7DaysEntries}
		previousPeriodEntries={data.previous7DaysEntries}
	/>

	<!-- Mood Trend Chart -->
	<MoodTrendChart
		entries={data.last30DaysEntries}
		title="Mood Trend"
		description="Your average daily mood score over the last 30 days"
	/>

	<!-- Charts and Detailed Stats -->
	<div class="w-full">
		<!-- Emotion Distribution Chart -->
		<EmotionDistributionChart
			entries={data.last30DaysEntries}
			title="Emotion Distribution"
			description="Your most used emotions in the last 30 days"
		/>
	</div>
</div>
