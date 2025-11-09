<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import CalendarMemberRow from './CalendarMemberRow.svelte';
	import { 
		formatDayName, 
		formatDayDate, 
		formatDate, 
		isToday, 
		filterWeekDays 
	} from '$lib/utils/date';
	import type { Emotion, MoodEntryWithDetails, TeamMember, TeamMemberWithUser } from '$lib/types';

	type Props = {
		weekStart: Date;
		weekDays: Date[];
		teamMembers: TeamMemberWithUser[];
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		currentUserId?: string;
		showWeekends: boolean;
		onWeekChange: (direction: 'prev' | 'next') => void;
		onQuickAdd: (emotionId: string, date: Date, userId: string, comment?: string) => Promise<void> | void;
		onEdit?: (date: Date, entry: MoodEntryWithDetails, userId: string) => void;
		isSubmitting?: boolean;
		className?: string;
	};

	let {
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

	let displayDays = $derived(filterWeekDays(weekDays, showWeekends));

	let sortedMembers = $derived.by(() => {
		const sorted = [...teamMembers];
		if (currentUserId) {
			sorted.sort((a, b) => {
				if (a.userId === currentUserId) return -1;
				if (b.userId === currentUserId) return 1;
				return a.user.name.localeCompare(b.user.name);
			});
		}
		return sorted;
	});

</script>

<Card class="overflow-hidden {className}">
	<CardHeader>
		<div class="flex items-center justify-between">
			<CardTitle class="text-lg md:text-xl">Week View</CardTitle>
			<div class="flex items-center gap-2">
				<Button variant="ghost" size="icon" onclick={() => onWeekChange('prev')} class="h-8 w-8">
					<ChevronLeft class="h-4 w-4" />
				</Button>
				<span class="min-w-[120px] text-center text-xs font-semibold md:text-sm">
					{formatDate(weekStart, { month: 'short', day: 'numeric' })} -
					{formatDate(new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000), {
						month: 'short',
						day: 'numeric'
					})}
				</span>
				<Button variant="ghost" size="icon" onclick={() => onWeekChange('next')} class="h-8 w-8">
					<ChevronRight class="h-4 w-4" />
				</Button>
			</div>
		</div>
	</CardHeader>

	<CardContent>
		<!-- Day Headers -->
		<div class="sticky top-0 z-10 border-b-2 bg-card px-3 py-3 md:px-6 md:py-4">
			<div
				class="grid gap-2 md:gap-4"
				style="grid-template-columns: 200px repeat({displayDays.length}, 1fr)"
			>
				<div class="text-sm font-semibold">Team Members</div>
				{#each displayDays as day (day.toISOString())}
					<div class="min-w-0 text-center">
						<div class="truncate text-[10px] font-semibold text-foreground md:text-sm">
							{formatDayName(day).slice(0, 3)}
						</div>
						<div
							class="{isToday(day)
								? 'font-semibold text-primary'
								: 'text-muted-foreground'} mt-0.5 text-[9px] md:mt-1 md:text-xs"
						>
							{formatDayDate(day).replace(' ', '\u00A0')}
							{#if isToday(day)}
								<span class="ml-0.5 text-primary md:ml-1">•</span>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Team Member Rows -->
		<div class="px-3 py-2 md:px-6 md:py-6">
			<div class="space-y-2 md:space-y-4">
				{#each sortedMembers as member, index}
					<CalendarMemberRow
						{member}
						days={displayDays}
						{emotions}
						{entries}
						{currentUserId}
						{onQuickAdd}
						{onEdit}
						{isSubmitting}
						isEven={index % 2 === 0}
					/>
				{/each}
			</div>
		</div>
	</CardContent>
</Card>
