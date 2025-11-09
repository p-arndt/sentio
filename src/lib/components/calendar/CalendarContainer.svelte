<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import CalendarViewToggle from './CalendarViewToggle.svelte';
	import WeekView from './WeekView.svelte';
	import MonthView from './MonthView.svelte';
	import DayView from './DayView.svelte';
	import { cn } from '$lib/utils';
	import type { MoodEntryWithDetails, Emotion, TeamMemberWithUser } from '$lib/types';

	type CalendarViewMode = 'week' | 'month' | 'day';

	type Props = {
		teamId: string;
		weekStart: Date;
		weekDays: Date[];
		teamMembers: TeamMemberWithUser[];
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		currentUserId?: string;
		showWeekends: boolean;
		onWeekChange: (direction: 'prev' | 'next') => void;
		onQuickAdd: (emotionId: string, date: Date, userId: string) => Promise<void> | void;
		onEdit?: (date: Date, entry: MoodEntryWithDetails, userId: string) => void;
		isSubmitting?: boolean;
		className?: string;
	};

	let {
		teamId,
		weekStart,
		weekDays,
		teamMembers,
		emotions,
		entries,
		currentUserId,
		showWeekends,
		onWeekChange,
		onQuickAdd,
		onEdit,
		isSubmitting = false,
		className = ''
	}: Props = $props();

	let mode = $state<CalendarViewMode>('week');
	let selectedDate = $state(new Date());

	function handleViewModeChange(newMode: CalendarViewMode) {
		mode = newMode;
	}

	function handleMonthChange(direction: 'prev' | 'next') {
		const newDate = new Date(selectedDate);
		const delta = direction === 'prev' ? -1 : 1;
		newDate.setMonth(newDate.getMonth() + delta);
		selectedDate = newDate;
	}

	function handleDayChange(direction: 'prev' | 'next') {
		const newDate = new Date(selectedDate);
		const delta = direction === 'prev' ? -1 : 1;
		newDate.setDate(newDate.getDate() + delta);
		selectedDate = newDate;
	}

	function handleDaySelect(date: Date) {
		mode = 'day';
		selectedDate = date;
	}
</script>

<div class={cn('space-y-4', className)}>
	<!-- Header with View Toggle -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between pb-4">
			<CardTitle class="text-lg md:text-xl">Calendar Views</CardTitle>
			<CalendarViewToggle {mode} onModeChange={handleViewModeChange} className="shrink-0" />
		</CardHeader>
	</Card>

	<!-- View Container -->
	{#if mode === 'week'}
		<WeekView
			{weekStart}
			{weekDays}
			{teamMembers}
			{emotions}
			{entries}
			{currentUserId}
			{showWeekends}
			onWeekChange={(direction) => {
				onWeekChange(direction);
			}}
			{onQuickAdd}
			{onEdit}
			{isSubmitting}
		/>
	{:else if mode === 'month'}
		<div class="flex justify-center w-full items-center">
			<MonthView
				{selectedDate}
				{emotions}
				{entries}
				onMonthChange={handleMonthChange}
				onDaySelect={handleDaySelect}
				className="w-full"
			/>
		</div>
	{:else if mode === 'day'}
		<DayView
			{selectedDate}
			{teamMembers}
			{emotions}
			{entries}
			{currentUserId}
			onDayChange={handleDayChange}
			{onQuickAdd}
			{onEdit}
			{isSubmitting}
		/>
	{/if}
</div>
