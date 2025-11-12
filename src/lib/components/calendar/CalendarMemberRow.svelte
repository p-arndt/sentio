<script lang="ts">
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { getUserInitials } from '$lib/utils/user';
	import type { Emotion, MoodEntryWithDetails, TeamMemberWithUser } from '$lib/types';
	import CalendarDayCell from './CalendarDayCell.svelte';

	type Props = {
		member: TeamMemberWithUser;
		days: Date[];
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		currentUserId?: string;
		onQuickAdd: (emotionId: string, day: Date, userId: string, comment?: string) => void;
		onEdit?: (day: Date, mood: MoodEntryWithDetails, userId: string) => void;
		isSubmitting?: boolean;
		requireComment?: boolean;
		isEven?: boolean;
		showWeekends?: boolean;
	};

	let {
		member,
		days,
		emotions,
		entries,
		currentUserId,
		onQuickAdd,
		onEdit,
		isSubmitting = false,
		requireComment = false,
		isEven = false,
		showWeekends = true
	}: Props = $props();
</script>

<div
	class="grid gap-2 md:gap-4 {isEven ? 'bg-muted/20' : ''} rounded-lg border p-2 md:p-4 {showWeekends ? 'grid-cols-[200px_repeat(7,1fr)]' : 'grid-cols-[200px_repeat(5,1fr)]'}"
>
	<div class="flex items-center gap-2">
		<Avatar class="h-8 w-8">
			<AvatarImage src={member.user.image ?? undefined} alt={member.user.name} />
			<AvatarFallback>{getUserInitials(member.user.name)}</AvatarFallback>
		</Avatar>
		<div class="min-w-0 flex-1">
			<div class="truncate text-xs font-medium md:text-sm">{member.user.name}</div>
			{#if member.role === 'admin'}
				<Badge variant="secondary" class="mt-1 text-xs">Admin</Badge>
			{/if}
		</div>
	</div>

	{#each days as day (day.toISOString())}
		<CalendarDayCell
			{day}
			{emotions}
			{entries}
			userId={member.userId}
			{currentUserId}
			{onQuickAdd}
			{onEdit}
			{isSubmitting}
			{requireComment}
		/>
	{/each}
</div>
