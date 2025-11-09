<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Popover, PopoverContent, PopoverTrigger } from '$lib/components/ui/popover';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip';
	import { toDateString, isToday } from '$lib/utils/date';
	import { cn } from '$lib/utils';
	import type { Emotion, MoodEntryWithDetails } from '$lib/types';
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
	};

	let {
		day,
		emotions,
		entries,
		userId,
		currentUserId,
		onQuickAdd,
		onEdit,
		isSubmitting = false
	}: Props = $props();

	let moods = $derived(
		entries.filter((e) => e.userId === userId && toDateString(e.date) === toDateString(day))
	);
	let today = $derived(isToday(day));
	let isCurrentUser = $derived(userId === currentUserId);
	let isWeekend = $derived(day.getDay() === 0 || day.getDay() === 6);

	let popoverOpen = $state(false);
	let selectedEmotionId = $state<string | undefined>(undefined);
	let comment = $state('');
	let showComment = $state(false);
	let isSaving = $state(false);

	async function handleEmotionSelect(emotionId: string) {
		selectedEmotionId = emotionId;
		
		// If comment field is not open, auto-save immediately for smooth UX
		if (!showComment) {
			await handleQuickSave(emotionId);
		}
	}

	async function handleQuickSave(emotionId: string) {
		if (!emotionId) return;
		
		isSaving = true;
		try {
			await onQuickAdd(emotionId, day, userId, comment || undefined);
			popoverOpen = false;
			selectedEmotionId = undefined;
			comment = '';
			showComment = false;
		} finally {
			isSaving = false;
		}
	}

	async function handleSaveWithComment() {
		if (!selectedEmotionId) return;
		await handleQuickSave(selectedEmotionId);
	}

	function handleMoodClick(mood: MoodEntryWithDetails) {
		if (isCurrentUser && onEdit) {
			onEdit(day, mood, userId);
		}
	}
</script>

{#if moods.length > 0}
	<div
		class={cn(
			'relative min-h-[100px] rounded-lg border-2 p-2 transition-all duration-200',
			today && 'border-primary ring-2 ring-primary/50 ring-offset-2',
			!today && 'hover:border-primary/40 hover:shadow-md',
			isWeekend && 'bg-muted/30'
		)}
	>
		<div class="flex flex-col gap-1.5">
			{#each moods as mood}
				{@const emotion = emotions.find((e) => e.id === mood.emotionId)}
				{#if emotion}
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger>
								<button
									class={cn(
										'group relative w-full rounded-lg p-2 transition-all duration-200',
										isCurrentUser && 'cursor-pointer hover:scale-[1.01] hover:shadow-sm',
										!isCurrentUser && 'cursor-default'
									)}
									style="background-color: {emotion.color}15; border: 1px solid {emotion.color}30;"
									disabled={!isCurrentUser}
									onclick={() => handleMoodClick(mood)}
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
												class="absolute right-1.5 top-1.5 text-muted-foreground/60"
											/>
										{/if}
									</div>
								</button>
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
				<Popover bind:open={popoverOpen}>
					<PopoverTrigger>
						<button
							class="group w-full rounded-lg border border-dashed border-muted-foreground/30 p-1.5 text-xs text-muted-foreground transition-all hover:border-primary/50 hover:text-foreground disabled:opacity-50"
							disabled={isSubmitting || isSaving}
						>
							<div class="flex items-center justify-center gap-1">
								<MessageCircle class="h-3 w-3" />
								<span>Add</span>
							</div>
						</button>
					</PopoverTrigger>
					<PopoverContent class="w-80 p-4" align="center">
						<div class="space-y-4">
							<div>
								<h4 class="mb-3 text-sm font-medium">How are you feeling?</h4>
								<div class="flex flex-wrap gap-2 justify-center">
									{#each emotions as emotion}
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger>
													<Button
														variant={selectedEmotionId === emotion.id ? 'default' : 'outline'}
														size="icon"
														class={cn(
															'h-12 w-12',
															'hover:scale-110 transition-all duration-200 relative border-2',
															selectedEmotionId === emotion.id && 'ring-2 ring-ring ring-offset-2 shadow-lg'
														)}
														style={selectedEmotionId !== emotion.id 
															? `border-color: ${emotion.color}30; background-color: ${emotion.color}10;` 
															: ''}
														onclick={() => handleEmotionSelect(emotion.id)}
													>
														<span class="text-2xl">{emotion.emoji}</span>
													</Button>
												</TooltipTrigger>
												<TooltipContent>
													<p class="text-xs">{emotion.name}</p>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									{/each}
								</div>
							</div>
							<div class="border-t pt-2">
								{#if showComment}
									<div class="space-y-2">
										<Textarea
											bind:value={comment}
											placeholder="How are you feeling? Any thoughts to share?"
											class="min-h-20 resize-none text-sm"
											autofocus
										/>
										<div class="flex justify-end gap-2">
											<Button variant="ghost" size="sm" onclick={() => { showComment = false; comment = ''; }}>
												Cancel
											</Button>
											<Button 
												size="sm" 
												onclick={handleSaveWithComment}
												disabled={!selectedEmotionId || isSaving}
											>
												{isSaving ? 'Saving...' : 'Save'}
											</Button>
										</div>
									</div>
								{:else}
									<div class="flex justify-between items-center">
										<Button 
											variant="ghost" 
											size="sm"
											onclick={() => showComment = true}
											class="text-xs"
										>
											<MessageCircle class="mr-1.5 h-3 w-3" />
											{comment ? 'Edit comment' : 'Add comment'}
										</Button>
										{#if selectedEmotionId}
											<Button 
												size="sm" 
												onclick={handleSaveWithComment}
												disabled={isSaving}
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
			{/if}
		</div>
	</div>
{:else if isCurrentUser}
	<Popover bind:open={popoverOpen}>
		<PopoverTrigger disabled={isSubmitting || isSaving}>
			<div
				class={cn(
					'group relative min-h-[100px] w-full rounded-lg border-2 transition-all duration-200',
					'cursor-pointer hover:border-primary/40 hover:shadow-md',
					today && 'border-primary ring-2 ring-primary/50 ring-offset-2',
					!today && 'border-dashed',
					isWeekend && 'bg-muted/30'
				)}
			>
				<div class="flex h-full items-center justify-center p-2">
					<div class="flex flex-col items-center gap-1 text-muted-foreground transition-colors group-hover:text-foreground">
						<div class="text-2xl font-light">+</div>
						<div class="text-[10px] opacity-0 transition-opacity group-hover:opacity-100">
							Add mood
						</div>
					</div>
				</div>
			</div>
		</PopoverTrigger>
		<PopoverContent class="w-80 p-4" align="center">
			<div class="space-y-4">
				<div>
					<h4 class="mb-3 text-sm font-medium">How are you feeling?</h4>
					<div class="flex flex-wrap gap-2 justify-center">
						{#each emotions as emotion}
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger>
										<Button
											variant={selectedEmotionId === emotion.id ? 'default' : 'outline'}
											size="icon"
											class={cn(
												'h-12 w-12',
												'hover:scale-110 transition-all duration-200 relative border-2',
												selectedEmotionId === emotion.id && 'ring-2 ring-ring ring-offset-2 shadow-lg'
											)}
											style={selectedEmotionId !== emotion.id 
												? `border-color: ${emotion.color}30; background-color: ${emotion.color}10;` 
												: ''}
											onclick={() => handleEmotionSelect(emotion.id)}
										>
											<span class="text-2xl">{emotion.emoji}</span>
										</Button>
									</TooltipTrigger>
									<TooltipContent>
										<p class="text-xs">{emotion.name}</p>
									</TooltipContent>
								</Tooltip>
							</TooltipProvider>
						{/each}
					</div>
				</div>
				<div class="border-t pt-2">
					{#if showComment}
						<div class="space-y-2">
							<Textarea
								bind:value={comment}
								placeholder="How are you feeling? Any thoughts to share?"
								class="min-h-20 resize-none text-sm"
								autofocus
							/>
							<div class="flex justify-end gap-2">
								<Button variant="ghost" size="sm" onclick={() => { showComment = false; comment = ''; }}>
									Cancel
								</Button>
								<Button 
									size="sm" 
									onclick={handleSaveWithComment}
									disabled={!selectedEmotionId || isSaving}
								>
									{isSaving ? 'Saving...' : 'Save'}
								</Button>
							</div>
						</div>
					{:else}
						<div class="flex justify-between items-center">
							<Button 
								variant="ghost" 
								size="sm"
								onclick={() => showComment = true}
								class="text-xs"
							>
								<MessageCircle class="mr-1.5 h-3 w-3" />
								{comment ? 'Edit comment' : 'Add comment'}
							</Button>
							{#if selectedEmotionId}
								<Button 
									size="sm" 
									onclick={handleSaveWithComment}
									disabled={isSaving}
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
