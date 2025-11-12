<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip';
	import type { Emotion } from '$lib/types';
	import { MessageCircle, Plus } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	type Props = {
		emotions: Emotion[];
		onSelect: (emotionId: string, comment?: string) => void | Promise<void>;
		size?: 'default' | 'sm' | 'lg' | 'icon';
		variant?: 'default' | 'ghost' | 'outline';
		disabled?: boolean;
		open?: boolean;
		onOpenChange?: (open: boolean) => void;
		requireComment?: boolean;
	};

	let {
		emotions,
		onSelect,
		size = 'default',
		variant = 'ghost',
		disabled = false,
		open = $bindable(false),
		onOpenChange,
		requireComment = false
	}: Props = $props();

	let selectedEmotionId = $state<string | undefined>(undefined);
	let comment = $state('');
	let showComment = $state(false);
	let isSaving = $state(false);

	function handleOpenChange(newOpen: boolean) {
		open = newOpen;
		if (onOpenChange) {
			onOpenChange(newOpen);
		}
	}

	async function handleEmotionSelect(emotionId: string) {
		selectedEmotionId = emotionId;
		// If comment is required, show comment field
		if (requireComment) {
			showComment = true;
			return;
		}

		// If comment field is not open, auto-save immediately for smooth UX
		if (!showComment) {
			await handleQuickSave(emotionId);
		}
	}

	async function handleQuickSave(emotionId: string) {
		if (!emotionId) return;

		// Validate comment if required
		if (requireComment && !comment.trim()) {
			return;
		}

		isSaving = true;
		try {
			await onSelect(emotionId, comment || undefined);
			open = false;
			selectedEmotionId = undefined;
			comment = '';
			showComment = false;
		} catch (err) {
			console.error('Failed to save mood:', err);
			toast.error('Failed to save mood. Please try again.');
		} finally {
			isSaving = false;
		}
	}

	async function handleSaveWithComment() {
		if (!selectedEmotionId) return;
		await handleQuickSave(selectedEmotionId);
	}
</script>

<Popover {open} onOpenChange={handleOpenChange}>
	<div style="display: inline-flex; align-items: center; justify-content: center;">
		<PopoverTrigger disabled={disabled || isSaving} class={buttonVariants({ variant, size })} style="display: flex; align-items: center; justify-content: center;">
			<Plus class="h-4 w-4" />
		</PopoverTrigger>
	</div>
	<PopoverContent class="w-80 p-4" align="center">
		<div class="space-y-4">
			<div>
				<h4 class="mb-3 text-sm font-medium">How are you feeling?</h4>
				<TooltipProvider delayDuration={300} skipDelayDuration={0}>
					<div class="flex flex-wrap justify-center gap-2">
						{#each emotions as emotion (emotion.id)}
							<Tooltip disableHoverableContent={true}>
								<TooltipTrigger
									class={[
										buttonVariants({
											variant: selectedEmotionId === emotion.id ? 'default' : 'outline',
											size: 'icon'
										}),
										'h-12 w-12',
										'relative border-2 transition-all duration-200 hover:scale-110',
										selectedEmotionId === emotion.id && 'shadow-lg ring-2 ring-ring ring-offset-2'
									]}
									style={selectedEmotionId !== emotion.id
										? `border-color: ${emotion.color}30; background-color: ${emotion.color}10;`
										: ''}
									onclick={() => handleEmotionSelect(emotion.id)}
								>
									<span class="text-2xl">{emotion.emoji}</span>
								</TooltipTrigger>
								<TooltipContent side="top">
									<p class="text-xs">{emotion.name}</p>
								</TooltipContent>
							</Tooltip>
						{/each}
					</div>
				</TooltipProvider>
			</div>
			<div class="border-t pt-2">
				{#if showComment}
					<div class="space-y-2">
						<Textarea
							bind:value={comment}
							placeholder="How are you feeling? Any thoughts to share?"
							class={[
								'min-h-20 resize-none text-sm',
								requireComment && !comment.trim() ? 'border-orange-400' : ''
							]}
							autofocus
						/>
						{#if requireComment && !comment.trim()}
							<p class="flex items-center space-x-2 text-xs font-medium text-orange-600">
								<MessageCircle class="mr-1 inline-block h-3 w-3" />
								Comment is required
							</p>
						{/if}
						<div class="flex justify-end gap-2">
							<Button
								variant="ghost"
								size="sm"
								onclick={() => {
									showComment = false;
									comment = '';
								}}
							>
								Cancel
							</Button>
							<Button
								size="sm"
								onclick={handleSaveWithComment}
								disabled={!selectedEmotionId || isSaving || (requireComment && !comment.trim())}
							>
								{isSaving ? 'Saving...' : 'Save'}
							</Button>
						</div>
					</div>
				{:else}
					<div class="flex items-center justify-between">
						<Button variant="ghost" size="sm" onclick={() => (showComment = true)} class="text-xs">
							<MessageCircle class="mr-1.5 h-3 w-3" />
							{comment ? 'Edit comment' : 'Add comment'}
						</Button>
						{#if selectedEmotionId}
							<Button
								size="sm"
								onclick={handleSaveWithComment}
								disabled={isSaving || (requireComment && !showComment)}
							>
								{isSaving ? 'Saving...' : 'Save'}
							</Button>
						{/if}
					</div>
				{/if}
			</div>
		</div>
	</PopoverContent>
</Popover>
