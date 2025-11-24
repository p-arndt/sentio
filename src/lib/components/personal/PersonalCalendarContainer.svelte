<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import type { Emotion, MoodEntryWithDetails, TeamMemberWithUser } from '$lib/types';
	import CalendarViewToggle from '../calendar/CalendarViewToggle.svelte';
	import MonthView from '../calendar/views/MonthView.svelte';
	import WeekView from '../calendar/views/WeekView.svelte';
	// weekDays are provided by the parent page and are UTC-aware local midnight dates

	type CalendarViewMode = 'week' | 'month';

	type Props = {
		weekStart: Date;
		weekDays: Date[];
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		userId: string;
		requireComment?: boolean;
		defaultView?: CalendarViewMode;
		onWeekChange: (direction: 'prev' | 'next') => void;
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

	function handleDaySelect(date: Date) {
		mode = 'week';
		selectedDate = date;
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
			{/if}
		</CardContent>
	</Card>
</div>
