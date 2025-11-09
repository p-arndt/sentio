<script lang="ts">
	import { Badge } from '$lib/components/ui/badge';
	import QuickMoodSelector from '$lib/components/QuickMoodSelector.svelte';
	import { toDateString, isToday } from '$lib/utils/date';
	import type { Emotion, MoodEntryWithDetails } from '$lib/types';

	type Props = {
		day: Date;
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		userId: string;
		currentUserId?: string;
		onQuickAdd: (emotionId: string, day: Date, userId: string) => void;
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

	let quickMoodSelector = $state<any>(null);

	function handleCellClick() {
		if (isCurrentUser && quickMoodSelector) {
			const button = quickMoodSelector.querySelector('button');
			if (button) button.click();
		}
	}
</script>

{#if moods.length > 0}
	<div
		class="space-y-2 rounded-lg border p-2 transition-colors hover:bg-accent {today ? 'border-primary bg-accent' : ''}"
	>
		<div class="min-h-[100px] space-y-2">
			{#each moods as mood}
				{@const emotion = emotions.find((e) => e.id === mood.emotionId)}
				{#if emotion}
					<button
						class="w-full rounded-md p-2 text-center transition-transform hover:scale-105"
						style="background-color: {emotion.color}20; border: 1px solid {emotion.color};"
						disabled={!isCurrentUser}
						onclick={() => isCurrentUser && onEdit && onEdit(day, mood, userId)}
					>
						<div class="text-2xl">{emotion.emoji}</div>
						<div class="text-xs font-medium">{emotion.name}</div>
						{#if mood.timeOfDay}
							<Badge variant="outline" class="mt-1 text-xs">{mood.timeOfDay}</Badge>
						{/if}
						{#if mood.comment}
							<p class="mt-1 truncate text-xs text-muted-foreground">💬 {mood.comment}</p>
						{/if}
					</button>
				{/if}
			{/each}
			{#if isCurrentUser}
				<div
					class="flex cursor-pointer justify-center"
					onclick={handleCellClick}
					bind:this={quickMoodSelector}
				>
					<div onclick={(e) => e.stopPropagation()}>
						<QuickMoodSelector
							{emotions}
							onSelect={(emotionId) => onQuickAdd(emotionId, day, userId)}
							size="sm"
							variant="ghost"
							disabled={isSubmitting}
						/>
					</div>
				</div>
			{/if}
		</div>
	</div>
{:else if isCurrentUser}
	<button
		class="min-h-[100px] w-full flex items-center justify-center rounded-lg border p-2 transition-colors hover:bg-accent {today ? 'border-primary bg-accent' : ''}"
		onclick={handleCellClick}
	>
		<div bind:this={quickMoodSelector}>
			<QuickMoodSelector
				{emotions}
				onSelect={(emotionId) => onQuickAdd(emotionId, day, userId)}
				size="lg"
				variant="ghost"
				disabled={isSubmitting}
			/>
		</div>
	</button>
{:else}
	<div
		class="min-h-[100px] flex items-center justify-center rounded-lg border border-dashed p-2 {today ? 'border-primary bg-accent' : ''}"
	>
		<span class="text-xs text-muted-foreground">—</span>
	</div>
{/if}
