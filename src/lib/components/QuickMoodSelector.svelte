<script lang="ts">
	import MoodEntryForm from '$lib/components/MoodEntryForm.svelte';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import type { Emotion, MoodSharePreference } from '$lib/types';
	import { Ghost, Plus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	type Props = {
		emotions: Emotion[];
		date?: Date;
		teamId?: string;
		teamSharingPreference?: MoodSharePreference;
		size?: 'default' | 'sm' | 'lg' | 'icon';
		variant?: 'default' | 'ghost' | 'outline';
		disabled?: boolean;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		requireComment?: boolean;
	};

	let {
		emotions,
		date,
		teamId,
		teamSharingPreference = 'public',
		size = 'default',
		variant = 'ghost',
		disabled = false,
		open = $bindable(false),
		onOpenChange,
		requireComment = false
	}: Props = $props();
	let isSaving = $state(false);
	let anonymousMode = $state(teamSharingPreference === 'anonymous');
	let lastPreference = $state(teamSharingPreference);

	$effect(() => {
		if (teamSharingPreference !== lastPreference) {
			lastPreference = teamSharingPreference;
			anonymousMode = teamSharingPreference === 'anonymous';
		}
	});

	let effectivePreference = $derived<MoodSharePreference>(anonymousMode ? 'anonymous' : 'public');

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (onOpenChange) {
			onOpenChange(newOpen);
		}
	}
</script>

<Popover {open} onOpenChange={handleOpenChange}>
	<PopoverTrigger disabled={disabled || isSaving} class={buttonVariants({ variant, size })}>
		<Plus class="h-4 w-4" />
	</PopoverTrigger>
	<PopoverContent class="w-80 p-4" align="center" trapFocus={false}>
		<div class="relative">
			<MoodEntryForm
				{emotions}
				quickEntry={true}
				{requireComment}
				{date}
				{teamId}
				teamSharingDefault={effectivePreference}
				teamSharingOverrides={teamId ? { [teamId]: effectivePreference } : {}}
				onSuccess={async (results) => {
					isSaving = true;
					try {
						open = false;
						if (onOpenChange) onOpenChange(open);
					} catch (err) {
						console.error('Parent onSelect failed:', err);
					} finally {
						isSaving = false;
					}
				}}
				onError={(err) => {
					console.error('Failed to save mood:', err);
					toast.error('Failed to save mood. Please try again.');
				}}
			/>
			<!-- {#if teamId}
				<Button
					size="icon"
					variant="ghost"
					aria-pressed={anonymousMode}
					aria-label="Toggle anonymous sharing"
					class={`absolute right-2 -bottom-1 flex items-center rounded-full border text-xs transition ${
						anonymousMode
							? 'border-primary bg-primary text-primary-foreground'
							: 'border-muted-foreground/30 bg-muted text-muted-foreground'
					}`}
					onclick={() => (anonymousMode = !anonymousMode)}
					disabled={isSaving}
				>
					<Ghost class="h-3 w-3" />
				</Button>
			{/if} -->
		</div>
	</PopoverContent>
</Popover>
