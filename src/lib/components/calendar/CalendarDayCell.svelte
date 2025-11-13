<script lang="ts">
	import QuickMoodSelector from '$lib/components/QuickMoodSelector.svelte';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip';
	import type { Emotion, MoodEntryWithDetails } from '$lib/types';
	import { cn } from '$lib/utils';
	import { isToday, toDateString } from '$lib/utils/date';
	import { MessageCircle } from '@lucide/svelte';

	type Props = {
		day: Date;
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		userId: string;
		currentUserId?: string;
		onQuickAdd: (emotionId: string, day: Date, userId: string, comment?: string) => void;
		onEdit?: (day: Date, mood: MoodEntryWithDetails, userId: string) => void;
		isSubmitting?: boolean;
		requireComment?: boolean;
	};

	let {
		day,
		emotions,
		entries,
		userId,
		currentUserId,
		onQuickAdd,
		onEdit,
		isSubmitting = false,
		requireComment = false
	}: Props = $props();

	let moods = $derived(
		entries.filter((e) => e.userId === userId && toDateString(e.date) === toDateString(day))
	);
	let today = $derived(isToday(day));
	let isCurrentUser = $derived(userId === currentUserId);
	let isWeekend = $derived(day.getDay() === 0 || day.getDay() === 6);

	let popoverOpen = $state(false);

	function handleMoodClick(mood: MoodEntryWithDetails) {
		if (isCurrentUser && onEdit) {
			onEdit(day, mood, userId);
		}
	}

	function handleCellClick(e: MouseEvent) {
		// Only open if clicking the cell background, not a mood button
		if (isCurrentUser && e.target === e.currentTarget) {
			popoverOpen = true;
		}
	}

	function handleCellKeyDown(e: KeyboardEvent) {
		if (isCurrentUser && (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) {
			e.preventDefault();
			popoverOpen = true;
		}
	}
</script>

{#if moods.length > 0}
	<div
		onclick={handleCellClick}
		onkeydown={handleCellKeyDown}
		class={cn(
			'relative min-h-[100px] w-full rounded-lg border-2 p-2',
			today && 'border-primary ring-2 ring-primary/50 ring-offset-2',
			!today &&
				'hover:border-primary/40 hover:shadow-md hover:transition-shadow hover:duration-200',
			isWeekend && 'bg-muted/30',
			isCurrentUser && 'cursor-pointer'
		)}
		role="button"
		tabindex="0"
	>
		<div class="flex flex-col gap-1.5">
			{#each moods as mood}
				{@const emotion = emotions.find((e) => e.id === mood.emotionId)}
				{#if emotion}
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger
								class={cn(
									'group relative w-full rounded-lg p-2 transition-all duration-200',
									'cursor-pointer hover:scale-[1.01] hover:shadow-sm'
								)}
								style="background-color: {emotion.color}15; border: 1px solid {emotion.color}30;"
								onclick={() => isCurrentUser && handleMoodClick(mood)}
							>
								<div class="flex items-center justify-center">
									<div
										class="rounded-full p-1.5 transition-all group-hover:scale-105"
										style="background-color: {emotion.color}20;"
									>
										<div class="text-2xl">{emotion.emoji}</div>
									</div>
									{#if mood.comment}
										<MessageCircle
											size={12}
											class="absolute top-1.5 right-1.5 text-muted-foreground/60"
										/>
									{/if}
								</div>
							</TooltipTrigger>
							<TooltipContent side="top" class="max-w-xs">
								<p class="font-medium">{emotion.name}</p>
								{#if mood.timeOfDay}
									<p class="text-xs text-muted-foreground capitalize">{mood.timeOfDay}</p>
								{/if}
								{#if mood.comment}
									<p class="mt-1 text-sm text-muted-foreground">{mood.comment}</p>
								{/if}
							</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				{/if}
			{/each}

			{#if isCurrentUser}
				<div class="flex justify-center">
					<div class="flex h-8 w-8 items-center justify-center">
						<QuickMoodSelector
							{emotions}
							onSelect={(emotionId, comment) => onQuickAdd(emotionId, day, userId, comment)}
							size="sm"
							variant="ghost"
							disabled={isSubmitting}
							bind:open={popoverOpen}
							{requireComment}
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else if isCurrentUser}
	<div
		onclick={handleCellClick}
		onkeydown={handleCellKeyDown}
		class={cn(
			'flex min-h-[100px] w-full items-center justify-center rounded-lg border-2',
			'cursor-pointer hover:border-primary/40 hover:shadow-md hover:transition-shadow hover:duration-200',
			today && 'border-primary ring-2 ring-primary/50 ring-offset-2',
			!today && 'border-dashed',
			isWeekend && 'bg-muted/30'
		)}
		role="button"
		tabindex="0"
	>
		<div class="flex h-10 w-10 items-center justify-center">
			<QuickMoodSelector
				{emotions}
				onSelect={(emotionId, comment) => onQuickAdd(emotionId, day, userId, comment)}
				disabled={isSubmitting}
				bind:open={popoverOpen}
				{requireComment}
			/>
		</div>
	</div>
{:else}
	<div
		class={cn(
			'flex min-h-[100px] items-center justify-center rounded-lg border-2 border-dashed p-2',
			today && 'border-primary bg-accent',
			isWeekend && 'bg-muted/30'
		)}
	>
		<span class="text-xs text-muted-foreground">—</span>
	</div>
{/if}
