import { getDaysBefore } from '$lib';
import { EmotionService } from '$lib/server/services/emotion.service';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { TeamService } from '$lib/server/services/team.service';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

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

	// Calculate date ranges
	const now = new Date();
	const thirtyDaysAgo = getDaysBefore(30, now);
	const sevenDaysAgo = getDaysBefore(7, now);
	const fourteenDaysAgo = getDaysBefore(14, now);
	const ninetyDaysAgo = getDaysBefore(90, now);

	// Fetch all data in parallel
	const [
		isAdmin,
		emotions,
		last30DaysEntries,
		last7DaysEntries,
		previous7DaysEntries,
		last90DaysEntries,
		allEntries
	] = await Promise.all([
		TeamService.isUserTeamAdmin(params.id, locals.user.id),
		EmotionService.getTeamEmotions(params.id),
		MoodEntryService.getTeamMoodEntries(params.id, thirtyDaysAgo, now),
		MoodEntryService.getTeamMoodEntries(params.id, sevenDaysAgo, now),
		MoodEntryService.getTeamMoodEntries(params.id, fourteenDaysAgo, sevenDaysAgo),
		MoodEntryService.getTeamMoodEntries(params.id, ninetyDaysAgo, now),
		MoodEntryService.getTeamMoodEntries(params.id, new Date('2020-01-01'), now)
	]);

	return {
		team,
		isAdmin,
		emotions,
		currentUserId: locals.user.id,
		last30DaysEntries,
		last7DaysEntries,
		previous7DaysEntries,
		last90DaysEntries,
		allEntries
	};
};
