<script lang="ts">
	import type {
		TeamWithMembers,
		Emotion,
		MoodEntryWithDetails,
		TeamMemberWithUser,
		MoodSharePreference
	} from '$lib/types';
	import { Users } from '@lucide/svelte';
	import WeekView from '$lib/components/calendar/views/WeekView.svelte';

	type Props = {
		childTeam: {
			team: TeamWithMembers;
			emotions: Emotion[];
			entries: MoodEntryWithDetails[];
			anonymousMembers: TeamMemberWithUser[];
		};
		weekStart: Date;
		weekDays: Date[];
		currentUserId?: string;
		showWeekends: boolean;
		requireComment?: boolean;
		teamSharingPreference?: MoodSharePreference;
		onWeekChange: (direction: 'prev' | 'next') => void;
		onEdit?: (date: Date, mood: MoodEntryWithDetails, userId: string) => void;
		isSubmitting?: boolean;
		teamIndex?: number; // For color variation
	};

	let {
		childTeam,
		weekStart,
		weekDays,
		currentUserId,
		showWeekends,
		requireComment = false,
		teamSharingPreference = 'public',
		onWeekChange,
		onEdit,
		isSubmitting = false,
		teamIndex = 0
	}: Props = $props();

	// Combine regular members and anonymous members
	let allMembers = $derived([
		...childTeam.team.members,
		...childTeam.anonymousMembers
	]);

	// Generate a subtle color based on team index for visual distinction
	// Using a palette of soft, muted colors that work in both light and dark modes
	const teamColors = [
		{ outline: 'outline-blue-400/30 dark:outline-blue-500/40', border: 'border-blue-400/30 dark:border-blue-500/40', bg: 'bg-blue-500/5 dark:bg-blue-500/10' },
		{ outline: 'outline-green-400/30 dark:outline-green-500/40', border: 'border-green-400/30 dark:border-green-500/40', bg: 'bg-green-500/5 dark:bg-green-500/10' },
		{ outline: 'outline-purple-400/30 dark:outline-purple-500/40', border: 'border-purple-400/30 dark:border-purple-500/40', bg: 'bg-purple-500/5 dark:bg-purple-500/10' },
		{ outline: 'outline-orange-400/30 dark:outline-orange-500/40', border: 'border-orange-400/30 dark:border-orange-500/40', bg: 'bg-orange-500/5 dark:bg-orange-500/10' },
		{ outline: 'outline-pink-400/30 dark:outline-pink-500/40', border: 'border-pink-400/30 dark:border-pink-500/40', bg: 'bg-pink-500/5 dark:bg-pink-500/10' },
		{ outline: 'outline-cyan-400/30 dark:outline-cyan-500/40', border: 'border-cyan-400/30 dark:border-cyan-500/40', bg: 'bg-cyan-500/5 dark:bg-cyan-500/10' },
		{ outline: 'outline-yellow-400/30 dark:outline-yellow-500/40', border: 'border-yellow-400/30 dark:border-yellow-500/40', bg: 'bg-yellow-500/5 dark:bg-yellow-500/10' },
		{ outline: 'outline-indigo-400/30 dark:outline-indigo-500/40', border: 'border-indigo-400/30 dark:border-indigo-500/40', bg: 'bg-indigo-500/5 dark:bg-indigo-500/10' }
	];

	let colorScheme = $derived(teamColors[teamIndex % teamColors.length]);
</script>

<div class="{colorScheme.bg} rounded-lg my-2 overflow-hidden">
	<div class="px-3 py-2 md:px-6 md:py-3 border-b {colorScheme.border}">
		<div class="flex items-center gap-2 text-sm font-medium">
			<Users class="h-3.5 w-3.5" />
			<a href="/teams/{childTeam.team.id}" class="hover:text-primary transition-colors">
				{childTeam.team.name}
			</a>
		</div>
	</div>
	<div class="overflow-hidden">
		<WeekView
			{weekStart}
			{weekDays}
			teamMembers={allMembers}
			emotions={childTeam.emotions}
			entries={childTeam.entries}
			{currentUserId}
			{showWeekends}
			{requireComment}
			teamId={childTeam.team.id}
			teamSharingPreferenceForCurrentUser={teamSharingPreference}
			{onWeekChange}
			{onEdit}
			{isSubmitting}
			isContainer={childTeam.team.isContainer}
			className="border-0 shadow-none m-0 p-0"
			teamIndex={teamIndex}
			hideHeader={true}
		/>
	</div>
</div>

