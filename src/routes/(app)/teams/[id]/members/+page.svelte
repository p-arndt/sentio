<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import { ChevronLeft, MoreVertical, UserPlus, Shield, User } from '@lucide/svelte';
	import { getUserInitials } from '$lib/utils/user';
	import { formatDate } from '$lib/utils/date';
	import { enhance } from '$app/forms';
	import InviteMembersDialog from './InviteMembersDialog.svelte';

	let { data, form } = $props();

	let showInviteDialog = $state(false);

</script>

<svelte:head>
	<title>Team Members - {data.team.name} - Sentio</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-6 px-4 py-8">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<Button href="/teams/{data.team.id}" variant="ghost" size="icon">
			<ChevronLeft class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold">Team Members</h1>
			<p class="text-muted-foreground">{data.team.name}</p>
		</div>
	</div>

	{#if form?.success}
		<div
			class="rounded-lg border border-green-500 bg-green-50 p-4 text-green-900 dark:bg-green-950 dark:text-green-100"
		>
			{form.message}
		</div>
	{/if}

	{#if form?.error}
		<div
			class="rounded-lg border border-red-500 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100"
		>
			{form.error}
		</div>
	{/if}

	<!-- Invite Members Dialog Component -->
	<InviteMembersDialog teamId={data.team.id} bind:open={showInviteDialog} />

	<!-- Members List -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Members ({data.team.members?.length || 0})</CardTitle>
					<CardDescription>Manage team members and their roles</CardDescription>
				</div>
				<Button onclick={() => (showInviteDialog = true)}>
					<UserPlus class="mr-2 h-4 w-4" />
					Invite Member
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Member</TableHead>
						<TableHead>Role</TableHead>
						<TableHead>Joined</TableHead>
						<TableHead class="w-[70px]"></TableHead>
					</TableRow>
				</TableHeader>
				<TableBody>
					{#if data.team.members && data.team.members.length > 0}
						{#each data.team.members as member}
							<TableRow>
								<TableCell>
									<div class="flex items-center gap-3">
										<Avatar>
											<AvatarImage src={member.user.image ?? undefined} alt={member.user.name} />
											<AvatarFallback>{getUserInitials(member.user.name)}</AvatarFallback>
										</Avatar>
										<div>
											<div class="font-medium">{member.user.name}</div>
											<div class="text-sm text-muted-foreground">{member.user.email}</div>
										</div>
									</div>
								</TableCell>
								<TableCell>
									<Badge variant={member.role === 'admin' ? 'default' : 'secondary'}>
										{#if member.role === 'admin'}
											<Shield class="mr-1 h-3 w-3" />
										{:else}
											<User class="mr-1 h-3 w-3" />
										{/if}
										{member.role}
									</Badge>
								</TableCell>
								<TableCell>
									{new Date(member.joinedAt).toLocaleDateString()}
								</TableCell>
								<TableCell>
									<DropdownMenu>
										<DropdownMenuTrigger>
											<Button variant="ghost" size="icon">
												<MoreVertical class="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<form method="POST" action="?/updateRole" use:enhance>
												<input type="hidden" name="userId" value={member.userId} />
												<input
													type="hidden"
													name="role"
													value={member.role === 'admin' ? 'member' : 'admin'}
												/>
												<DropdownMenuItem
													onclick={(e) => e.currentTarget.closest('form')?.requestSubmit()}
												>
													{member.role === 'admin' ? 'Make Member' : 'Make Admin'}
												</DropdownMenuItem>
											</form>
											<form method="POST" action="?/removeMember" use:enhance>
												<input type="hidden" name="userId" value={member.userId} />
												<DropdownMenuItem
													class="text-destructive"
													onclick={(e) => {
														if (confirm('Are you sure you want to remove this member?')) {
															e.currentTarget.closest('form')?.requestSubmit();
														}
													}}
												>
													Remove Member
												</DropdownMenuItem>
											</form>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						{/each}
					{:else}
						<TableRow>
							<TableCell colspan={4} class="text-center text-muted-foreground">
								No members yet
							</TableCell>
						</TableRow>
					{/if}
				</TableBody>
			</Table>
		</CardContent>
	</Card>
</div>
