<script lang="ts">
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';
	import { Globe2 } from '@lucide/svelte';

	interface Props {
		label: string;
		loading?: boolean;
		disabled?: boolean;
	}

	const { label, loading = false, disabled = false }: Props = $props();

	let isLoading = $state(false);
	let error = $state('');

	async function signInWithOIDC() {
		isLoading = true;
		error = '';

		try {
			await authClient.signIn.oauth2({
				providerId: 'oidc',
				callbackURL: '/'
			});
		} catch (e: any) {
			error = e.message || 'Sign in failed';
			console.error('OIDC sign-in error:', e);
		} finally {
			isLoading = false;
		}
	}
</script>

<div>
	<Button
		onclick={signInWithOIDC}
		disabled={disabled || isLoading || loading}
		class="h-12 w-full border-border bg-background text-foreground transition-all duration-200 hover:bg-accent disabled:transform-none disabled:cursor-not-allowed disabled:opacity-50"
		variant="outline"
	>
		{#if isLoading || loading}
			<div class="flex items-center gap-2">
				<div class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
				Signing in...
			</div>
		{:else}
			<div class="flex items-center gap-2">
				<Globe2 class="h-5 w-5" />
				{label}
			</div>
		{/if}
	</Button>
	{#if error}
		<p class="mt-2 text-sm text-destructive">{error}</p>
	{/if}
</div>
