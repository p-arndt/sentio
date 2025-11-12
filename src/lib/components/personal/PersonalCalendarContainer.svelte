<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { Emotion, MoodEntryWithDetails, TeamMemberWithUser } from '$lib/types';
	import CalendarViewToggle from '../calendar/CalendarViewToggle.svelte';
	import DayView from '../calendar/DayView.svelte';
	import MonthView from '../calendar/MonthView.svelte';
	import WeekView from '../calendar/WeekView.svelte';
	import { getWeekDays } from '$lib/utils/date';

	type CalendarViewMode = 'week' | 'month' | 'day';

	type Props = {
		weekStart: Date;
		weekDays: Date[];
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		userId: string;
		requireComment?: boolean;
		defaultView?: CalendarViewMode;
		onWeekChange: (direction: 'prev' | 'next') => void;
		onQuickAdd: (emotionId: string, date: Date, comment?: string) => Promise<void> | void;
		onEdit?: (date: Date, entry: MoodEntryWithDetails) => void;
		isSubmitting?: boolean;
	};

	let {
		weekStart,
		weekDays,
		emotions,
		entries,
		userId,
		requireComment = false,
		defaultView = 'week',
		onWeekChange,
		onQuickAdd,
		onEdit,
		isSubmitting = false
	}: Props = $props();

	let mode = $state<CalendarViewMode>(defaultView);
	let selectedDate = $state(new Date());

	// Create a dummy team member for the current user to work with existing components
	let teamMember = $derived({
		userId,
		user: {
			id: userId,
			name: 'You',
			image: null
		}
	} as TeamMemberWithUser);

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

	function handleQuickAdd(emotionId: string, date: Date) {
		onQuickAdd(emotionId, date);
	}
</script>

<div>
	<!-- Header with View Toggle -->
	<Card>
		<CardHeader class="flex flex-row items-center justify-between pb-4">
			<CardTitle class="text-lg md:text-xl">Calendar Views</CardTitle>
			<CalendarViewToggle {mode} onModeChange={handleViewModeChange} className="shrink-0" />
		</CardHeader>
		<CardContent>
			<!-- View Container -->
			{#if mode === 'week'}
				<WeekView
					{weekStart}
					{weekDays}
					teamMembers={[teamMember]}
					{emotions}
					{entries}
					currentUserId={userId}
					showWeekends={true}
					{requireComment}
					onWeekChange={(direction) => onWeekChange(direction)}
					onQuickAdd={handleQuickAdd}
					onEdit={(date, entry) => onEdit?.(date, entry)}
					{isSubmitting}
				/>
			{:else if mode === 'month'}
				<MonthView
					selectedDate={selectedDate || new Date()}
					{emotions}
					{entries}
					onMonthChange={handleMonthChange}
					onDaySelect={handleDaySelect}
				/>
			{:else if mode === 'day'}
				<DayView
					selectedDate={selectedDate || new Date()}
					teamMembers={[teamMember]}
					{emotions}
					{entries}
					currentUserId={userId}
					onDayChange={handleDayChange}
					onQuickAdd={handleQuickAdd}
					onEdit={(date, entry) => onEdit?.(date, entry)}
					{isSubmitting}
					{requireComment}
				/>
			{/if}
		</CardContent>
	</Card>
</div>
