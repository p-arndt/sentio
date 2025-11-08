<script lang="ts">
	import { Card } from '$lib/components/ui/card';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip';
	import type { EmotionWithIcon } from '$lib/data/emotions';
	import type { CalendarEntry } from '$lib/types';
	import { cn } from '$lib/utils';
	import { MessageCircle } from '@lucide/svelte';
	import CommentDialog from './CommentDialog.svelte';
	import EmotionSelector from './EmotionSelector.svelte';

	type Props = {
		date: Date;
		emotions: EmotionWithIcon[];
		entry?: CalendarEntry;
		isToday?: boolean;
		isEditable?: boolean;
		onEmotionSelect: (emotion: EmotionWithIcon, date: Date) => void;
		onCommentSave: (comment: string, date: Date) => void;
		className?: string;
	};

	let {
		date,
		emotions,
		entry,
		isToday = false,
		isEditable = true,
		onEmotionSelect,
		onCommentSave,
		className
	}: Props = $props();
	let popoverOpen = $state(false);

	function handleEmotionSelect(emotion: EmotionWithIcon) {
		onEmotionSelect(emotion, date);
		popoverOpen = false;
	}

	function handleCommentSave(comment: string) {
		onCommentSave(comment, date);
	}

	const isWeekend = date.getDay() === 0 || date.getDay() === 6;

	// Find the emotion with icon
	const emotionWithIcon = $derived(
		entry?.emotion ? emotions.find((e) => e.id === entry.emotion?.id) : undefined
	);
</script>

<Popover bind:open={popoverOpen}>
	<PopoverTrigger disabled={!isEditable}>
		<Card
			class={cn(
				'group relative h-20 transition-all duration-200 md:h-28',
				isEditable && 'cursor-pointer border-2 hover:border-primary/40 hover:shadow-lg',
				!isEditable && 'cursor-not-allowed opacity-60',
				isToday && 'border-primary ring-2 ring-primary/50 ring-offset-2',
				isWeekend && 'bg-muted/30',
				emotionWithIcon && isEditable && 'hover:scale-[1.02]',
				className
			)}
		>
			<div class="flex h-full items-center justify-center p-1 md:p-2">
				{#if emotionWithIcon}
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger>
								<div class="flex w-full flex-col items-center gap-0.5 md:gap-1">
									<div
										class="rounded-full p-1.5 transition-all group-hover:scale-110 md:p-3"
										style="background-color: {emotionWithIcon.color}15;"
									>
										<emotionWithIcon.icon
											size={24}
											class="md:hidden"
											style="color: {emotionWithIcon.color}"
											strokeWidth={2.5}
										/>
										<emotionWithIcon.icon
											size={32}
											class="hidden md:block"
											style="color: {emotionWithIcon.color}"
											strokeWidth={2.5}
										/>
									</div>
									{#if entry?.comment}
										<div
											class="flex items-center gap-1 text-[10px] text-muted-foreground md:text-xs"
										>
											<MessageCircle size={10} class="md:hidden" />
											<MessageCircle size={12} class="hidden md:block" />
										</div>
									{/if}
								</div>
							</TooltipTrigger>
							<TooltipContent side="top" class="max-w-xs">
								<p class="font-medium">{emotionWithIcon.name}</p>
								{#if entry?.comment}
									<p class="mt-1 text-sm text-muted-foreground">{entry.comment}</p>
								{/if}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				{:else}
					<div
						class="flex flex-col items-center gap-1 text-muted-foreground transition-colors group-hover:text-foreground md:gap-2"
					>
						<div class="text-xl font-light md:text-2xl">+</div>
						<div class="text-[9px] opacity-0 transition-opacity group-hover:opacity-100 md:text-xs">
							Add
						</div>
					</div>
				{/if}
			</div>
		</Card>
	</PopoverTrigger>
	<PopoverContent class="w-auto p-4" align="center">
		<div class="space-y-4">
			<div>
				<h4 class="mb-3 text-sm font-medium">How are you feeling?</h4>
				<EmotionSelector
					{emotions}
					selectedEmotion={emotionWithIcon}
					onSelect={handleEmotionSelect}
					size="md"
					showLabels={true}
					className="justify-center"
				/>
			</div>
			<div class="border-t pt-2">
				<CommentDialog comment={entry?.comment} onSave={handleCommentSave} />
			</div>
		</div>
	</PopoverContent>
</Popover>
