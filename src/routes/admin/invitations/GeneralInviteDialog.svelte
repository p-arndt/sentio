<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Mail, AlertCircle, CheckCircle, Loader2 } from '@lucide/svelte';

	type Props = {
		open: boolean;
		emailConfigured?: boolean;
	};

	let { open = $bindable(), emailConfigured = true }: Props = $props();

	let email = $state('');
	let isLoading = $state(false);
	let error = $state('');
	let success = $state(false);

	async function handleInvite() {
		if (!emailConfigured) {
			error = 'Email provider is not configured.';
			return;
		}
		if (!email) {
			error = 'Please enter an email address';
			return;
		}

		isLoading = true;
		error = '';

		try {
			const response = await fetch('/api/invitations/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email })
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Failed to send invitation';
				return;
			}

			success = true;
			email = '';

			// Close dialog after 2 seconds
			setTimeout(() => {
				success = false;
				open = false;
			}, 2000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
		} finally {
			isLoading = false;
		}
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'Enter' && !isLoading) {
			handleInvite();
		}
	}
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>Invite User to Platform</DialogTitle>
			<DialogDescription>
				Send an invitation for users to join your platform
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4">
			{#if success}
				<div class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100">
					<CheckCircle class="h-5 w-5 shrink-0" />
					<div>
						<p class="font-medium">Invitation sent!</p>
						<p class="text-sm">The user will receive an email with the invitation link.</p>
					</div>
				</div>
			{:else}
				<div class="space-y-3">
					<div class="space-y-2">
						<Label for="email" class="text-sm font-medium">Email Address</Label>
						<div class="relative">
							<Mail class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
							<Input
								id="email"
								type="email"
								placeholder="user@example.com"
								bind:value={email}
								onkeydown={handleKeyDown}
								disabled={isLoading}
								class="pl-10"
							/>
						</div>
					</div>

					{#if error}
						<div class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
							<AlertCircle class="mt-0.5 h-4 w-4 shrink-0" />
							<p class="text-sm">{error}</p>
						</div>
					{/if}

					<div class="flex gap-2 pt-4">
						<Button
							variant="outline"
							class="flex-1"
							disabled={isLoading}
							onclick={() => (open = false)}
						>
							Cancel
						</Button>
						<Button class="flex-1" disabled={isLoading || !emailConfigured} onclick={handleInvite}>
							{#if isLoading}
								<Loader2 class="mr-2 h-4 w-4 animate-spin" />
								Sending...
							{:else}
								Send Invitation
							{/if}
						</Button>
					</div>
				</div>
			{/if}
		</div>
	</DialogContent>
</Dialog>
