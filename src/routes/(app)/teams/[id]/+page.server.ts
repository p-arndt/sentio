import { EmotionService } from '$lib/server/services/emotion.service';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { TeamService } from '$lib/server/services/team.service';
import { UserService } from '$lib/server/services/user.service';
import { getWeekRange } from '$lib/utils/date';
import { error, redirect } from '@sveltejs/kit';
import type { MoodSharePreference } from '$lib/types';

export async function load({ params, locals, url }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Validate that params.id is a valid UUID/ID format
	if (!params.id || params.id === 'new') {
		throw redirect(303, '/teams');
	}

	const canAccess = await TeamService.canUserAccessTeam(locals.user.id, params.id);
	if (!canAccess) {
		throw error(403, 'You do not have access to this team');
	}

	const team = await TeamService.getTeamWithMembers(params.id);
	if (!team) {
		throw error(404, 'Team not found');
	}

	const isAdmin = await TeamService.canUserManageTeam(locals.user.id, params.id);
	const ancestors = await TeamService.getTeamAncestors(params.id);
	const children = await TeamService.getTeamChildren(params.id);

	// Get emotions for this team
	const emotions = await EmotionService.getTeamEmotions(params.id);

	// Determine week range (Monday to Sunday) from query or current week
	const weekStartParam = url.searchParams.get('weekStart'); // YYYY-MM-DD
	const { startOfWeek, endOfWeek } = getWeekRange(weekStartParam);

	const rawEntries = await MoodEntryService.getTeamMoodEntries(params.id, startOfWeek, endOfWeek);
	const { entries, anonymousMembers } = MoodEntryService.anonymizeEntriesForViewer(
		rawEntries,
		locals.user.id,
		{ teamId: team.id }
	);

	// Fetch child teams data if this is a container team
	const childTeamsData = await Promise.all(
		children.map(async (child) => {
			const canAccessChild = await TeamService.canUserAccessTeam(locals.user.id, child.id);
			if (!canAccessChild) return null;

			const childTeam = await TeamService.getTeamWithMembers(child.id);
			if (!childTeam) return null;

			const childEmotions = await EmotionService.getTeamEmotions(child.id);
			const childRawEntries = await MoodEntryService.getTeamMoodEntries(
				child.id,
				startOfWeek,
				endOfWeek
			);
			const { entries: childEntries, anonymousMembers: childAnonymousMembers } =
				MoodEntryService.anonymizeEntriesForViewer(childRawEntries, locals.user.id, {
					teamId: child.id
				});

			return {
				team: childTeam,
				emotions: childEmotions,
				entries: childEntries,
				anonymousMembers: childAnonymousMembers
			};
		})
	);

	const preferences = await UserService.getUserPreferences(locals.user.id);
	const teamSharingOverrides =
		(preferences?.settings?.teamSharingOverrides as Record<string, MoodSharePreference>) || {};
	const teamSharingDefault =
		(preferences?.settings?.teamSharingDefault as MoodSharePreference) || 'public';
	const teamSharingPreference = teamSharingOverrides[params.id] ?? teamSharingDefault;

	return {
		team,
		ancestors,
		children,
		childTeamsData: childTeamsData.filter((d): d is NonNullable<typeof d> => d !== null),
		isAdmin,
		emotions,
		entries,
		anonymousMembers,
		currentUserId: locals.user.id,
		weekStart: startOfWeek.toISOString(),
		weekEnd: endOfWeek.toISOString(),
		defaultView: (preferences?.settings?.defaultView as 'week' | 'month') || 'week',
		teamSharingPreference,
		teamSharingOverrides,
		teamSharingDefault
	};
}
