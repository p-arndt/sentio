<script lang="ts">
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import type { Emotion } from '$lib/types';
	import { Plus } from '@lucide/svelte';

	type Props = {
		emotions: Emotion[];
		onSelect: (emotionId: string) => void | Promise<void>;
		size?: 'default' | 'sm' | 'lg' | 'icon';
		variant?: 'default' | 'ghost' | 'outline';
		disabled?: boolean;
	};

	let { emotions, onSelect, size = 'default', variant = 'ghost', disabled = false }: Props = $props();

	let open = $state(false);
	let isSelecting = $state(false);

	async function handleSelect(emotionId: string) {
		isSelecting = true;
		try {
			await onSelect(emotionId);
			open = false;
		} catch (error) {
			console.error('Failed to save mood:', error);
		} finally {
			isSelecting = false;
		}
	}
</script>

<Popover bind:open>
	<PopoverTrigger>
		<Button {variant} {size} disabled={disabled || isSelecting}>
			<Plus class="h-4 w-4" />
		</Button>
	</PopoverTrigger>
	<PopoverContent class="w-auto p-3" align="center">
		<div class="space-y-2">
			<p class="text-sm font-medium">Quick mood log</p>
			{#if isSelecting}
				<div class="flex items-center justify-center p-4">
					<div class="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
				</div>
			{:else}
				<div class="grid grid-cols-4 gap-2">
					{#each emotions as emotion}
						<button
							type="button"
							class="flex flex-col items-center gap-1 rounded-lg border-2 border-transparent p-2 transition-all hover:border-primary hover:bg-accent disabled:opacity-50"
							onclick={() => handleSelect(emotion.id)}
							disabled={isSelecting}
							title={emotion.name}
						>
							<span class="text-2xl">{emotion.emoji}</span>
							<span class="text-xs font-medium">{emotion.name}</span>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	</PopoverContent>
</Popover>
