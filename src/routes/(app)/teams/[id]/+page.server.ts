import { redirect, error } from '@sveltejs/kit';
import { TeamService } from '$lib/server/services/team.service';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { EmotionService } from '$lib/server/services/emotion.service';

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

	let startOfWeek: Date;
	if (weekStartParam) {
		// Interpret as UTC midnight for stability across TZs
		startOfWeek = new Date(`${weekStartParam}T00:00:00.000Z`);
	} else {
		const today = new Date();
		const dayOfWeek = today.getDay();
		const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday (0), go back 6 days, else go to Monday
		startOfWeek = new Date(
			Date.UTC(
				today.getUTCFullYear(),
				today.getUTCMonth(),
				today.getUTCDate() + daysToMonday,
				0,
				0,
				0,
				0
			)
		);
	}

	// End of week in UTC
	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
	endOfWeek.setUTCHours(23, 59, 59, 999);

	const entries = await MoodEntryService.getTeamMoodEntries(params.id, startOfWeek, endOfWeek);

	// If no entries AND user did not explicitly select a week, redirect to the latest week with entries
	if (entries.length === 0 && !weekStartParam) {
		const latest = await MoodEntryService.getLatestTeamEntry(params.id);
		if (latest) {
			// Compute Monday of latest.date
			const latestDate = new Date(latest.date);
			const latestDay = latestDate.getUTCDay();
			const offset = latestDay === 0 ? -6 : 1 - latestDay;
			const latestWeekStart = new Date(
				Date.UTC(
					latestDate.getUTCFullYear(),
					latestDate.getUTCMonth(),
					latestDate.getUTCDate() + offset,
					0,
					0,
					0,
					0
				)
			);
			const y = latestWeekStart.getUTCFullYear();
			const m = String(latestWeekStart.getUTCMonth() + 1).padStart(2, '0');
			const d = String(latestWeekStart.getUTCDate()).padStart(2, '0');
			const target = `/teams/${params.id}?weekStart=${y}-${m}-${d}`;
			throw redirect(303, target);
		}
	}

	return {
		team,
		isAdmin,
		emotions,
		entries,
		currentUserId: locals.user.id,
		weekStart: startOfWeek.toISOString(),
		weekEnd: endOfWeek.toISOString()
	};
}
