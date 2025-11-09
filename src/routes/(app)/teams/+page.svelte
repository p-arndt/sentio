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
	import * as Empty from '$lib/components/ui/empty/index.js';
	import { Calendar, Eye, Globe, Lock, Plus, Settings, Users } from '@lucide/svelte';

	let { data } = $props();

	function formatDate(date: Date) {
		return new Date(date).toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	}

	function getVisibilityIcon(visibility: string) {
		switch (visibility) {
			case 'public':
				return Globe;
			case 'private':
				return Lock;
			default:
				return Eye;
		}
	}

	function getVisibilityDescription(visibility: string) {
		switch (visibility) {
			case 'public':
				return 'Anyone can view';
			case 'private':
				return 'Only you can view';
			default:
				return 'Team members only';
		}
	}
</script>

<div class="container mx-auto space-y-6 px-4 py-8">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-3xl font-bold">Teams</h1>
			<p class="text-muted-foreground">Manage your team mood calendars</p>
		</div>

		{#if data.user.isAdmin}
			<Button href="/teams/new" size="lg">
				<Plus class="mr-2 h-4 w-4" />
				Create Team
			</Button>
		{/if}
	</div>

	<!-- Teams Grid -->
	{#if data.teams.length > 0}
		<div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
			{#each data.teams as team}
				<Card class="group transition-all hover:shadow-lg">
					<CardHeader>
						<div class="flex items-start justify-between">
							<div class="flex-1">
								<CardTitle class="group-hover:text-primary">{team.name}</CardTitle>
								{#if team.description}
									<CardDescription class="mt-2 line-clamp-2">
										{team.description}
									</CardDescription>
								{/if}
							</div>
							<Badge variant="secondary" class="ml-2">
								{#if team.visibility === 'public'}
									<Globe class="mr-1 h-3 w-3" />
								{:else if team.visibility === 'private'}
									<Lock class="mr-1 h-3 w-3" />
								{:else}
									<Eye class="mr-1 h-3 w-3" />
								{/if}
								{team.visibility}
							</Badge>
						</div>
					</CardHeader>
					<CardContent class="space-y-4">
						<div class="flex items-center gap-4 text-sm text-muted-foreground">
							<div class="flex items-center gap-1">
								<Calendar class="h-4 w-4" />
								{formatDate(team.createdAt)}
							</div>
						</div>

						<div class="flex gap-2">
							<Button href="/teams/{team.id}" variant="default" class="flex-1">
								<Calendar class="mr-2 h-4 w-4" />
								View Calendar
							</Button>
							<Button href="/teams/{team.id}/settings" variant="outline" size="icon">
								<Settings class="h-4 w-4" />
							</Button>
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	{:else}
		<!-- Empty State -->
		<Empty.Root class="border border-dashed">
			<Empty.Header>
				<Empty.Media variant="icon">
					<Users class="h-16 w-16 text-muted-foreground" />
				</Empty.Media>
				<Empty.Title>No teams yet</Empty.Title>
				<Empty.Description>
					Create your first team to start tracking mood with your colleagues. Teams help you
					understand and improve your team's well-being.
				</Empty.Description>
			</Empty.Header>
			<Empty.Content>
				<Button variant="outline" href="/teams/new">Create Team</Button>
			</Empty.Content>
		</Empty.Root>
	{/if}
</div>
