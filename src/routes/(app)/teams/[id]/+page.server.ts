import { EmotionService } from '$lib/server/services/emotion.service';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { TeamService } from '$lib/server/services/team.service';
import { UserService } from '$lib/server/services/user.service';
import { getWeekRange } from '$lib/utils/date';
import { error, redirect } from '@sveltejs/kit';

export async function load({ params, locals, url }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Validate that params.id is a valid UUID/ID format
	if (!params.id || params.id === 'new') {
		throw redirect(303, '/teams');
	}

	const isMember = await TeamService.isUserMember(params.id, locals.user.id);
	if (!isMember) {
		throw error(403, 'You are not a member of this team');
	}

	const team = await TeamService.getTeamWithMembers(params.id);
	if (!team) {
		throw error(404, 'Team not found');
	}

	const isAdmin = await TeamService.isUserTeamAdmin(params.id, locals.user.id);

	// Get emotions for this team
	const emotions = await EmotionService.getTeamEmotions(params.id);

	// Determine week range (Monday to Sunday) from query or current week
	const weekStartParam = url.searchParams.get('weekStart'); // YYYY-MM-DD
	const { startOfWeek, endOfWeek } = getWeekRange(weekStartParam);

	const entries = await MoodEntryService.getTeamMoodEntries(params.id, startOfWeek, endOfWeek);

	const preferences = await UserService.getUserPreferences(locals.user.id);

	return {
		team,
		isAdmin,
		emotions,
		entries,
		currentUserId: locals.user.id,
		weekStart: startOfWeek.toISOString(),
		weekEnd: endOfWeek.toISOString(),
		defaultView: (preferences?.settings?.defaultView as 'day' | 'week' | 'month') || 'week'
	};
}
