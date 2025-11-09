<script lang="ts">
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import type { Emotion, MoodEntryWithDetails, TeamMemberWithUser } from '$lib/types';
	import CalendarDayCell from './CalendarDayCell.svelte';

	type Props = {
		member: TeamMemberWithUser;
		days: Date[];
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		currentUserId?: string;
		onQuickAdd: (emotionId: string, day: Date, userId: string) => void;
		onEdit?: (day: Date, mood: MoodEntryWithDetails, userId: string) => void;
		isSubmitting?: boolean;
		isEven?: boolean;
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
		isEven = false
	}: Props = $props();

	function getUserInitials(name: string) {
		return name
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}
</script>

<div
	class="grid gap-2 md:gap-4 {isEven ? 'bg-muted/20' : ''} rounded-lg border p-2 md:p-4"
	style="grid-template-columns: 200px repeat({days.length}, 1fr)"
>
	<div class="flex items-center gap-2">
		<Avatar class="h-8 w-8">
			<AvatarImage src={member.user.image ?? undefined} alt={member.user.name} />
			<AvatarFallback>{getUserInitials(member.user.name)}</AvatarFallback>
		</Avatar>
		<div class="min-w-0 flex-1">
			<div class="truncate text-xs md:text-sm font-medium">{member.user.name}</div>
			{#if member.role === 'admin'}
				<Badge variant="secondary" class="text-xs mt-1">Admin</Badge>
			{/if}
		</div>
	</div>

	{#each days as day}
		<CalendarDayCell
			{day}
			{emotions}
			{entries}
			userId={member.userId}
			{currentUserId}
			{onQuickAdd}
			{onEdit}
			{isSubmitting}
		/>
	{/each}
</div>
