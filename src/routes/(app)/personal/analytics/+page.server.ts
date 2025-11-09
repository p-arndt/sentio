import { redirect } from '@sveltejs/kit';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { EmotionService } from '$lib/server/services/emotion.service';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Get emotions
	const emotions = await EmotionService.getGlobalEmotions();

	// Calculate date ranges
	const now = new Date();
	
	// Last 30 days
	const thirtyDaysAgo = new Date(now);
	thirtyDaysAgo.setDate(now.getDate() - 30);
	
	// Last 7 days (this week)
	const sevenDaysAgo = new Date(now);
	sevenDaysAgo.setDate(now.getDate() - 7);
	
	// Previous 7 days (last week)
	const fourteenDaysAgo = new Date(now);
	fourteenDaysAgo.setDate(now.getDate() - 14);

	// Last 90 days for trends
	const ninetyDaysAgo = new Date(now);
	ninetyDaysAgo.setDate(now.getDate() - 90);

	// Fetch personal mood entries
	const last30DaysEntries = await MoodEntryService.getPersonalMoodEntries(locals.user.id, thirtyDaysAgo, now);
	const last7DaysEntries = await MoodEntryService.getPersonalMoodEntries(locals.user.id, sevenDaysAgo, now);
	const previous7DaysEntries = await MoodEntryService.getPersonalMoodEntries(locals.user.id, fourteenDaysAgo, sevenDaysAgo);
	const last90DaysEntries = await MoodEntryService.getPersonalMoodEntries(locals.user.id, ninetyDaysAgo, now);

	// All time entries
	const allEntries = await MoodEntryService.getPersonalMoodEntries(locals.user.id, new Date('2020-01-01'), now);

	return {
		emotions,
		currentUserId: locals.user.id,
		last30DaysEntries,
		last7DaysEntries,
		previous7DaysEntries,
		last90DaysEntries,
		allEntries
	};
};
