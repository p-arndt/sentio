<script lang="ts">
	import QuickMoodSelector from '$lib/components/QuickMoodSelector.svelte';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip';
	import type { Emotion, MoodEntryWithDetails, MoodSharePreference } from '$lib/types';
	import { cn } from '$lib/utils';
	import { isToday, toDateString } from '$lib/utils/date';
	import { ChevronDown, MessageCircle } from '@lucide/svelte';

	type Props = {
		day: Date;
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		userId: string;
		currentUserId?: string;
		teamId?: string;
		teamSharingPreference?: MoodSharePreference;
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
		onEdit,
		isSubmitting = false,
		requireComment = false,
		teamId,
		teamSharingPreference = 'public'
	}: Props = $props();

	let moods = $derived(
		entries.filter((e) => e.userId === userId && toDateString(e.date) === toDateString(day))
	);
	let today = $derived(isToday(day));
	let isCurrentUser = $derived(userId === currentUserId);
	let isWeekend = $derived(day.getDay() === 0 || day.getDay() === 6);

	let popoverOpen = $state(false);
	let expandedMoodId = $state<string | null>(null);

	function handleMoodClick(mood: MoodEntryWithDetails, e: MouseEvent) {
		e.stopPropagation();

		if (isCurrentUser && onEdit) {
			onEdit(day, mood, userId);
		} else if (mood.comment) {
			expandedMoodId = expandedMoodId === mood.id ? null : mood.id;
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
			'relative min-h-[100px] w-full rounded-lg border',
			today && 'ring-1',
			!today && 'hover:border-primary/40 hover:transition-shadow hover:duration-200',
			isWeekend && 'bg-muted/30'
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
									'group relative w-full rounded-lg transition-all duration-200',
									'cursor-pointer p-2 hover:scale-105'
								)}
								onclick={(e) => handleMoodClick(mood, e)}
							>
								<div
									class={[
										'flex flex-col gap-1.5',
										'rounded-[14px] border-2 p-1',
										mood.isAnonymous ? 'border-dashed ' : 'border-solid'
									]}
									style={`background-color: ${emotion.color}10; border-color: ${emotion.color}35;`}
								>
									<div class="flex items-center gap-1.5 {!mood.comment && 'justify-center'}">
										<div class="relative flex items-center justify-center">
											<div
												class={cn(
													'rounded-full border-2 p-1 transition-all group-hover:scale-105',
													mood.isAnonymous ? 'border-dashed' : 'border-solid'
												)}
												style={`border-color: ${emotion.color}35; background-color: ${emotion.color}20;`}
											>
												<div class="text-xl">{emotion.emoji}</div>
											</div>
											{#if mood.isAnonymous && mood.userId === currentUserId}
												<span
													class="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded border border-dashed border-primary/40 bg-background/80 px-1 text-[10px] font-semibold text-muted-foreground uppercase"
												>
													Anon
												</span>
											{/if}
										</div>
										{#if mood.comment}
											<div class="flex min-w-0 flex-1 items-center gap-1">
												<MessageCircle size={12} class="shrink-0 text-muted-foreground/60" />
												<p class="line-clamp-1 text-xs leading-tight text-muted-foreground">
													{mood.comment}
												</p>
											</div>
											{#if !isCurrentUser}
												<ChevronDown
													size={14}
													class={cn(
														'shrink-0 text-muted-foreground/60 transition-transform',
														expandedMoodId === mood.id && 'rotate-180'
													)}
												/>
											{/if}
										{/if}
									</div>
									{#if mood.comment && expandedMoodId === mood.id}
										<div class="mt-1 rounded-md bg-background/50 p-2">
											<p class="text-xs whitespace-pre-wrap text-foreground">
												{mood.comment}
											</p>
										</div>
									{/if}
								</div>
							</TooltipTrigger>
							<TooltipContent side="top" class="max-w-xs">
								<p class="font-medium">{emotion.name}</p>
								{#if mood.timeOfDay}
									<p class="text-xs text-muted-foreground capitalize">{mood.timeOfDay}</p>
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
							date={day}
							{teamId}
							{teamSharingPreference}
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
				date={day}
				{teamId}
				{teamSharingPreference}
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
