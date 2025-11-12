<script lang="ts">
	import { Alert } from '$lib/components/ui/alert';
	import AlertDescription from '$lib/components/ui/alert/alert-description.svelte';
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
	import { X, Mail } from '@lucide/svelte';

	type Props = {
		teamId: string;
		open: boolean;
		emailConfigured?: boolean;
	};

	let {
		teamId,
		open = $bindable(),
		emailConfigured = true
	}: Props & { emailConfigured?: boolean } = $props();

	let mode = $state<'existing' | 'email'>('existing');
	let searchQuery = $state('');
	let emailInput = $state('');
	let selectedUsers = $state<{ id: string; name: string; email: string }[]>([]);
	let selectedEmails = $state<string[]>([]);
	let isLoading = $state(false);
	let error = $state('');
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
				} catch (err) {
					console.error('Error fetching available users:', err);
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

	function addEmailToSelection() {
		if (!emailInput.trim()) return;
		const email = emailInput.trim().toLowerCase();

		// Validate email format
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			error = 'Invalid email format';
			return;
		}

		if (selectedEmails.includes(email)) {
			error = 'Email already selected';
			return;
		}

		selectedEmails = [...selectedEmails, email];
		emailInput = '';
		error = '';
	}

	function removeEmailFromSelection(email: string) {
		selectedEmails = selectedEmails.filter((e) => e !== email);
		error = '';
	}

	async function inviteMembers() {
		isLoading = true;
		error = '';

		try {
			// Add existing users to team
			for (const user of selectedUsers) {
				const response = await fetch(`/api/teams/${teamId}/members`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ userId: user.id, role: 'member' })
				});

				if (!response.ok) {
					const result = await response.json();
					console.error(`Failed to add ${user.name}:`, result.error);
				}
			}

			// Send invitations to new emails
			for (const email of selectedEmails) {
				const response = await fetch(`/api/teams/${teamId}/invite`, {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ email })
				});

				if (!response.ok) {
					const result = await response.json();
					console.error(`Failed to invite ${email}:`, result.error);
				}
			}

			// Refresh the page to show new members
			window.location.reload();
		} catch (err) {
			error = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			isLoading = false;
		}
	}

	function handleClose() {
		open = false;
		searchQuery = '';
		emailInput = '';
		selectedUsers = [];
		selectedEmails = [];
		error = '';
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Invite Members</DialogTitle>
			<DialogDescription>Add existing members or invite new users to your team</DialogDescription>
		</DialogHeader>

		<!-- Mode Tabs -->
		<div class="flex gap-2">
			<Button
				variant={mode === 'existing' ? 'default' : 'outline'}
				onclick={() => (mode = 'existing')}
				class="flex-1"
			>
				Existing Members
			</Button>
			<Button
				variant={mode === 'email' ? 'default' : 'outline'}
				onclick={() => {
					if (emailConfigured) mode = 'email';
				}}
				aria-disabled={!emailConfigured}
				disabled={!emailConfigured}
				class="flex-1"
			>
				<Mail class="mr-2 h-4 w-4" />
				Invite by Email
			</Button>
		</div>

		{#if !emailConfigured}
			<Alert variant="warning" class="mt-2">
				<AlertDescription>
					Email provider is not configured. Inviting by email is disabled.
				</AlertDescription>
			</Alert>
		{/if}

		{#if error}
			<div class="rounded-md bg-red-50 p-3 text-sm text-red-900 dark:bg-red-950 dark:text-red-100">
				{error}
			</div>
		{/if}

		<div class="grid gap-4">
			{#if mode === 'existing'}
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
										<div class="text-sm font-medium">{user.name}</div>
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
						<div class="max-h-48 space-y-1 overflow-y-auto rounded-md border p-2">
							{#each filteredUsers as user (user.id)}
								<button
									type="button"
									onclick={() => addUserToSelection(user)}
									disabled={isLoading}
									class="w-full rounded-md p-2 text-left transition-colors hover:bg-muted disabled:opacity-50"
								>
									<div class="text-sm font-medium">{user.name}</div>
									<div class="text-xs text-muted-foreground">{user.email}</div>
								</button>
							{/each}
						</div>
					</div>
				{:else if searchQuery && filteredUsers.length === 0}
					<div class="py-4 text-center text-sm text-muted-foreground">
						No users found matching your search
					</div>
				{/if}
			{:else}
				<!-- Email Invite Input -->
				<div class="grid gap-2">
					<Label for="email">Email Address</Label>
					<div class="flex gap-2">
						<Input
							id="email"
							type="email"
							placeholder="user@example.com"
							bind:value={emailInput}
							disabled={isLoading}
							onkeydown={(e) => {
								if (e.key === 'Enter') {
									addEmailToSelection();
								}
							}}
						/>
						<Button onclick={addEmailToSelection} disabled={isLoading || !emailInput.trim()}>
							Add
						</Button>
					</div>
				</div>

				<!-- Selected Emails -->
				{#if selectedEmails.length > 0}
					<div class="grid gap-2">
						<Label>Invited Emails ({selectedEmails.length})</Label>
						<div class="space-y-2">
							{#each selectedEmails as email (email)}
								<div class="flex items-center justify-between rounded-md border p-2">
									<div class="text-sm">{email}</div>
									<Button
										variant="ghost"
										size="sm"
										onclick={() => removeEmailFromSelection(email)}
										disabled={isLoading}
									>
										<X class="h-4 w-4" />
									</Button>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			{/if}
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={handleClose} disabled={isLoading}>Cancel</Button>
			<Button
				onclick={inviteMembers}
				disabled={(selectedUsers.length === 0 && selectedEmails.length === 0) || isLoading}
			>
				{#if isLoading}
					Inviting...
				{:else}
					Invite {selectedUsers.length + selectedEmails.length}
					{selectedUsers.length + selectedEmails.length === 1 ? 'Member' : 'Members'}
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
