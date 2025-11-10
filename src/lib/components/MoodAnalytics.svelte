<!-- Example usage of emotion analytics -->
<script lang="ts">
	import WeeklyMoodHeatmap from '$lib/components/analytics/WeeklyMoodHeatmap.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { MoodEntryWithDetails } from '$lib/types';
	import {
		averageByWeekday,
		calculateHappinessIndex,
		consistency,
		emotionDiversity,
		entriesByTimeOfDay,
		getMoodAnalytics,
		moodStability,
		moodTrendSlope,
		mostUsedEmotion
	} from '$lib/utils/emotion-analytics';

	type Props = {
		entries: MoodEntryWithDetails[];
		previousPeriodEntries?: MoodEntryWithDetails[];
	};

	let { entries, previousPeriodEntries }: Props = $props();

	const analytics = $derived(getMoodAnalytics(entries, previousPeriodEntries));
	const happinessIndex = $derived(calculateHappinessIndex(entries));

	const stability = $derived(moodStability(entries));
	const consistencyPct = $derived(consistency(entries));
	const favorite = $derived(mostUsedEmotion(entries));
	const diversity = $derived(emotionDiversity(entries));
</script>

<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
	<!-- Average Mood Score -->
	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Average Mood</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="flex items-baseline gap-2">
				<span class="text-2xl font-bold" style="color: {analytics.moodScore.color}">
					{analytics.averageScore.toFixed(1)}
				</span>
				<Badge
					style="background-color: {analytics.moodScore.color}20; color: {analytics.moodScore
						.color}"
				>
					{analytics.moodScore.label}
				</Badge>
			</div>
			{#if analytics.warning}
				<p class="mt-2 text-xs text-amber-600 dark:text-amber-400">
					⚠️ {analytics.warning}
				</p>
			{/if}
		</CardContent>
	</Card>

	<!-- Happiness Index -->
	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Happiness Index</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="flex items-baseline gap-2">
				<span class="text-2xl font-bold">{Math.round(happinessIndex)}</span>
				<span class="text-sm text-muted-foreground">/ 100</span>
			</div>
			<div class="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
				<div
					class="h-full rounded-full transition-all"
					style="width: {happinessIndex}%; background-color: {analytics.moodScore.color}"
				></div>
			</div>
		</CardContent>
	</Card>

	<!-- Mood Distribution -->
	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Distribution</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="space-y-1 text-sm">
				<div class="flex items-center justify-between">
					<span class="text-green-600 dark:text-green-400">😊 Positive</span>
					<span class="font-semibold">{analytics.distribution.positive}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-muted-foreground">😐 Neutral</span>
					<span class="font-semibold">{analytics.distribution.neutral}</span>
				</div>
				<div class="flex items-center justify-between">
					<span class="text-red-600 dark:text-red-400">😢 Negative</span>
					<span class="font-semibold">{analytics.distribution.negative}</span>
				</div>
			</div>
		</CardContent>
	</Card>

	<!-- Trend -->
	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Trend</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="flex items-center gap-2">
				{#if analytics.trend === 'improving'}
					<span class="text-2xl">📈</span>
					<div>
						<p class="font-semibold text-green-600 dark:text-green-400">Improving</p>
						<p class="text-xs text-muted-foreground">Mood is getting better</p>
					</div>
				{:else if analytics.trend === 'declining'}
					<span class="text-2xl">📉</span>
					<div>
						<p class="font-semibold text-red-600 dark:text-red-400">Declining</p>
						<p class="text-xs text-muted-foreground">Attention needed</p>
					</div>
				{:else if analytics.trend === 'stable'}
					<span class="text-2xl">📊</span>
					<div>
						<p class="font-semibold">Stable</p>
						<p class="text-xs text-muted-foreground">Consistent mood</p>
					</div>
				{:else}
					<span class="text-2xl">❓</span>
					<div>
						<p class="font-semibold text-muted-foreground">No Data</p>
						<p class="text-xs text-muted-foreground">Need more entries</p>
					</div>
				{/if}
			</div>
		</CardContent>
	</Card>
</div>

<!-- Additional small stats and charts -->
<div class="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Stability</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{stability.toFixed(2)}</div>
			<div class="text-xs text-muted-foreground">0 (volatile) — 1 (stable)</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Consistency</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{consistencyPct.toFixed(0)}%</div>
			<div class="text-xs text-muted-foreground">Days with entries (last 30d)</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Top Emotion</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{favorite}</div>
			<div class="text-xs text-muted-foreground">Most used emotion</div>
		</CardContent>
	</Card>

	<Card>
		<CardHeader class="pb-2">
			<CardTitle class="text-sm font-medium text-muted-foreground">Emotional Range</CardTitle>
		</CardHeader>
		<CardContent>
			<div class="text-2xl font-bold">{diversity.toFixed(0)}%</div>
			<div class="text-xs text-muted-foreground">Shannon entropy based</div>
		</CardContent>
	</Card>
</div>

<WeeklyMoodHeatmap {entries} title="Weekly Mood" description="Avg mood per weekday" />
