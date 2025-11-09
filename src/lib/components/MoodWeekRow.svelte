<script lang="ts">
	import QuickMoodSelector from '$lib/components/QuickMoodSelector.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { formatDate, isToday, toDateString } from '$lib/utils/date';
	import type { Emotion, MoodEntryWithDetails } from '$lib/types';

	type Props = {
		days: Date[];
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		onQuickAdd: (emotionId: string, date: Date, userId: string, comment?: string) => Promise<void> | void;
		onEdit?: (date: Date, entry: MoodEntryWithDetails) => void;
		isSubmitting?: boolean;
		allowAdd?: boolean;
		allowEdit?: boolean;
		showDayHeader?: boolean; // personal view shows day name + Today badge
		userId?: string;
	};

	let {
		days,
		emotions,
		entries,
		onQuickAdd,
		onEdit,
		isSubmitting = false,
		allowAdd = true,
		allowEdit = true,
		showDayHeader = false,
		userId = ''
	}: Props = $props();

	function getEmotionById(id: string) {
		return emotions.find((e) => e.id === id);
	}

	function getMoodsForDate(date: Date): MoodEntryWithDetails[] {
		const d = toDateString(date);
		if (!d) return [];
		return entries.filter((e) => toDateString(e.date) === d);
	}

	function formatDayName(date: Date) {
		return formatDate(date, { weekday: 'short', month: 'short', day: 'numeric' });
	}
</script>

<div class="grid gap-2" style="grid-template-columns: repeat({days.length}, 1fr)">
	{#each days as day}
		{@const moods = getMoodsForDate(day)}
		{@const today = isToday(day)}
		<div
			class="space-y-2 rounded-lg border p-3 transition-colors hover:bg-accent"
			class:border-primary={today}
			class:bg-accent={today}
		>
			{#if showDayHeader}
				<div class="text-center">
					<div class="text-sm font-medium">{formatDayName(day)}</div>
					{#if today}
						<Badge variant="outline" class="mt-1 text-xs">Today</Badge>
					{/if}
				</div>
				<Separator />
			{/if}

			<div class="min-h-[100px] space-y-2">
				{#if moods.length > 0}
					{#each moods as mood}
						{@const emotion = getEmotionById(mood.emotionId)}
						{#if emotion}
							<button
								class="w-full rounded-md p-2 text-center transition-transform hover:scale-105"
								style="background-color: {emotion.color}20; border: 1px solid {emotion.color};"
								disabled={!allowEdit}
								onclick={() => allowEdit && onEdit && onEdit(day, mood)}
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
					{#if allowAdd}
						<div class="flex justify-center">
							<QuickMoodSelector
								emotions={emotions}
								onSelect={(emotionId, comment) => onQuickAdd(emotionId, day, userId, comment)}
								size="sm"
								variant="ghost"
								disabled={isSubmitting}
							/>
						</div>
					{/if}
				{:else}
					{#if allowAdd}
						<div class="flex h-full items-center justify-center">
							<QuickMoodSelector
								emotions={emotions}
								onSelect={(emotionId, comment) => onQuickAdd(emotionId, day, userId, comment)}
								disabled={isSubmitting}
							/>
						</div>
					{:else}
						<div class="flex h-full items-center justify-center rounded-lg border border-dashed">
							<span class="text-xs text-muted-foreground">—</span>
						</div>
					{/if}
				{/if}
			</div>
		</div>
	{/each}
</div>
