import { getDaysBefore } from '$lib';
import { EmotionService } from '$lib/server/services/emotion.service';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { TeamService } from '$lib/server/services/team.service';
import type { MoodEntryWithDetails } from '$lib/types';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Date range for recent mood entries
	const endDate = new Date();
	const startDate = getDaysBefore(7);

	// Parallelize independent requests: teams, emotions and personal entries
	const [teams, emotions, personalEntries] = await Promise.all([
		TeamService.getUserTeams(locals.user.id),
		EmotionService.getGlobalEmotions(),
		MoodEntryService.getPersonalMoodEntries(locals.user.id, startDate, endDate)
	]);

	// Team entries depend on teams result
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
