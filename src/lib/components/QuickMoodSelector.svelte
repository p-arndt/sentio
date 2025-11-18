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
	<PopoverContent
		class={['w-80 p-4', teamId && anonymousMode && 'border-2 border-dashed border-white/50']}
		align="center"
		trapFocus={false}
	>
		<div class="relative">
			<MoodEntryForm
				{emotions}
				quickEntry={true}
				{requireComment}
				{date}
				{teamId}
				teamSharingDefault={effectivePreference}
				teamSharingOverrides={teamId ? { [teamId]: effectivePreference } : {}}
				onAnonymousModeChange={(isAnonymous) => {
					anonymousMode = isAnonymous;
				}}
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
					// Show badge toasts if any were granted
					for (const r of results) {
						for (const b of r.grantedAchievements ?? []) {
							toast.success(`Achievement earned: ${b.achievement?.name}`);
						}
					}
				}}
				onError={(err) => {
					console.error('Failed to save mood:', err);
					toast.error('Failed to save mood. Please try again.');
				}}
			/>
		</div>
	</PopoverContent>
</Popover>
