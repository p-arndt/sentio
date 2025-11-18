import { getCurrentWeekEnd, getCurrentWeekStart, getDaysBefore } from '$lib';
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
		last30DaysEntriesRaw,
		last7DaysEntriesRaw,
		previous7DaysEntriesRaw,
		last90DaysEntriesRaw,
		allEntriesRaw,
		currentWeekEntriesRaw
	] = await Promise.all([
		TeamService.isUserTeamAdmin(params.id, locals.user.id),
		EmotionService.getTeamEmotions(params.id),
		MoodEntryService.getTeamMoodEntries(params.id, thirtyDaysAgo, now),
		MoodEntryService.getTeamMoodEntries(params.id, sevenDaysAgo, now),
		MoodEntryService.getTeamMoodEntries(params.id, fourteenDaysAgo, sevenDaysAgo),
		MoodEntryService.getTeamMoodEntries(params.id, ninetyDaysAgo, now),
		MoodEntryService.getTeamMoodEntries(params.id),
		MoodEntryService.getTeamMoodEntries(params.id, getCurrentWeekStart(), getCurrentWeekEnd())
	]);

	const aliasState = {
		map: new Map<string, { aliasId: string; aliasName: string }>(),
		nextIndex: 1
	};

	const sanitizeEntries = (entries: typeof last30DaysEntriesRaw) => {
		const result = MoodEntryService.anonymizeEntriesForViewer(entries, locals.user.id, {
			aliasState
		});
		aliasState.nextIndex = result.aliasState.nextIndex;
		return result.entries;
	};

	const last30DaysEntries = sanitizeEntries(last30DaysEntriesRaw);
	const last7DaysEntries = sanitizeEntries(last7DaysEntriesRaw);
	const previous7DaysEntries = sanitizeEntries(previous7DaysEntriesRaw);
	const last90DaysEntries = sanitizeEntries(last90DaysEntriesRaw);
	const allEntries = sanitizeEntries(allEntriesRaw);
	const currentWeekEntries = sanitizeEntries(currentWeekEntriesRaw);

	return {
		team,
		isAdmin,
		emotions,
		currentUserId: locals.user.id,
		last30DaysEntries,
		last7DaysEntries,
		previous7DaysEntries,
		last90DaysEntries,
		allEntries,
		currentWeekEntries
	};
};
