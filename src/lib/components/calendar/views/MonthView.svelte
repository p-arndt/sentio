<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { cn } from '$lib/utils';
	import { getMonthGrid, getMonthYear, isToday, formatDate, toDateString } from '$lib/utils/date';
	import type { MoodEntryWithDetails, Emotion } from '$lib/types';

	type Props = {
		selectedDate: Date;
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		onMonthChange: (direction: 'prev' | 'next') => void;
		onDaySelect: (date: Date) => void;
		className?: string;
	};

	let {
		selectedDate,
		emotions,
		entries,
		onMonthChange,
		onDaySelect,
		className = ''
	}: Props = $props();

	let monthDays = $derived(getMonthGrid(selectedDate));
	let monthYear = $derived(getMonthYear(selectedDate));

	function isCurrentMonth(date: Date): boolean {
		return date.getMonth() === selectedDate.getMonth();
	}

	function getMoodCountForDate(date: Date): number {
		const dateStr = toDateString(date);
		return entries.filter((e) => toDateString(e.date) === dateStr).length;
	}

	function getEmotionsForDate(date: Date): Emotion[] {
		const dateStr = toDateString(date);
		const moodsForDate = entries.filter((e) => toDateString(e.date) === dateStr);
		const emotionIds = new Set(moodsForDate.map((m) => m.emotionId));
		return Array.from(emotionIds)
			.map((id) => emotions.find((e) => e.id === id))
			.filter((e): e is Emotion => !!e);
	}

	const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
</script>

<Card class={className}>
	<CardHeader>
		<div class="flex items-center justify-between">
			<CardTitle class="text-lg md:text-xl">Month View</CardTitle>
			<div class="flex items-center gap-2">
				<Button variant="ghost" size="icon" onclick={() => onMonthChange('prev')} class="h-8 w-8">
					<ChevronLeft class="h-4 w-4" />
				</Button>
				<span class="min-w-[150px] text-center text-xs font-semibold md:text-sm">
					{monthYear}
				</span>
				<Button variant="ghost" size="icon" onclick={() => onMonthChange('next')} class="h-8 w-8">
					<ChevronRight class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</CardHeader>

	<CardContent>
		<!-- Day Labels -->
		<div class="grid grid-cols-7 gap-px border-b bg-muted">
			{#each dayLabels as label}
				<div class="px-2 py-1 text-center text-[10px] font-semibold md:px-4 md:py-2">
					{label}
				</div>
			{/each}
		</div>

		<!-- Calendar Grid -->
		<div class="grid grid-cols-7 gap-px bg-border p-px">
			{#each monthDays as day (day.toISOString())}
				{@const count = getMoodCountForDate(day)}
				{@const emotionsForDay = getEmotionsForDate(day)}
				<button
					onclick={() => onDaySelect(day)}
					class={cn(
						'aspect-square border p-1 text-center transition-colors md:p-2',
						isCurrentMonth(day)
							? 'cursor-pointer bg-card hover:bg-accent'
							: 'cursor-default bg-muted/30 text-muted-foreground',
						isToday(day) && 'bg-primary/5 ring-2 ring-primary ring-offset-1'
					)}
				>
					<div class="space-y-1">
						<div class={cn('text-xs font-medium md:text-sm', !isCurrentMonth(day) && 'opacity-50')}>
							{day.getDate()}
						</div>
						{#if count > 0}
							<div class="flex flex-wrap justify-center gap-0.5">
								{#each emotionsForDay as emotion (emotion.id)}
									<div
										class="h-2 w-2 rounded-full md:h-3 md:w-3"
										style="background-color: {emotion.color};"
										title={emotion.name}
									></div>
								{/each}
							</div>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	</CardContent>
</Card>
