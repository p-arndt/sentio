<script lang="ts">
	import QuickMoodSelector from '$lib/components/QuickMoodSelector.svelte';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Separator } from '$lib/components/ui/separator';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip';
	import type { Emotion, MoodEntryWithDetails, TeamMemberWithUser } from '$lib/types';
	import { cn } from '$lib/utils';
	import { formatFullDate, toDateString } from '$lib/utils/date';
	import { getUserInitials } from '$lib/utils/user';
	import { ChevronLeft, ChevronRight, MessageCircle } from '@lucide/svelte';

	type Props = {
		selectedDate: Date;
		teamMembers: TeamMemberWithUser[];
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		currentUserId?: string;
		onDayChange: (direction: 'prev' | 'next') => void;
		onQuickAdd: (
			emotionId: string,
			date: Date,
			userId: string,
			comment?: string
		) => Promise<void> | void;
		onEdit?: (date: Date, entry: MoodEntryWithDetails, userId: string) => void;
		isSubmitting?: boolean;
		requireComment?: boolean;
		className?: string;
	};

	let {
		selectedDate,
		teamMembers,
		emotions,
		entries,
		currentUserId,
		onDayChange,
		onQuickAdd,
		onEdit,
		isSubmitting = false,
		requireComment = false,
		className = ''
	}: Props = $props();

	let sortedMembers = $derived(
		[...teamMembers].sort((a, b) => {
			if (a.userId === currentUserId) return -1;
			if (b.userId === currentUserId) return 1;
			return 0;
		})
	);

	function getMoodsForMember(userId: string): MoodEntryWithDetails[] {
		const dateStr = toDateString(selectedDate);
		return entries.filter((e) => e.userId === userId && toDateString(e.date) === dateStr);
	}

	function getEmotionById(id: string): Emotion | undefined {
		return emotions.find((e) => e.id === id);
	}
</script>

<Card class={cn('', className)}>
	<CardHeader class="pb-4">
		<div class="flex items-center justify-between">
			<div>
				<CardTitle class="text-lg md:text-xl">Day View</CardTitle>
				<p class="mt-1 text-sm text-muted-foreground">
					{formatFullDate(selectedDate)}
				</p>
			</div>
			<div class="flex items-center gap-2">
				<Button variant="ghost" size="icon" onclick={() => onDayChange('prev')} class="h-8 w-8">
					<ChevronLeft class="h-4 w-4" />
				</Button>
				<Button
					variant="outline"
					size="sm"
					onclick={() => {
						const today = new Date();
						today.setHours(0, 0, 0, 0);
						selectedDate.setHours(0, 0, 0, 0);
						if (selectedDate.getTime() !== today.getTime()) {
							selectedDate = today;
						}
					}}
				>
					Today
				</Button>
				<Button variant="ghost" size="icon" onclick={() => onDayChange('next')} class="h-8 w-8">
					<ChevronRight class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</CardHeader>

	<CardContent>
		<div class="space-y-4">
			{#each sortedMembers as member}
				{@const moods = getMoodsForMember(member.userId)}
				{@const isCurrentUser = member.userId === currentUserId}
				<div class="rounded-lg border p-4">
					<div class="mb-4 flex items-center gap-3">
						<Avatar class="h-10 w-10">
							<AvatarImage src={member.user.image ?? undefined} alt={member.user.name} />
							<AvatarFallback>{getUserInitials(member.user.name)}</AvatarFallback>
						</Avatar>
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2 truncate font-medium">
								{member.user.name}
								{#if isCurrentUser}
									<span class="text-xs text-muted-foreground">(You)</span>
								{/if}
							</div>
							{#if member.role === 'admin'}
								<div class="text-xs text-muted-foreground">Team Admin</div>
							{/if}
						</div>
					</div>

					<Separator class="mb-4" />

					<div class="space-y-2">
						{#if moods.length > 0}
							<div class="flex flex-wrap gap-2">
								{#each moods as mood}
									{@const emotion = getEmotionById(mood.emotionId)}
									{#if emotion}
										<TooltipProvider>
											<Tooltip>
												<TooltipTrigger>
													<button
														onclick={() =>
															isCurrentUser && onEdit
																? onEdit(selectedDate, mood, member.userId)
																: null}
														disabled={!isCurrentUser}
														class={cn(
															'relative flex h-12 w-12 items-center justify-center rounded-full transition-all',
															isCurrentUser && 'cursor-pointer hover:scale-105',
															!isCurrentUser && 'cursor-default opacity-75'
														)}
														style="background-color: {emotion.color}40;"
													>
														<span class="text-2xl">{emotion.emoji}</span>
														{#if mood.comment}
															<MessageCircle
																class="absolute top-0.5 right-0.5 h-3 w-3 text-foreground/60"
															/>
														{/if}
													</button>
												</TooltipTrigger>
												<TooltipContent>
													<div class="space-y-1 text-xs">
														<div class="font-semibold">{emotion.name}</div>
														{#if mood.timeOfDay}
															<div class="text-muted-foreground">🕐 {mood.timeOfDay}</div>
														{/if}
														{#if mood.comment}
															<div class="flex max-w-xs items-center space-x-1">
																<MessageCircle class="size-3" />
																<span>
																	{mood.comment}
																</span>
															</div>
														{/if}
													</div>
												</TooltipContent>
											</Tooltip>
										</TooltipProvider>
									{/if}
								{/each}
							</div>
						{:else}
							<div class="flex flex-col items-center justify-center py-6 text-muted-foreground">
								<div class="mb-1 text-3xl">😶</div>
								<p class="text-xs">No mood recorded</p>
							</div>
						{/if}

						{#if isCurrentUser}
							<QuickMoodSelector
								{emotions}
								onSelect={(emotionId, comment) =>
									onQuickAdd(emotionId, selectedDate, member.userId, comment)}
								disabled={isSubmitting}
								{requireComment}
							/>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</CardContent>
</Card>
