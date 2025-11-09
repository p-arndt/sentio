<script lang="ts">
	import type { MoodEntryWithDetails } from '$lib/types';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';

	type Props = {
		entries: MoodEntryWithDetails[];
		title?: string;
		description?: string;
		maxMembers?: number;
	};

	let { 
		entries, 
		title = 'Member Activity', 
		description = 'Mood entries by team member',
		maxMembers = 10
	}: Props = $props();

	const memberStats = $derived.by(() => {
		const memberCounts: Record<string, { name: string; count: number; initial: string }> = {};

		entries.forEach((entry) => {
			const userId = entry.userId;
			if (!memberCounts[userId]) {
				memberCounts[userId] = { 
					name: entry.user.name, 
					count: 0,
					initial: entry.user.name.charAt(0).toUpperCase()
				};
			}
			memberCounts[userId].count++;
		});

		return Object.values(memberCounts)
			.sort((a, b) => b.count - a.count)
			.slice(0, maxMembers);
	});

	const totalCount = $derived(entries.length);
	const maxCount = $derived(memberStats.length > 0 ? memberStats[0].count : 1);
</script>

<Card>
	<CardHeader>
		<CardTitle>{title}</CardTitle>
		<CardDescription>{description}</CardDescription>
	</CardHeader>
	<CardContent>
		{#if memberStats.length > 0}
			<div class="space-y-4">
				{#each memberStats as member}
					{@const percentage = (member.count / totalCount) * 100}
					{@const barWidth = (member.count / maxCount) * 100}
					<div class="space-y-2">
						<div class="flex items-center justify-between text-sm">
							<div class="flex items-center gap-3">
								<div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
									{member.initial}
								</div>
								<span class="font-medium">{member.name}</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="font-bold">{member.count}</span>
								<span class="text-muted-foreground text-xs">entries</span>
							</div>
						</div>
						<div class="h-6 w-full overflow-hidden rounded-md bg-muted">
							<div
								class="h-full rounded-md bg-primary transition-all"
								style="width: {barWidth}%;"
							></div>
						</div>
					</div>
				{/each}
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<div class="mb-2 text-4xl">👥</div>
				<p class="text-muted-foreground">No activity yet</p>
			</div>
		{/if}
	</CardContent>
</Card>
