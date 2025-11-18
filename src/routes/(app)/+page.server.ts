import { getDaysBefore } from '$lib';
import { EmotionService } from '$lib/server/services/emotion.service';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { TeamService } from '$lib/server/services/team.service';
import { UserService } from '$lib/server/services/user.service';
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

	// Parallelize independent requests: teams, emotions, personal entries, and preferences
	const [teams, emotions, personalEntries, preferences] = await Promise.all([
		TeamService.getUserTeams(locals.user.id),
		EmotionService.getGlobalEmotions(),
		MoodEntryService.getPersonalMoodEntries(locals.user.id, startDate, endDate),
		UserService.getUserPreferences(locals.user.id)
	]);

	// Team entries depend on teams result
	let teamEntries: MoodEntryWithDetails[] = [];
	if (teams.length > 0) {
		const rawTeamEntries = await MoodEntryService.getTeamMoodEntries(
			teams[0].id,
			startDate,
			endDate
		);
		teamEntries = MoodEntryService.anonymizeEntriesForViewer(rawTeamEntries, locals.user.id).entries;
	}

	return {
		user: locals.user,
		teams,
		emotions,
		personalEntries,
		teamEntries,
		preferences,
		stats: {
			totalTeams: teams.length,
			personalEntriesCount: personalEntries.length,
			teamEntriesCount: teamEntries.length
		}
	};
};
