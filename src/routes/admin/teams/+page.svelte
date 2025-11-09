<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Plus, Users, Edit, Trash2 } from '@lucide/svelte';
	import type { PageData } from './$types';
	import TeamDialog from './TeamDialog.svelte';

	type Props = {
		data: PageData;
		form?: { success?: boolean; error?: string } | null;
	};
	let { data, form = null }: Props = $props();

	let showDialog = $state(false);
	let editingTeam = $state<(typeof data.teams)[0] | null>(null);

	function openCreateDialog() {
		editingTeam = null;
		showDialog = true;
	}

	function openEditDialog(team: (typeof data.teams)[0]) {
		editingTeam = team;
		showDialog = true;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-medium">Teams</h3>
			<p class="text-muted-foreground text-sm">Manage your organization's teams</p>
		</div>
		<Button onclick={openCreateDialog}>
			<Plus class="mr-2 h-4 w-4" />
			Create Team
		</Button>
	</div>

	{#if form?.success}
		<div class="rounded-lg border border-green-500 bg-green-50 p-4 text-green-900 dark:bg-green-950 dark:text-green-100">
			Team saved successfully!
		</div>
	{/if}

	{#if form?.error}
		<div class="rounded-lg border border-red-500 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100">
			{form.error}
		</div>
	{/if}

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.teams as team}
			<Card>
				<CardHeader>
					<div class="flex items-start justify-between">
						<div class="flex-1">
							<CardTitle class="text-base">{team.name}</CardTitle>
							{#if team.description}
								<CardDescription class="mt-1">{team.description}</CardDescription>
							{/if}
						</div>
						<div class="flex gap-1">
							<Button variant="ghost" size="icon" onclick={() => openEditDialog(team)}>
								<Edit class="h-4 w-4" />
							</Button>
							<form method="POST" action="?/deleteTeam">
								<input type="hidden" name="teamId" value={team.id} />
								<Button
									variant="ghost"
									size="icon"
									type="submit"
									onclick={(e) => {
										if (!confirm(`Are you sure you want to delete team "${team.name}"? This will remove all members and mood entries.`)) {
											e.preventDefault();
										}
									}}
								>
									<Trash2 class="h-4 w-4 text-destructive" />
								</Button>
							</form>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<Users class="h-4 w-4" />
						<span>{team.memberCount} members</span>
					</div>
					<div class="text-muted-foreground mt-2 text-xs">
						Created {new Date(team.createdAt).toLocaleDateString()}
					</div>
				</CardContent>
			</Card>
		{/each}

		{#if data.teams.length === 0}
			<div class="col-span-full">
				<Card>
					<CardContent class="flex flex-col items-center justify-center py-16">
						<Users class="text-muted-foreground mb-4 h-12 w-12" />
						<h3 class="mb-2 text-lg font-semibold">No teams yet</h3>
						<p class="text-muted-foreground mb-4 text-sm">Get started by creating your first team</p>
						<Button onclick={openCreateDialog}>
							<Plus class="mr-2 h-4 w-4" />
							Create Team
						</Button>
					</CardContent>
				</Card>
			</div>
		{/if}
	</div>
</div>

<TeamDialog bind:open={showDialog} team={editingTeam} />
