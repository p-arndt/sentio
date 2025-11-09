import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { TeamService } from '$lib/server/services/team.service';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { EmotionService } from '$lib/server/services/emotion.service';
import type { MoodEntryWithDetails } from '$lib/types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Get user's teams
	const teams = await TeamService.getUserTeams(locals.user.id);

	// Get emotions
	const emotions = await EmotionService.getGlobalEmotions();

	// Get recent mood entries (last 7 days)
	const endDate = new Date();
	const startDate = new Date();
	startDate.setDate(startDate.getDate() - 7);

	const personalEntries = await MoodEntryService.getPersonalMoodEntries(
		locals.user.id,
		startDate,
		endDate
	);

	// Get team entries for first team if exists
	let teamEntries: MoodEntryWithDetails[] = [];
	if (teams.length > 0) {
		teamEntries = await MoodEntryService.getTeamMoodEntries(teams[0].id, startDate, endDate);
	}

	return {
		user: locals.user,
		teams,
		emotions,
		personalEntries,
		teamEntries,
		stats: {
			totalTeams: teams.length,
			personalEntriesCount: personalEntries.length,
			teamEntriesCount: teamEntries.length
		}
	};
};
