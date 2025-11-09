<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { cn } from '$lib/utils';
	import { formatDate, toDateString, isToday } from '$lib/utils/date';
	import type { MoodEntryWithDetails, Emotion, TeamMemberWithUser } from '$lib/types';

	type Props = {
		selectedDate: Date;
		teamMembers: TeamMemberWithUser[];
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		currentUserId?: string;
		onDayChange: (direction: 'prev' | 'next') => void;
		onQuickAdd: (emotionId: string, date: Date, userId: string) => Promise<void> | void;
		onEdit?: (date: Date, entry: MoodEntryWithDetails, userId: string) => void;
		isSubmitting?: boolean;
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
		className = ''
	}: Props = $props();

	function getUserInitials(name: string) {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

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
				<p class="text-sm text-muted-foreground mt-1">
					{formatDate(selectedDate, { weekday: 'long', month: 'long', day: 'numeric' })}
				</p>
			</div>
			<div class="flex items-center gap-2">
				<Button
					variant="ghost"
					size="icon"
					onclick={() => onDayChange('prev')}
					class="h-8 w-8"
				>
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
				<Button
					variant="ghost"
					size="icon"
					onclick={() => onDayChange('next')}
					class="h-8 w-8"
				>
					<ChevronRight class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</CardHeader>

	<CardContent>
		<div class="space-y-4">
			{#each teamMembers as member}
				{@const moods = getMoodsForMember(member.userId)}
				<div class="rounded-lg border p-4">
					<div class="flex items-center gap-3 mb-4">
						<Avatar class="h-10 w-10">
							<AvatarImage src={member.user.image ?? undefined} alt={member.user.name} />
							<AvatarFallback>{getUserInitials(member.user.name)}</AvatarFallback>
						</Avatar>
						<div class="flex-1 min-w-0">
							<div class="font-medium truncate">{member.user.name}</div>
							{#if member.role === 'admin'}
								<div class="text-xs text-muted-foreground">Team Admin</div>
							{/if}
						</div>
					</div>

					<Separator class="mb-4" />

					<div class="space-y-3">
						{#if moods.length > 0}
							{#each moods as mood}
								{@const emotion = getEmotionById(mood.emotionId)}
								{#if emotion}
									<button
										onclick={() =>
											member.userId === currentUserId && onEdit && onEdit(selectedDate, mood, member.userId)}
										disabled={member.userId !== currentUserId}
										class={cn(
											'w-full rounded-lg p-4 text-left transition-colors',
											member.userId === currentUserId && 'hover:bg-muted cursor-pointer',
											member.userId !== currentUserId && 'cursor-default'
										)}
										style="background-color: {emotion.color}15; border: 1px solid {emotion.color}40;"
									>
										<div class="flex items-start gap-3">
											<div class="text-3xl">{emotion.emoji}</div>
											<div class="flex-1 min-w-0">
												<div class="font-semibold text-sm">{emotion.name}</div>
												{#if mood.timeOfDay}
													<div class="text-xs text-muted-foreground mt-1">🕐 {mood.timeOfDay}</div>
												{/if}
												{#if mood.comment}
												<div class="text-sm text-foreground mt-2">
													💬 {mood.comment}
												</div>
												{/if}
											</div>
										</div>
									</button>
								{/if}
							{/each}
						{:else}
							<div class="flex flex-col items-center justify-center py-8 text-muted-foreground">
								<div class="text-4xl mb-2">😶</div>
								<p class="text-sm">No mood recorded for today</p>
								{#if member.userId === currentUserId}
									<p class="text-xs mt-1">Click below to add one</p>
								{/if}
							</div>
						{/if}

						{#if member.userId === currentUserId}
							<div class="pt-2">
								<p class="text-xs text-muted-foreground mb-2">Quick add:</p>
								<div class="flex flex-wrap gap-2">
									{#each emotions as emotion}
										<button
											onclick={() => onQuickAdd(emotion.id, selectedDate, member.userId)}
											disabled={isSubmitting}
											class="h-10 w-10 rounded-lg transition-transform hover:scale-110 disabled:opacity-50"
											style="background-color: {emotion.color}; border: 1px solid {emotion.color}"
											title={emotion.name}
										>
											<span class="text-lg">{emotion.emoji}</span>
										</button>
									{/each}
								</div>
							</div>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	</CardContent>
</Card>
