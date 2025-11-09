<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Mail, Users, Plus } from '@lucide/svelte';
	import type { PageData } from './$types';
	import GeneralInviteDialog from './GeneralInviteDialog.svelte';

	type Props = {
		data: PageData & { emailConfigured?: boolean };
	};
	let { data }: Props = $props();

	let showInviteDialog = $state(false);
	let pending = $state<Array<any>>([]);
	let isLoadingPending = $state(false);

	async function loadPending() {
		isLoadingPending = true;
		try {
			const res = await fetch('/api/invitations/pending');
			if (!res.ok) throw new Error('Failed to load pending invitations');
			const json = await res.json();
			pending = json.invitations || [];
		} catch (err) {
			console.error(err);
		} finally {
			isLoadingPending = false;
		}
	}

	async function resendInvitation(id: string) {
		try {
			const res = await fetch(`/api/invitations/${id}/resend`, { method: 'POST' });
			if (!res.ok) {
				const j = await res.json();
				throw new Error(j.error || 'Failed to resend');
			}
			// no change in DB for resend; show a quick toast (console for now) and reload pending
			await loadPending();
			console.log('Resent invitation', id);
		} catch (err) {
			console.error(err);
		}
	}

	async function deleteInvitation(id: string) {
		try {
			const res = await fetch(`/api/invitations/${id}`, { method: 'DELETE' });
			if (!res.ok) {
				const j = await res.json();
				throw new Error(j.error || 'Failed to delete');
			}

			// remove locally
			pending = pending.filter((p) => p.id !== id);
		} catch (err) {
			console.error(err);
		}
	}

	function openInviteDialog() {
		if (!data?.emailConfigured) return;
		showInviteDialog = true;
	}

	// Load pending invitations on mount
	$effect(() => {
		loadPending();
	});
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-medium">Invitations</h3>
			<p class="text-muted-foreground text-sm">Invite users to join the platform</p>
		</div>
		<Button onclick={openInviteDialog} aria-disabled={!data?.emailConfigured} disabled={!data?.emailConfigured}>
			<Plus class="mr-2 h-4 w-4" />
			Send Invitation
		</Button>
	</div>

	{#if !data?.emailConfigured}
		<div class="my-4">
			<div class="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800">
				Email provider is not configured. Invitations are disabled until SMTP settings are provided in Admin → Settings.
			</div>
		</div>
	{/if}

	<div class="grid gap-4 md:grid-cols-2">
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2 text-base">
					<Mail class="h-4 w-4" />
					Platform Invitations
				</CardTitle>
				<CardDescription>Invite users to join the platform</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-muted-foreground text-sm">
					Send general invitations to invite users to create an account and join the platform. They will not be assigned to any team initially.
				</p>
				<div class="mt-4 space-y-2 rounded-lg bg-muted p-3">
					<p class="text-xs font-medium">Features:</p>
					<ul class="space-y-1 text-xs text-muted-foreground">
						<li>✓ Platform-wide access</li>
						<li>✓ User creates account on first login</li>
						<li>✓ Can join teams afterwards</li>
						<li>✓ Expires in 7 days</li>
					</ul>
				</div>
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2 text-base">
					<Mail class="h-4 w-4" />
					Pending Invitations
				</CardTitle>
				<CardDescription>Invitations that are pending (not accepted and not expired)</CardDescription>
			</CardHeader>
			<CardContent>
				{#if isLoadingPending}
					<p class="text-sm text-muted-foreground">Loading...</p>
				{:else}
					{#if pending.length === 0}
						<p class="text-sm text-muted-foreground">No pending invitations</p>
					{:else}
						<div class="space-y-2">
							{#each pending as inv}
								<div class="flex items-center justify-between rounded-md bg-card p-3">
									<div>
										<p class="font-medium">{inv.email} {inv.type === 'team' ? `· ${inv.teamName || 'Team'}` : '· General'}</p>
										<p class="text-xs text-muted-foreground">Created: {new Date(inv.createdAt).toLocaleString()} — Expires: {new Date(inv.expiresAt).toLocaleString()}</p>
									</div>
									<div class="flex gap-2">
										<Button variant="outline" size="sm" onclick={() => resendInvitation(inv.id)}>Resend</Button>
										<Button variant="destructive" size="sm" onclick={() => deleteInvitation(inv.id)}>Delete</Button>
									</div>
								</div>
							{/each}
						</div>
					{/if}
				{/if}
			</CardContent>
		</Card>

		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2 text-base">
					<Users class="h-4 w-4" />
					Team Invitations
				</CardTitle>
				<CardDescription>Invite users to specific teams</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-muted-foreground text-sm">
					Send team-specific invitations to invite users to join a particular team. Go to the Teams page to send team invitations.
				</p>
				<div class="mt-4 space-y-2 rounded-lg bg-muted p-3">
					<p class="text-xs font-medium">Features:</p>
					<ul class="space-y-1 text-xs text-muted-foreground">
						<li>✓ Team-specific access</li>
						<li>✓ Automatic team membership</li>
						<li>✓ Can join other teams later</li>
						<li>✓ Expires in 7 days</li>
					</ul>
				</div>
				<Button variant="outline" class="mt-4 w-full" onclick={() => (window.location.href = '/admin/teams')}>
					Go to Teams
				</Button>
			</CardContent>
		</Card>
	</div>
</div>

<GeneralInviteDialog bind:open={showInviteDialog} emailConfigured={data.emailConfigured} />
