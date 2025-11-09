<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { Plus, MoreVertical, Trash2, Shield, ShieldPlus, ShieldOff } from '@lucide/svelte';
	import type { PageData } from './$types';
	import MemberDialog from './MemberDialog.svelte';
	import DeleteUserDialog from './DeleteUserDialog.svelte';

	type Props = {
		data: PageData;
		form?: { success?: boolean; error?: string } | null;
	};
	let { data, form = null }: Props = $props();

	let showDialog = $state(false);
	let showDeleteDialog = $state(false);
	let userToDelete = $state<{ id: string; name: string; email: string; isAdmin: boolean } | null>(
		null
	);
	let deleteFormElement = $state<HTMLFormElement | null>(null);

	function openCreateDialog() {
		showDialog = true;
	}

	function openDeleteDialog(user: { id: string; name: string; email: string; isAdmin: boolean }) {
		userToDelete = user;
		showDeleteDialog = true;
	}

	function handleDeleteConfirm() {
		if (deleteFormElement) {
			deleteFormElement.submit();
		}
		showDeleteDialog = false;
	}

	function handleDeleteCancel() {
		showDeleteDialog = false;
		userToDelete = null;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-medium">Users Management</h3>
			<p class="text-sm text-muted-foreground">Manage all platform users</p>
		</div>
		<Button onclick={openCreateDialog}>
			<Plus class="mr-2 h-4 w-4" />
			Add Member
		</Button>
	</div>

	{#if form?.success}
		<div
			class="rounded-lg border border-green-500 bg-green-50 p-4 text-green-900 dark:bg-green-950 dark:text-green-100"
		>
			✓ Action completed successfully!
		</div>
	{/if}

	{#if form?.error}
		<div
			class="rounded-lg border border-red-500 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100"
		>
			✕ {form.error}
		</div>
	{/if}

	<!-- All Users List -->
	<Card>
		<CardHeader>
			<CardTitle>All Users</CardTitle>
			<CardDescription>
				{data.allUsers?.length || 0} users • {data.adminUsers?.length || 0} admins
			</CardDescription>
		</CardHeader>
		<CardContent>
			{#if data.allUsers && data.allUsers.length > 0}
				<div class="divide-y">
					{#each data.allUsers as user}
						<div
							class="flex items-center justify-between rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
						>
							<!-- User Info -->
							<div class="flex flex-1 items-center gap-3">
								<div
									class="flex h-10 w-10 items-center justify-center rounded-full {data.adminUsers?.some(
										(a) => a.id === user.id
									)
										? 'bg-primary/10'
										: 'bg-muted'}"
								>
									<span
										class="text-sm font-semibold {data.adminUsers?.some((a) => a.id === user.id)
											? 'text-primary'
											: 'text-muted-foreground'}"
									>
										{user.name.charAt(0).toUpperCase()}
									</span>
								</div>
								<div class="min-w-0 flex-1">
									<p class="text-sm font-medium">{user.name}</p>
									<p class="truncate text-xs text-muted-foreground">{user.email}</p>
								</div>
							</div>

							<!-- Status Badge -->
							<div class="mx-3">
								{#if data.adminUsers?.some((a) => a.id === user.id)}
									<Badge>
										<Shield class="mr-1 h-3 w-3" />
										Admin
									</Badge>
								{/if}
							</div>

							<!-- Actions Menu -->
							<DropdownMenu>
								<DropdownMenuTrigger>
									<MoreVertical class="h-4 w-4" />
								</DropdownMenuTrigger>
								<DropdownMenuContent align="end" class="w-48">
									<!-- Make Admin Option -->
									{#if !data.adminUsers?.some((a) => a.id === user.id)}
										<form
											method="POST"
											action="?/makeAdmin"
											onsubmit={(e) => {
												if (!confirm(`Make "${user.name}" an admin?`)) {
													e.preventDefault();
												}
											}}
										>
											<input type="hidden" name="userId" value={user.id} />
											<DropdownMenuItem>
												<button type="submit" class="flex w-full items-center gap-2">
													<ShieldPlus class="h-4 w-4" />
													<span>Make Admin</span>
												</button>
											</DropdownMenuItem>
										</form>
									{/if}

									<!-- Remove Admin Option -->
									{#if data.adminUsers?.some((a) => a.id === user.id) && data.adminUsers.length > 1}
										<form
											method="POST"
											action="?/removeAdmin"
											onsubmit={(e) => {
												if (!confirm(`Remove admin privileges from "${user.name}"?`)) {
													e.preventDefault();
												}
											}}
										>
											<input type="hidden" name="userId" value={user.id} />
											<DropdownMenuItem>
												<button type="submit" class="flex w-full items-center gap-2 text-amber-600">
													<ShieldOff class="h-4 w-4" />
													<span>Remove Admin</span>
												</button>
											</DropdownMenuItem>
										</form>
									{/if}

									{#if data.adminUsers?.some((a) => a.id === user.id) && data.adminUsers.length <= 1}
										<DropdownMenuItem disabled>
											<div class="flex items-center gap-2">
												<Shield class="h-4 w-4" />
												<span class="text-xs">Last admin - cannot remove</span>
											</div>
										</DropdownMenuItem>
									{/if}

									<DropdownMenuSeparator />

									<!-- Delete Option -->
									<form
										bind:this={deleteFormElement}
										method="POST"
										action="?/deleteUser"
									>
										<input type="hidden" name="userId" value={user.id} />
										<DropdownMenuItem>
											<button
												type="button"
												onclick={() =>
													openDeleteDialog({
														id: user.id,
														name: user.name,
														email: user.email,
														isAdmin: data.adminUsers?.some((a) => a.id === user.id) ?? false
													})}
												class="flex items-center gap-2 w-full text-red-600"
											>
												<Trash2 class="h-4 w-4" />
												<span>Delete User</span>
											</button>
										</DropdownMenuItem>
									</form>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					{/each}
				</div>
			{:else}
				<div class="flex flex-col items-center justify-center py-12">
					<Shield class="mb-3 h-12 w-12 text-muted-foreground/30" />
					<p class="text-sm text-muted-foreground">No users yet</p>
				</div>
			{/if}
		</CardContent>
	</Card>

	<!-- Team Members Section -->
	<div class="grid gap-6">
		{#each data.teams as team}
			<Card>
				<CardHeader>
					<CardTitle class="text-base">{team.name}</CardTitle>
					<CardDescription>{team.members.length} members</CardDescription>
				</CardHeader>
				<CardContent>
					{#if team.members.length === 0}
						<div class="flex flex-col items-center justify-center py-8">
							<Shield class="mb-2 h-10 w-10 text-muted-foreground/30" />
							<p class="text-sm text-muted-foreground">No members in this team yet</p>
						</div>
					{:else}
						<div class="divide-y">
							{#each team.members as member}
								<div
									class="flex items-center justify-between rounded-md px-2 py-3 transition-colors hover:bg-muted/50"
								>
									<!-- Member Info -->
									<div class="flex flex-1 items-center gap-3">
										<div
											class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"
										>
											<span class="text-sm font-semibold text-primary">
												{member.userName.charAt(0).toUpperCase()}
											</span>
										</div>
										<div class="min-w-0 flex-1">
											<p class="text-sm font-medium">{member.userName}</p>
											<p class="truncate text-xs text-muted-foreground">{member.userEmail}</p>
										</div>
									</div>

									<!-- Role Badge -->
									<div class="mx-3">
										<Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
											{member.role}
										</Badge>
									</div>

									<!-- Remove Button -->
									<form method="POST" action="?/removeMember">
										<input type="hidden" name="memberId" value={member.id} />
										<Button
											variant="ghost"
											size="icon"
											type="submit"
											class="h-8 w-8"
											onclick={(e) => {
												if (!confirm(`Remove ${member.userName} from ${team.name}?`)) {
													e.preventDefault();
												}
											}}
										>
											<Trash2 class="h-4 w-4 text-destructive" />
										</Button>
									</form>
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
					<Shield class="mb-3 h-12 w-12 text-muted-foreground/30" />
					<h3 class="mb-2 text-lg font-semibold">No teams yet</h3>
					<p class="mb-4 text-sm text-muted-foreground">Create a team first to add members</p>
					<Button href="/admin/teams">Go to Teams</Button>
				</CardContent>
			</Card>
		{/if}
	</div>
</div>

<MemberDialog bind:open={showDialog} teams={data.allTeams} users={data.allUsers} />

{#if userToDelete}
	<DeleteUserDialog
		bind:open={showDeleteDialog}
		userName={userToDelete.name}
		userEmail={userToDelete.email}
		isAdmin={userToDelete.isAdmin}
		isLastAdmin={data.adminUsers?.length === 1 && userToDelete.isAdmin}
		onConfirm={handleDeleteConfirm}
		onCancel={handleDeleteCancel}
	/>
{/if}
