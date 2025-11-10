<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Activity, ArrowRight, Calendar, Heart, Plus, Users } from '@lucide/svelte';
	import { getGreeting, formatDate } from '$lib/utils';
	import type { PageData } from './$types';
	import DashboardQuickMoodEntry from '$lib/components/DashboardQuickMoodEntry.svelte';

	type Props = {
		data: PageData;
	};
	let { data }: Props = $props();

	let quickActions = $derived([
		{
			label: 'Create Team',
			href: '/teams/new',
			icon: Users,
			variant: 'outline' as const,
			show: data.user.isAdmin
		},
		{
			label: 'View Personal Calendar',
			href: '/personal',
			icon: Heart,
			variant: 'outline' as const,
			show: true
		}
	]);
</script>

<svelte:head>
	<title>Dashboard - Sentio</title>
</svelte:head>

<div class="container mx-auto space-y-8 px-4 py-8">
	<!-- Hero Section -->
	<div class="space-y-2">
		<h1 class="text-4xl font-bold tracking-tight">
			{getGreeting()}, {data.user.name}! 👋
		</h1>
		<p class="text-xl text-muted-foreground">How are you feeling today?</p>
	</div>
	<!-- Quick Actions -->
	<!-- <div class="grid gap-4 md:grid-cols-3">
		{#each quickActions.filter((a) => a.show) as action}
			<Button
				href={action.href}
				variant={action.variant}
				size="lg"
				class="h-auto justify-start gap-3 p-6 text-left"
			>
				<div class="rounded-lg bg-primary/10 p-3">
					<action.icon class="h-6 w-6" />
				</div>
				<div class="flex-1">
					<div class="font-semibold">{action.label}</div>
				</div>
				<ArrowRight class="h-5 w-5" />
			</Button>
		{/each}
	</div> -->

	<!-- Quick Mood Entry Card -->
	<DashboardQuickMoodEntry emotions={data.emotions} teams={data.teams} />

	<!-- Stats Grid -->
	<div class="grid gap-4 md:grid-cols-3">
		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Your Teams</CardTitle>
				<Users class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.totalTeams}</div>
				<p class="text-xs text-muted-foreground">
					{data.stats.totalTeams === 1 ? 'Active team' : 'Active teams'}
				</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Personal Entries</CardTitle>
				<Heart class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.personalEntriesCount}</div>
				<p class="text-xs text-muted-foreground">Last 7 days</p>
			</CardContent>
		</Card>

		<Card>
			<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle class="text-sm font-medium">Team Activity</CardTitle>
				<Activity class="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div class="text-2xl font-bold">{data.stats.teamEntriesCount}</div>
				<p class="text-xs text-muted-foreground">Team mood entries</p>
			</CardContent>
		</Card>
	</div>

	<!-- Teams Overview -->
	{#if data.teams.length > 0}
		<Card>
			<CardHeader>
				<div class="flex items-center justify-between">
					<div>
						<CardTitle>Your Teams</CardTitle>
						<CardDescription>Quick access to your team calendars</CardDescription>
					</div>
					<Button href="/teams" variant="outline" size="sm">
						View All
						<ArrowRight class="ml-2 h-4 w-4" />
					</Button>
				</div>
			</CardHeader>
			<CardContent>
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each data.teams.slice(0, 6) as team}
						<a
							href="/teams/{team.id}"
							class="group block rounded-lg border bg-card p-4 transition-all hover:border-primary hover:shadow-md"
						>
							<div class="space-y-2">
								<div class="flex items-center justify-between">
									<h3 class="font-semibold group-hover:text-primary">{team.name}</h3>
									<Badge variant="secondary">
										{team.visibility}
									</Badge>
								</div>
								{#if team.description}
									<p class="line-clamp-2 text-sm text-muted-foreground">
										{team.description}
									</p>
								{/if}
								<div class="flex items-center gap-4 text-xs text-muted-foreground">
									<div class="flex items-center gap-1">
										<Calendar class="h-3 w-3" />
										{formatDate(team.createdAt)}
									</div>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</CardContent>
		</Card>
	{:else}
		<!-- Empty State -->
		<Card>
			<CardContent class="flex flex-col items-center justify-center py-16">
				<div class="rounded-full bg-muted p-6">
					<Users class="h-12 w-12 text-muted-foreground" />
				</div>
				<h3 class="mt-6 text-xl font-semibold">No teams yet</h3>
				<p class="mt-2 text-center text-muted-foreground">
					Create your first team to start tracking mood with your colleagues
				</p>
				<Button href="/teams/new" class="mt-6" size="lg">
					<Plus class="mr-2 h-4 w-4" />
					Create Your First Team
				</Button>
			</CardContent>
		</Card>
	{/if}

	<!-- Recent Personal Activity -->
	{#if data.personalEntries.length > 0}
		<Card>
			<CardHeader>
				<CardTitle>Your Recent Moods</CardTitle>
				<CardDescription>Personal mood tracking from the last week</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="space-y-3">
					{#each data.personalEntries.slice(0, 5) as entry}
						<div class="flex items-center gap-4 rounded-lg border p-3">
							<div class="rounded-full p-2" style="background-color: {entry.emotion.color}20;">
								<span class="text-2xl">{entry.emotion.emoji}</span>
							</div>
							<div class="flex-1">
								<div class="font-medium">{entry.emotion.name}</div>
								<div class="text-sm text-muted-foreground">
									{formatDate(entry.date)}
								</div>
							</div>
							{#if entry.comment}
								<div class="max-w-xs truncate text-sm text-muted-foreground">
									"{entry.comment}"
								</div>
							{/if}
						</div>
					{/each}
				</div>
				{#if data.personalEntries.length > 5}
					<Button href="/personal" variant="ghost" class="mt-4 w-full">
						View All Personal Entries
						<ArrowRight class="ml-2 h-4 w-4" />
					</Button>
				{/if}
			</CardContent>
		</Card>
	{/if}
</div>
