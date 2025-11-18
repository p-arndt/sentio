<script lang="ts">
	import { Switch } from '$lib/components/ui/switch';
	import { Ghost, Globe } from '@lucide/svelte';

	let {
		teamSharingPreference = $bindable<'public' | 'anonymous'>(),
		teamSharingOverrides = $bindable<Record<string, 'public' | 'anonymous'> | undefined>(undefined),
		teamId
	}: {
		teamSharingPreference: 'public' | 'anonymous';
		teamSharingOverrides?: Record<string, 'public' | 'anonymous'>;
		teamId: string;
	} = $props();

	let teamSharingSaving = $state(false);
	let teamSharingError = $state<string | null>(null);

	let isPreferenceAnon = $derived(teamSharingPreference == 'anonymous');

	async function handleTeamSharingPreferenceChange(value: 'public' | 'anonymous') {
		if (teamSharingSaving) return;
		const previous = teamSharingPreference;
		teamSharingPreference = value;
		teamSharingSaving = true;
		teamSharingError = null;
		try {
			const overrides = { ...(teamSharingOverrides || {}) };
			overrides[teamId] = value;
			const response = await fetch('/api/user/preferences', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ teamSharingOverrides: overrides })
			});

			if (!response.ok) {
				throw new Error('Failed to update sharing preference');
			}

			teamSharingOverrides = overrides;
		} catch (error) {
			console.error(error);
			teamSharingError =
				error instanceof Error ? error.message : 'Unable to update sharing preference';
			teamSharingPreference = previous;
		} finally {
			teamSharingSaving = false;
		}
	}
</script>

<div class="flex items-center space-x-5">
	<span class="flex items-center space-x-2 text-sm {!isPreferenceAnon && 'text-accent-variant'}">
		<Globe class="size-5" />
		<span>Public</span>
	</span>
	<span>
		<Switch
			checked={isPreferenceAnon}
			onCheckedChange={(checked) =>
				handleTeamSharingPreferenceChange(checked ? 'anonymous' : 'public')}
			disabled={teamSharingSaving}
		/>
	</span>
	<span class="flex items-center space-x-2 text-sm {isPreferenceAnon && 'text-accent-variant'}">
		<Ghost class="size-5" />
		<span>Anonymous</span>
	</span>
</div>

{#if teamSharingError}
	<p class="text-sm text-destructive">{teamSharingError}</p>
{:else}
	<p class="text-xs text-muted-foreground">You can still override this for any individual entry.</p>
{/if}
