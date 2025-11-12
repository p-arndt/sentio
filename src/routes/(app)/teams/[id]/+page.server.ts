import { redirect, error } from '@sveltejs/kit';
import { TeamService } from '$lib/server/services/team.service';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { EmotionService } from '$lib/server/services/emotion.service';
import { UserService } from '$lib/server/services/user.service';
import { getWeekRange, toYMD } from '$lib/utils/date';

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

	// If no entries AND user did not explicitly select a week, redirect to the latest week with entries
	if (entries.length === 0 && !weekStartParam) {
		const latest = await MoodEntryService.getLatestTeamEntry(params.id);
		if (latest) {
			// Compute week range for latest.date and redirect to its Monday (UTC Y-M-D)
			const { startOfWeek: latestWeekStart } = getWeekRange(undefined, new Date(latest.date));
			const ymd = toYMD(latestWeekStart);
			const target = `/teams/${params.id}?weekStart=${ymd}`;
			throw redirect(303, target);
		}
	}

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
