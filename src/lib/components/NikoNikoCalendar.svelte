<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { ChevronLeft, ChevronRight, Users, Calendar, TrendingUp } from '@lucide/svelte';
	import TeamMemberRow from './TeamMemberRow.svelte';
	import EmotionSelector from './EmotionSelector.svelte';
	import { cn } from '$lib/utils';
	import type { WeekData } from '$lib/types';
	import type { EmotionWithIcon } from '$lib/data/emotions';

	type Props = {
		weekData: WeekData;
		emotions: EmotionWithIcon[];
		currentUserId?: string;
		selectedEmotion?: EmotionWithIcon;
		onEmotionSelect: (emotion: EmotionWithIcon, date: Date, memberId: string) => void;
		onCommentSave: (comment: string, date: Date, memberId: string) => void;
		onEmotionFilterChange: (emotion?: EmotionWithIcon) => void;
		onWeekChange: (direction: 'prev' | 'next') => void;
		className?: string;
	};

	let {
		weekData = {
			weekDays: [],
			teamMembers: []
		},
		emotions,
		currentUserId,
		selectedEmotion,
		onEmotionSelect,
		onCommentSave,
		onEmotionFilterChange,
		onWeekChange,
		className = ''
	}: Props = $props();

	function formatWeekRange(days: Date[]) {
		if (days.length === 0) return '';
		const first = days[0];
		const last = days[days.length - 1];

		const formatOptions: Intl.DateTimeFormatOptions = {
			month: 'short',
			day: 'numeric'
		};

		if (first.getMonth() === last.getMonth()) {
			return `${first.getDate()} - ${last.toLocaleDateString('en-US', formatOptions)}`;
		} else {
			return `${first.toLocaleDateString('en-US', formatOptions)} - ${last.toLocaleDateString('en-US', formatOptions)}`;
		}
	}

	function getDayName(date: Date) {
		return date.toLocaleDateString('en-US', { weekday: 'long' });
	}

	function getDayAndMonth(date: Date) {
		return date.toLocaleDateString('en-US', {
			month: 'short',
			day: 'numeric'
		});
	}

	function isToday(date: Date) {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	}

	function getCurrentSprintNumber() {
		const startDate = new Date('2024-01-01');
		const now = new Date();
		const daysDiff = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
		const sprintNumber = Math.floor(daysDiff / 14) + 1;
		return sprintNumber;
	}
</script>

<div class={cn('mx-auto max-w-7xl space-y-4 md:space-y-6', className)}>
	<!-- Header -->
	<Card class="border-primary/20 bg-linear-to-r from-primary/5 to-accent/10">
		<CardHeader class="p-4 md:p-6">
			<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
				<div class="flex items-center gap-3 md:gap-4">
					<div class="rounded-lg border bg-card p-2 shadow-sm">
						<Calendar class="h-6 w-6 text-primary md:h-8 md:w-8" />
					</div>
					<div>
						<CardTitle class="text-xl font-bold text-foreground md:text-3xl">
							Niko-Niko Calendar
						</CardTitle>
						<p class="mt-1 text-xs text-muted-foreground md:text-sm">
							Track team mood and well-being
						</p>
					</div>
				</div>

				<div class="flex items-center justify-between gap-3 md:gap-4">
					<Badge variant="secondary" class="flex items-center gap-1.5 px-2 py-1 md:px-3">
						<TrendingUp class="h-3 w-3" />
						Sprint {getCurrentSprintNumber()}
					</Badge>
					<div
						class="flex items-center gap-2 rounded-lg border bg-card px-2 py-1.5 shadow-sm md:px-3 md:py-2"
					>
						<Button
							variant="ghost"
							size="icon"
							onclick={() => onWeekChange('prev')}
							class="h-7 w-7 md:h-8 md:w-8"
						>
							<ChevronLeft class="h-4 w-4" />
						</Button>
						<span
							class="min-w-[100px] text-center text-xs font-semibold md:min-w-[140px] md:text-sm"
						>
							{formatWeekRange(weekData.weekDays)}
						</span>
						<Button
							variant="ghost"
							size="icon"
							onclick={() => onWeekChange('next')}
							class="h-7 w-7 md:h-8 md:w-8"
						>
							<ChevronRight class="h-4 w-4" />
						</Button>
					</div>
				</div>
			</div>
		</CardHeader>
	</Card>

	<!-- Emotion Legend/Quick Guide -->
	<Card>
		<CardHeader class="p-4 pb-3 md:p-6 md:pb-4">
			<div class="flex items-center justify-between">
				<div>
					<CardTitle class="text-base md:text-lg">Mood Palette</CardTitle>
					<p class="mt-1 text-xs text-muted-foreground md:text-sm">
						Click on any cell to log your mood for the day
					</p>
				</div>
				{#if selectedEmotion}
					<Button variant="ghost" size="sm" onclick={() => onEmotionFilterChange(undefined)}>
						Clear filter
					</Button>
				{/if}
			</div>
		</CardHeader>
		<CardContent class="p-4 pt-0 md:p-6">
			<EmotionSelector
				{emotions}
				{selectedEmotion}
				onSelect={onEmotionFilterChange}
				size="md"
				className="justify-start"
				showLabels={true}
			/>
		</CardContent>
	</Card>

	<!-- Calendar Grid -->
	<Card class="overflow-hidden">
		<CardContent class="p-0">
			<!-- Day Headers -->
			<div class="sticky top-0 z-10 border-b-2 bg-card px-3 py-3 md:px-6 md:py-4">
				<div class="grid grid-cols-[auto_repeat(5,1fr)] gap-2 md:gap-4">
					<div class="w-24 shrink-0 md:w-40">
						<div class="flex items-center gap-2 text-xs font-semibold text-foreground md:text-sm">
							<Users class="h-3 w-3 md:h-4 md:w-4" />
							<span class="hidden md:inline">Team Members</span>
							<span class="md:hidden">Team</span>
						</div>
					</div>
					{#each weekData.weekDays as day (day.toISOString())}
						<div class="min-w-0 text-center">
							<div class="truncate text-[10px] font-semibold text-foreground md:text-sm">
								{getDayName(day).slice(0, 3)}
							</div>
							<div
								class={cn(
									'mt-0.5 text-[9px] text-muted-foreground md:mt-1 md:text-xs',
									isToday(day) && 'font-semibold text-primary'
								)}
							>
								{getDayAndMonth(day).replace(' ', '\u00A0')}
								{#if isToday(day)}
									<span class="ml-0.5 text-primary md:ml-1">•</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			</div>

			<!-- Team Member Rows -->
			<div class="px-3 py-3 md:px-6 md:py-6">
				<div class="space-y-2 md:space-y-4">
					{#each weekData.teamMembers as member, index (index)}
						<TeamMemberRow
							teamMember={member}
							weekDays={weekData.weekDays}
							{emotions}
							{currentUserId}
							{onEmotionSelect}
							{onCommentSave}
							className={cn(
								'hover:bg-muted/30 rounded-lg md:rounded-xl px-2 py-2 md:px-4 md:py-3 transition-colors',
								index % 2 === 0 && 'bg-muted/20'
							)}
						/>
					{/each}
				</div>
			</div>
		</CardContent>
	</Card>
</div>
