<script lang="ts">
	import MoodAnalytics from '$lib/components/MoodAnalytics.svelte';
	import AnalyticsHeader from '$lib/components/analytics/AnalyticsHeader.svelte';
	import AnalyticsStatsGrid from '$lib/components/analytics/AnalyticsStatsGrid.svelte';
	import EmotionDistributionChart from '$lib/components/analytics/EmotionDistributionChart.svelte';
	import MemberActivityChart from '$lib/components/analytics/MemberActivityChart.svelte';
	import MoodTrendChart from '$lib/components/analytics/MoodTrendChart.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const totalEntries = $derived(data.allEntries.length);
	const last30DaysCount = $derived(data.last30DaysEntries.length);
	const last7DaysCount = $derived(data.last7DaysEntries.length);

	const averageValence30Days = $derived(() => {
		if (data.last30DaysEntries.length === 0) return 0;
		const total = data.last30DaysEntries.reduce((sum, e) => sum + e.emotion.valence, 0);
		return total / data.last30DaysEntries.length;
	});

	const participationRate = $derived(() => {
		if (data.team.memberCount === 0) return 0;
		return (last30DaysCount / (data.team.memberCount * 30)) * 100;
	});
</script>

<svelte:head>
	<title>{data.team.name} Analytics - Sentio</title>
</svelte:head>

<div class="container mx-auto space-y-6 px-4 py-8">
	<!-- Header -->
	<AnalyticsHeader
		title="{data.team.name} Analytics"
		description="Team mood insights and statistics"
		backHref="/teams/{data.team.id}"
	/>

	<!-- Quick Stats -->
	<AnalyticsStatsGrid
		{totalEntries}
		{last30DaysCount}
		{last7DaysCount}
		averageValence30Days={averageValence30Days()}
		last30DaysEntries={data.last30DaysEntries}
		additionalStats={[
			{
				label: 'Participation Rate',
				description: 'Entries per member per day',
				value: `${participationRate().toFixed(0)}%`,
				context: `${data.team.memberCount} ${data.team.memberCount === 1 ? 'member' : 'members'} × 30 days`
			}
		]}
	/>

	<!-- Main Analytics Component -->
	<MoodAnalytics
		entries={data.currentWeekEntries}
		previousPeriodEntries={data.previous7DaysEntries}
	/>

	<!-- Mood Trend Chart -->
	<MoodTrendChart
		entries={data.last30DaysEntries}
		title="Mood Trend"
		description="Average daily mood score over the last 30 days"
	/>

	<!-- Charts and Detailed Stats -->
	<div class="grid gap-6 lg:grid-cols-2">
		<!-- Emotion Distribution Chart -->
		<EmotionDistributionChart
			entries={data.last30DaysEntries}
			title="Emotion Distribution"
			description="Most used emotions in the last 30 days"
		/>

		<!-- Member Activity Chart -->
		<MemberActivityChart
			entries={data.last30DaysEntries}
			title="Member Activity"
			description="Mood entries by team member (last 30 days)"
		/>
	</div>
</div>
