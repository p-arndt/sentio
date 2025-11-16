<script lang="ts">
	import MoodEntryForm from '$lib/components/MoodEntryForm.svelte';
	import { buttonVariants } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import type { Emotion } from '$lib/types';
	import { Plus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	type Props = {
		emotions: Emotion[];
		date?: Date;
		teamId?: string;
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
		size = 'default',
		variant = 'ghost',
		disabled = false,
		open = $bindable(false),
		onOpenChange,
		requireComment = false
	}: Props = $props();
	let isSaving = $state(false);

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
		<MoodEntryForm
			{emotions}
			quickEntry={true}
			{requireComment}
			{date}
			{teamId}
			onSuccess={async (results) => {
				isSaving = true;
				try {
					// Keep onSelect compatibility for parent components
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
	</PopoverContent>
</Popover>
