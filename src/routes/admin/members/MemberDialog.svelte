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
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { enhance } from '$app/forms';

	type Team = {
		id: string;
		name: string;
		description: string | null;
	};

	type User = {
		id: string;
		name: string;
		email: string;
	};

	type Props = {
		open: boolean;
		teams: Team[];
		users: User[];
	};

	let { open = $bindable(), teams, users }: Props = $props();

	let selectedTeamId = $state('');
	let selectedUserId = $state('');
	let selectedRole = $state('member');
	let isSubmitting = $state(false);

	function handleClose() {
		open = false;
		selectedTeamId = '';
		selectedUserId = '';
		selectedRole = 'member';
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>Add Team Member</DialogTitle>
			<DialogDescription>Add a user to a team with a specific role</DialogDescription>
		</DialogHeader>

		<form
			method="POST"
			action="?/addMember"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					handleClose();
				};
			}}
		>
			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="teamId">Team</Label>
					<Select name="teamId" type="single" bind:value={selectedTeamId} required>
						<SelectTrigger>
							{selectedTeamId
								? teams.find((team) => team.id === selectedTeamId)?.name
								: 'Select a team'}
						</SelectTrigger>
						<SelectContent>
							{#each teams as team}
								<SelectItem value={team.id}>{team.name}</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>

				<div class="grid gap-2">
					<Label for="userId">User</Label>
					<Select name="userId" type="single" bind:value={selectedUserId} required>
						<SelectTrigger>
							{selectedUserId
								? users.find((user) => user.id === selectedUserId)?.name
								: 'Select a user'}
						</SelectTrigger>
						<SelectContent>
							{#each users as user}
								<SelectItem value={user.id}>
									{user.name} ({user.email})
								</SelectItem>
							{/each}
						</SelectContent>
					</Select>
				</div>

				<div class="grid gap-2">
					<Label for="role">Role</Label>
					<Select name="role" type="single" bind:value={selectedRole}>
						<SelectTrigger>
							{selectedRole === 'admin' ? 'Admin' : 'Member'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="member">Member</SelectItem>
							<SelectItem value="admin">Admin</SelectItem>
						</SelectContent>
					</Select>
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onclick={handleClose} disabled={isSubmitting}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Adding...' : 'Add Member'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
