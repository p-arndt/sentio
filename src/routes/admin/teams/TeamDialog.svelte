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
	import { Textarea } from '$lib/components/ui/textarea';
	import { enhance } from '$app/forms';

	type Team = {
		id: string;
		name: string;
		description: string | null;
		createdBy: string;
		createdAt: Date;
		updatedAt: Date;
		memberCount: number;
	};

	type Props = {
		open: boolean;
		team?: Team | null;
	};

	let { open = $bindable(), team = null }: Props = $props();

	let name = $state('');
	let description = $state('');
	let isSubmitting = $state(false);

	$effect(() => {
		if (team) {
			name = team.name;
			description = team.description || '';
		} else {
			name = '';
			description = '';
		}
	});

	function handleClose() {
		open = false;
		name = '';
		description = '';
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<DialogHeader>
			<DialogTitle>{team ? 'Edit Team' : 'Create Team'}</DialogTitle>
			<DialogDescription>
				{team ? 'Update the team details below' : 'Add a new team to your organization'}
			</DialogDescription>
		</DialogHeader>

		<form
			method="POST"
			action="?/{team ? 'updateTeam' : 'createTeam'}"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					handleClose();
				};
			}}
		>
			{#if team}
				<input type="hidden" name="teamId" value={team.id} />
			{/if}

			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="name">Team Name</Label>
					<Input id="name" name="name" bind:value={name} required placeholder="e.g., Engineering" />
				</div>

				<div class="grid gap-2">
					<Label for="description">Description (optional)</Label>
					<Textarea
						id="description"
						name="description"
						bind:value={description}
						placeholder="What does this team do?"
						rows={3}
					/>
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onclick={handleClose} disabled={isSubmitting}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : team ? 'Update' : 'Create'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
