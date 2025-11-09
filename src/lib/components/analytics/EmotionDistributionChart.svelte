<script lang="ts">
	import type { MoodEntryWithDetails } from '$lib/types';
	import type { Emotion } from '$lib/types';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	type Props = {
		entries: MoodEntryWithDetails[];
		title?: string;
		description?: string;
		maxItems?: number;
	};

	let { 
		entries, 
		title = 'Emotion Distribution', 
		description = 'Most used emotions',
		maxItems = 10
	}: Props = $props();

	const emotionDistribution = $derived.by(() => {
		const counts: Record<string, { emotion: Emotion; count: number }> = {};

		entries.forEach((entry) => {
			const emotionId = entry.emotionId;
			if (!counts[emotionId]) {
				counts[emotionId] = { emotion: entry.emotion, count: 0 };
			}
			counts[emotionId].count++;
		});

		return Object.values(counts).sort((a, b) => b.count - a.count).slice(0, maxItems);
	});

	const totalCount = $derived(entries.length);
	const maxCount = $derived(emotionDistribution.length > 0 ? emotionDistribution[0].count : 1);
</script>

<Card>
	<CardHeader>
		<CardTitle>{title}</CardTitle>
		<CardDescription>{description}</CardDescription>
	</CardHeader>
	<CardContent>
		{#if emotionDistribution.length > 0}
			<div class="space-y-4">
				{#each emotionDistribution as { emotion, count }}
					{@const percentage = (count / totalCount) * 100}
					{@const barWidth = (count / maxCount) * 100}
					<div class="space-y-2">
						<div class="flex items-center justify-between text-sm">
							<div class="flex items-center gap-2">
								<span class="text-xl">{emotion.emoji}</span>
								<span class="font-medium">{emotion.name}</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="font-bold">{count}</span>
								<span class="text-muted-foreground text-xs">({percentage.toFixed(1)}%)</span>
							</div>
						</div>
						<div class="h-8 w-full overflow-hidden rounded-md bg-muted">
							<div
								class="h-full rounded-md transition-all"
								style="width: {barWidth}%; background-color: {emotion.color};"
							></div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<div class="mb-2 text-4xl">📊</div>
				<p class="text-muted-foreground">No mood entries yet</p>
			</div>
		{/if}
	</CardContent>
</Card>
