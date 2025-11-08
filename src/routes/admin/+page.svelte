<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Users, UserCog, Smile } from '@lucide/svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};
	let { data }: Props = $props();

	const stats = [
		{
			title: 'Total Teams',
			value: data.stats.totalTeams,
			icon: Users,
			description: 'Active teams'
		},
		{
			title: 'Total Members',
			value: data.stats.totalMembers,
			icon: UserCog,
			description: 'Across all teams'
		},
		{
			title: 'Mood Entries',
			value: data.stats.totalMoodEntries,
			icon: Smile,
			description: 'This month'
		}
	];
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Welcome back, {data.user.name}!</h3>
		<p class="text-muted-foreground text-sm">Here's an overview of your Niko-Niko calendar system.</p>
	</div>

	<div class="grid gap-4 md:grid-cols-3">
		{#each stats as stat}
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">{stat.title}</CardTitle>
					<stat.icon class="text-muted-foreground h-4 w-4" />
				</CardHeader>
				<CardContent>
					<div class="text-2xl font-bold">{stat.value}</div>
					<p class="text-muted-foreground text-xs">{stat.description}</p>
				</CardContent>
			</Card>
		{/each}
	</div>

	<Card>
		<CardHeader>
			<CardTitle>Recent Activity</CardTitle>
			<CardDescription>Latest mood entries across all teams</CardDescription>
		</CardHeader>
		<CardContent>
			{#if data.recentEntries.length === 0}
				<p class="text-muted-foreground text-center py-8">No recent activity</p>
			{:else}
				<div class="space-y-4">
					{#each data.recentEntries as entry}
						<div class="flex items-center gap-4">
							<div class="text-2xl">{entry.emotion.emoji}</div>
							<div class="flex-1">
								<p class="text-sm font-medium">{entry.user.name}</p>
								<p class="text-muted-foreground text-xs">
									{new Date(entry.date).toLocaleDateString()}
								</p>
							</div>
							{#if entry.comment}
								<p class="text-muted-foreground text-sm max-w-xs truncate">{entry.comment}</p>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
