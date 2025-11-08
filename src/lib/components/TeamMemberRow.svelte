<script lang="ts">
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import CalendarCell from './CalendarCell.svelte';
	import { cn } from '$lib/utils';
	import type { TeamMember } from '$lib/types';
	import type { EmotionWithIcon } from '$lib/data/emotions';

	type Props = {
		teamMember: TeamMember;
		weekDays: Date[];
		emotions: EmotionWithIcon[];
		currentUserId?: string;
		onEmotionSelect: (emotion: EmotionWithIcon, date: Date, memberId: string) => void;
		onCommentSave: (comment: string, date: Date, memberId: string) => void;
		className?: string;
	};

	let { teamMember, weekDays, emotions, currentUserId, onEmotionSelect, onCommentSave, className } = $props();

	const isOwnRow = $derived(currentUserId === teamMember.id);

	function getEntryForDate(date: Date) {
		return teamMember.entries.find((entry: any) => 
			entry.date.toDateString() === date.toDateString()
		);
	}

	function handleEmotionSelect(emotion: EmotionWithIcon, date: Date) {
		onEmotionSelect(emotion, date, teamMember.id);
	}

	function handleCommentSave(comment: string, date: Date) {
		onCommentSave(comment, date, teamMember.id);
	}

	function getInitials(name: string) {
		return name
			.split(' ')
			.map(n => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	function isToday(date: Date) {
		const today = new Date();
		return date.toDateString() === today.toDateString();
	}
</script>

<div class={cn('grid grid-cols-[auto_repeat(5,1fr)] gap-2 md:gap-4 py-1 md:py-2', className)}>
	<!-- Team Member Info -->
	<div class="flex items-center gap-2 md:gap-3 w-24 md:w-40 shrink-0">
		<Avatar class="w-7 h-7 md:w-10 md:h-10 border-2 border-border">
			<AvatarImage src="" alt={teamMember.name} />
			<AvatarFallback class="text-[10px] md:text-sm font-semibold bg-primary text-primary-foreground">
				{getInitials(teamMember.name)}
			</AvatarFallback>
		</Avatar>
		<span class="font-medium text-[11px] md:text-sm text-foreground truncate">
			{teamMember.name}
		</span>
	</div>

	<!-- Calendar Cells -->
	{#each weekDays as date}
		<CalendarCell
			{date}
			{emotions}
			entry={getEntryForDate(date)}
			isToday={isToday(date)}
			isEditable={isOwnRow}
			onEmotionSelect={handleEmotionSelect}
			onCommentSave={handleCommentSave}
			className="min-w-0"
		/>
	{/each}
</div>