<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
import type {
	Emotion,
	MoodEntryWithDetails,
	TeamMemberWithUser,
	MoodSharePreference
} from '$lib/types';
	import CalendarViewToggle from './CalendarViewToggle.svelte';
	import DayView from './views/DayView.svelte';
	import MonthView from './views/MonthView.svelte';
	import WeekView from './views/WeekView.svelte';

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
		requireComment?: boolean;
		defaultView?: CalendarViewMode;
		teamSharingPreference?: MoodSharePreference;
		onWeekChange: (direction: 'prev' | 'next') => void;
		onEdit?: (date: Date, entry: MoodEntryWithDetails, userId: string) => void;
		isSubmitting?: boolean;
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
		requireComment = false,
		defaultView = 'week',
		teamSharingPreference = 'public',
		onWeekChange,
		onEdit,
		isSubmitting = false
	}: Props = $props();

	let mode = $state<CalendarViewMode>(defaultView);
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
					{teamMembers}
					{emotions}
					{entries}
					{currentUserId}
					{showWeekends}
					{requireComment}
					{teamId}
					teamSharingPreferenceForCurrentUser={teamSharingPreference}
					onWeekChange={(direction) => {
						onWeekChange(direction);
					}}
					{onEdit}
					{isSubmitting}
				/>
			{:else if mode === 'month'}
				<!-- <div class="flex w-full items-center justify-center"> -->
				<MonthView
					{selectedDate}
					{emotions}
					{entries}
					onMonthChange={handleMonthChange}
					onDaySelect={handleDaySelect}
				/>
				<!-- </div> -->
			{:else if mode === 'day'}
				<DayView
					{selectedDate}
					{teamMembers}
					{emotions}
					{entries}
					{currentUserId}
					{teamId}
					teamSharingPreferenceForCurrentUser={teamSharingPreference}
					onDayChange={handleDayChange}
					{onEdit}
					{isSubmitting}
					{requireComment}
				/>
			{/if}
		</CardContent>
	</Card>
</div>
