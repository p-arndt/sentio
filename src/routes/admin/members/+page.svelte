<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, UserCog, Trash2 } from '@lucide/svelte';
	import type { PageData } from './$types';
	import MemberDialog from './MemberDialog.svelte';

	type Props = {
		data: PageData;
	};
	let { data }: Props = $props();

	let showDialog = $state(false);

	function openCreateDialog() {
		showDialog = true;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-medium">Team Members</h3>
			<p class="text-muted-foreground text-sm">Manage members across all teams</p>
		</div>
		<Button onclick={openCreateDialog}>
			<Plus class="mr-2 h-4 w-4" />
			Add Member
		</Button>
	</div>

	<div class="grid gap-6">
		{#each data.teams as team}
			<Card>
				<CardHeader>
					<CardTitle class="text-base">{team.name}</CardTitle>
					<CardDescription>{team.members.length} members</CardDescription>
				</CardHeader>
				<CardContent>
					{#if team.members.length === 0}
						<p class="text-muted-foreground text-center py-8 text-sm">No members in this team yet</p>
					{:else}
						<div class="space-y-3">
							{#each team.members as member}
								<div class="flex items-center justify-between rounded-lg border p-3">
									<div class="flex items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
										>
											<UserCog class="text-primary h-5 w-5" />
										</div>
										<div>
											<p class="font-medium text-sm">{member.userName}</p>
											<p class="text-muted-foreground text-xs">{member.userEmail}</p>
										</div>
									</div>
									<div class="flex items-center gap-2">
										<Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
											{member.role}
										</Badge>
										<form method="POST" action="?/removeMember">
											<input type="hidden" name="memberId" value={member.id} />
											<Button variant="ghost" size="icon" type="submit">
												<Trash2 class="h-4 w-4" />
											</Button>
										</form>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				</CardContent>
			</Card>
		{/each}

		{#if data.teams.length === 0}
			<Card>
				<CardContent class="flex flex-col items-center justify-center py-16">
					<UserCog class="text-muted-foreground mb-4 h-12 w-12" />
					<h3 class="mb-2 text-lg font-semibold">No teams yet</h3>
					<p class="text-muted-foreground mb-4 text-sm">Create a team first to add members</p>
					<Button href="/admin/teams">Go to Teams</Button>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>

<MemberDialog bind:open={showDialog} teams={data.allTeams} users={data.allUsers} />
