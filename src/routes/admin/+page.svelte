<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Users, UserCog, Smile, Sparkles } from '@lucide/svelte';
	import { fly, fade } from 'svelte/transition';
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

<div class="space-y-6" in:fade={{ duration: 300 }}>
	<div>
		<h3 class="text-2xl font-bold tracking-tight">Welcome back, {data.user.name}!</h3>
		<p class="text-sm text-muted-foreground">Here's an overview of your organization</p>
	</div>

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
		{#each stats as stat}
			<div class="transition-transform hover:scale-[1.02]">
				<Card class="border-primary/10 shadow-sm transition-shadow hover:shadow-md">
					<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle class="text-sm font-medium">{stat.title}</CardTitle>
						<stat.icon class="h-4 w-4 text-muted-foreground" />
					</CardHeader>
					<CardContent>
						<div class="text-2xl font-bold">{stat.value}</div>
						<p class="text-xs text-muted-foreground">{stat.description}</p>
					</CardContent>
				</Card>
			</div>
		{/each}
	</div>

	<div class="grid gap-4 md:grid-cols-2">
		<!-- Team Members Overview -->
		<Card class="transition-all hover:shadow-md">
			<CardHeader>
				<CardTitle>Team Members</CardTitle>
				<CardDescription>Number of members per team</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.teamActivity.length === 0}
					<p class="py-8 text-center text-muted-foreground">No teams yet</p>
				{:else}
					<div class="space-y-3">
						{#each data.teamActivity as activity}
							<div
								class="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50"
							>
								<div class="flex items-center gap-2">
									<div class="rounded-md bg-muted p-1.5">
										<Users class="h-4 w-4 text-muted-foreground" />
									</div>
									<span class="font-medium">{activity.teamName}</span>
								</div>
								<span class="text-sm text-muted-foreground">
									{activity.memberCount}
									{activity.memberCount === 1 ? 'member' : 'members'}
								</span>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>

		<!-- Team Activity (Last 7 Days) -->
		<Card class="transition-all hover:shadow-md">
			<CardHeader>
				<CardTitle>Team Activity</CardTitle>
				<CardDescription>Mood entries in the last 7 days</CardDescription>
			</CardHeader>
			<CardContent>
				{#if data.teamEntryStats.length === 0}
					<p class="py-8 text-center text-muted-foreground">No activity yet</p>
				{:else}
					<div class="space-y-3">
						{#each data.teamEntryStats as stats}
							<div
								class="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted/50"
							>
								<div class="flex items-center gap-2">
									<div class="rounded-md bg-muted p-1.5">
										<Smile class="h-4 w-4 text-muted-foreground" />
									</div>
									<span class="font-medium">{stats.teamName}</span>
								</div>
								<div class="flex items-center gap-2">
									<span class="text-sm text-muted-foreground">
										{stats.entryCount}
										{stats.entryCount === 1 ? 'entry' : 'entries'}
									</span>
									{#if stats.entryCount > 0}
										<div
											class="h-2 w-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
										></div>
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
