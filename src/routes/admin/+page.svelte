<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Users, UserCog, Smile, Sparkles } from '@lucide/svelte';
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
		},
		{
			title: 'Global Emotions',
			value: data.stats.globalEmotions,
			icon: Sparkles,
			description: 'Available emotions'
		}
	];
</script>

<svelte:head>
	<title>Admin Dashboard - Sentio</title>
</svelte:head>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Welcome back, {data.user.name}!</h3>
		<p class="text-muted-foreground text-sm">Here's an overview for you</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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

	<div class="grid gap-4 md:grid-cols-2">
		<!-- Team Members Overview -->
		<Card>
			<CardHeader>
				<CardTitle>Team Members</CardTitle>
				<CardDescription>Number of members per team</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.teamActivity.length === 0}
					<p class="text-muted-foreground text-center py-8">No teams yet</p>
				{:else}
					<div class="space-y-3">
						{#each data.teamActivity as activity}
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Users class="text-muted-foreground h-4 w-4" />
									<span class="font-medium">{activity.teamName}</span>
								</div>
								<span class="text-muted-foreground text-sm">
									{activity.memberCount} {activity.memberCount === 1 ? 'member' : 'members'}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Team Activity (Last 7 Days) -->
		<Card>
			<CardHeader>
				<CardTitle>Team Activity</CardTitle>
				<CardDescription>Mood entries in the last 7 days</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.teamEntryStats.length === 0}
					<p class="text-muted-foreground text-center py-8">No activity yet</p>
				{:else}
					<div class="space-y-3">
						{#each data.teamEntryStats as stats}
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<Smile class="text-muted-foreground h-4 w-4" />
									<span class="font-medium">{stats.teamName}</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-muted-foreground text-sm">
										{stats.entryCount} {stats.entryCount === 1 ? 'entry' : 'entries'}
									</span>
									{#if stats.entryCount > 0}
										<div class="h-2 w-2 rounded-full bg-green-500"></div>
									{:else}
										<div class="h-2 w-2 rounded-full bg-muted"></div>
									{/if}
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>
