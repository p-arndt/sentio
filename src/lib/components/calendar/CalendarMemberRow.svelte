<script lang="ts">
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { getUserInitials, isAnonymousUser } from '$lib/utils/user';
	import type {
		Emotion,
		MoodEntryWithDetails,
		TeamMemberWithUser,
		MoodSharePreference
	} from '$lib/types';
	import CalendarDayCell from './CalendarDayCell.svelte';

	type Props = {
		member: TeamMemberWithUser;
		days: Date[];
		emotions: Emotion[];
		entries: MoodEntryWithDetails[];
		currentUserId?: string;
		teamId?: string;
		teamSharingPreferenceForCurrentUser?: MoodSharePreference;
		onEdit?: (day: Date, mood: MoodEntryWithDetails, userId: string) => void;
		isSubmitting?: boolean;
		requireComment?: boolean;
		showWeekends?: boolean;
	};

	let {
		member,
		days,
		emotions,
		entries,
		currentUserId,
		onEdit,
		isSubmitting = false,
		requireComment = false,
		showWeekends = true,
		teamId,
		teamSharingPreferenceForCurrentUser = 'public'
	}: Props = $props();
</script>

<div
	class={'grid gap-2 rounded-lg p-2 md:gap-4 md:p-4 ' +
		(isAnonymousUser(member.userId)
			? 'border-3 border-dashed border-white/25 bg-muted!'
			: 'border')}
	style="grid-template-columns: var(--calendar-grid-template, 200px repeat(7,1fr))"
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
			{onEdit}
			{isSubmitting}
			{requireComment}
			{teamId}
			teamSharingPreference={member.userId === currentUserId
				? teamSharingPreferenceForCurrentUser
				: 'public'}
		/>
	{/each}
</div>
