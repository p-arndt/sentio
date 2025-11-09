<script lang="ts">
	import { goto } from '$app/navigation';
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Mail, AlertCircle, CheckCircle, Loader2 } from '@lucide/svelte';
	import type { PageData } from './$types';

	type Props = {
		data: PageData;
	};
	let { data }: Props = $props();

	let isLoading = $state(false);
	let error = $state('');
	let success = $state(false);
	let invitationType = $state<'team' | 'general' | null>(null);

	async function acceptInvitation() {
		isLoading = true;
		error = '';

		try {
			const response = await fetch('/api/invitations/accept', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token: data.token })
			});

			const result = await response.json();

			if (!response.ok) {
				error = result.error || 'Failed to accept invitation';
				return;
			}

			success = true;
			invitationType = result.type;
			
			// Redirect to appropriate page after 2 seconds
			setTimeout(() => {
				if (result.type === 'team') {
					goto(`/teams/${result.teamId}`);
				} else {
					goto('/');
				}
			}, 2000);
		} catch (err) {
			error = err instanceof Error ? err.message : 'An unexpected error occurred';
		} finally {
			isLoading = false;
		}
	}

	// Check if user is logged in
	$effect(() => {
		const checkSession = async () => {
			const { data: session } = await authClient.getSession();
			if (!session) {
				// Redirect to register with invitation token so new users can sign up
				goto(`/register?invitationToken=${data.token}`);
			}
		};
		checkSession();
	});
</script>

<svelte:head>
	<title>Accept Invitation - Sentio</title>
</svelte:head>
<div class="flex min-h-screen items-center justify-center p-4">
	<Card class="w-full max-w-md">
		<CardHeader class="text-center">
			<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary">
				<Mail class="h-8 w-8 text-primary-foreground" />
			</div>
			<CardTitle class="text-2xl font-bold">
				{#if invitationType === 'general'}
					Platform Invitation
				{:else}
					Team Invitation
				{/if}
			</CardTitle>
		</CardHeader>

		<CardContent>
			{#if success}
				<div class="space-y-4">
					<div class="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 dark:border-green-800 dark:bg-green-950 dark:text-green-100">
						<CheckCircle class="h-5 w-5 shrink-0" />
						<div>
							<p class="font-medium">Invitation Accepted!</p>
							<p class="text-sm">
								{#if invitationType === 'general'}
									Redirecting to dashboard...
								{:else}
									Redirecting to your team...
								{/if}
							</p>
						</div>
					</div>
				</div>
			{:else}
				<div class="space-y-4">
					<p class="text-center text-muted-foreground">
						{#if invitationType === 'general'}
							Click the button below to accept this invitation and join the platform.
						{:else}
							Click the button below to accept this invitation and join the team.
						{/if}
					</p>

					{#if error}
						<div class="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100">
							<AlertCircle class="mt-0.5 h-5 w-5 shrink-0" />
							<p class="text-sm">{error}</p>
						</div>
					{/if}

					<Button
						onclick={acceptInvitation}
						disabled={isLoading}
						class="w-full"
						size="lg"
					>
						{#if isLoading}
							<Loader2 class="mr-2 h-4 w-4 animate-spin" />
							Accepting...
						{:else}
							Accept Invitation
						{/if}
					</Button>
				</div>
			{/if}
		</CardContent>
	</Card>
</div>
