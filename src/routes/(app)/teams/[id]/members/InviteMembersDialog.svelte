<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { X } from '@lucide/svelte';

	type Props = {
		teamId: string;
		open: boolean;
	};

	let { teamId, open = $bindable() } = $props();

	let searchQuery = $state('');
	let selectedUsers = $state<{ id: string; name: string; email: string }[]>([]);
	let isLoading = $state(false);
	let availableUsers = $state<{ id: string; name: string; email: string }[]>([]);

	// Get list of available users (not already in team) when dialog opens
	$effect(() => {
		if (open && availableUsers.length === 0) {
			const fetchUsers = async () => {
				try {
					const response = await fetch(`/api/teams/${teamId}/available-members`);
					if (response.ok) {
						const result = await response.json();
						availableUsers = result.data || [];
					}
				} catch (error) {
					console.error('Error fetching available users:', error);
				}
			};
			fetchUsers();
		}
	});

	// Filter users based on search query
	let filteredUsers = $derived.by(() => {
		const query = searchQuery.toLowerCase();
		return availableUsers.filter(
			(user) =>
				!selectedUsers.some((u) => u.id === user.id) &&
				(user.name.toLowerCase().includes(query) || user.email.toLowerCase().includes(query))
		);
	});

	function addUserToSelection(user: { id: string; name: string; email: string }) {
		selectedUsers = [...selectedUsers, user];
		searchQuery = '';
	}

	function removeUserFromSelection(userId: string) {
		selectedUsers = selectedUsers.filter((u) => u.id !== userId);
	}

	async function inviteMembers() {
		if (selectedUsers.length === 0) return;

		isLoading = true;
		try {
			for (const user of selectedUsers) {
				const response = await fetch(`/api/teams/${teamId}/members`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId: user.id, role: 'member' })
				});

				if (!response.ok) {
					const error = await response.json();
					console.error(`Failed to invite ${user.name}:`, error);
				}
			}

			// Refresh the page to show new members
			window.location.reload();
		} catch (error) {
			console.error('Error inviting members:', error);
		} finally {
			isLoading = false;
		}
	}

	function handleClose() {
		open = false;
		searchQuery = '';
		selectedUsers = [];
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Invite Members</DialogTitle>
			<DialogDescription>Search and add members to your team</DialogDescription>
		</DialogHeader>

		<div class="grid gap-4">
			<!-- Search Input -->
			<div class="grid gap-2">
				<Label for="search">Search Users</Label>
				<Input
					id="search"
					placeholder="Search by name or email..."
					bind:value={searchQuery}
					disabled={isLoading}
				/>
			</div>

			<!-- Selected Users -->
			{#if selectedUsers.length > 0}
				<div class="grid gap-2">
					<Label>Selected Users ({selectedUsers.length})</Label>
					<div class="space-y-2">
						{#each selectedUsers as user (user.id)}
							<div class="flex items-center justify-between rounded-md border p-2">
								<div>
									<div class="font-medium text-sm">{user.name}</div>
									<div class="text-xs text-muted-foreground">{user.email}</div>
								</div>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => removeUserFromSelection(user.id)}
									disabled={isLoading}
								>
									<X class="h-4 w-4" />
								</Button>
							</div>
						{/each}
					</div>
				</div>
			{/if}

			<!-- Available Users List -->
			{#if filteredUsers.length > 0}
				<div class="grid gap-2">
					<Label>Available Users</Label>
					<div class="space-y-1 max-h-48 overflow-y-auto border rounded-md p-2">
						{#each filteredUsers as user (user.id)}
							<button
								type="button"
								onclick={() => addUserToSelection(user)}
								disabled={isLoading}
								class="w-full text-left rounded-md p-2 hover:bg-muted disabled:opacity-50 transition-colors"
							>
								<div class="font-medium text-sm">{user.name}</div>
								<div class="text-xs text-muted-foreground">{user.email}</div>
							</button>
						{/each}
					</div>
				</div>
			{:else if searchQuery && filteredUsers.length === 0}
				<div class="text-sm text-muted-foreground text-center py-4">
					No users found matching your search
				</div>
			{/if}
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={handleClose} disabled={isLoading}>
				Cancel
			</Button>
			<Button
				onclick={inviteMembers}
				disabled={selectedUsers.length === 0 || isLoading}
			>
				{isLoading ? 'Inviting...' : `Invite ${selectedUsers.length} ${selectedUsers.length === 1 ? 'Member' : 'Members'}`}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
