<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle
	} from '$lib/components/ui/alert-dialog';
	import { Trash2 } from '@lucide/svelte';

	type Props = {
		open: boolean;
		userName: string;
		userEmail: string;
		isAdmin: boolean;
		isLastAdmin: boolean;
		onConfirm: () => void;
		onCancel: () => void;
	};

	let { open = $bindable(), userName, userEmail, isAdmin, isLastAdmin, onConfirm, onCancel }: Props =
		$props();
</script>

<AlertDialog bind:open>
	<AlertDialogContent>
		<AlertDialogHeader>
			<AlertDialogTitle class="flex items-center gap-2">
				<Trash2 class="h-5 w-5 text-destructive" />
				Delete User
			</AlertDialogTitle>
			<AlertDialogDescription class="space-y-3">
				<p>Are you sure you want to delete this user?</p>
				<div class="rounded-md bg-muted p-3 space-y-2">
					<p class="font-medium text-sm text-foreground">{userName}</p>
					<p class="text-xs text-muted-foreground">{userEmail}</p>
					{#if isAdmin}
						<p class="text-xs text-amber-600 font-medium">⚠ This user is an admin</p>
					{/if}
				</div>
				<div class="space-y-1">
					<p class="font-medium text-sm text-destructive">This action cannot be undone:</p>
					<ul class="text-xs text-muted-foreground space-y-1 ml-4">
						<li>• User will be removed from all teams</li>
						<li>• All their data will be permanently deleted</li>
						{#if isAdmin}
							<li>• Their admin privileges will be revoked</li>
						{/if}
					</ul>
				</div>
			</AlertDialogDescription>
		</AlertDialogHeader>
		<AlertDialogFooter>
			<AlertDialogCancel onclick={onCancel}>Cancel</AlertDialogCancel>
			<AlertDialogAction
				onclick={onConfirm}
				class="bg-destructive text-destructive-foreground hover:bg-destructive/90"
				disabled={isLastAdmin}
			>
				{#if isLastAdmin}
					Cannot Delete - Last Admin
				{:else}
					Delete User
				{/if}
			</AlertDialogAction>
		</AlertDialogFooter>
	</AlertDialogContent>
</AlertDialog>
