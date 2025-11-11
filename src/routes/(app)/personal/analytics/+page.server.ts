import { getCurrentWeekEnd, getCurrentWeekStart, getDaysBefore } from '$lib';
import { EmotionService } from '$lib/server/services/emotion.service';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const now = new Date();
	const thirtyDaysAgo = getDaysBefore(30, now);
	const sevenDaysAgo = getDaysBefore(7, now);
	const fourteenDaysAgo = getDaysBefore(14, now);
	const ninetyDaysAgo = getDaysBefore(90, now);

	// Run independent fetches in parallel
	const [
		emotions,
		last30DaysEntries,
		last7DaysEntries,
		previous7DaysEntries,
		last90DaysEntries,
		allEntries,
		currentWeekEntries
	] = await Promise.all([
		EmotionService.getGlobalEmotions(),
		MoodEntryService.getPersonalMoodEntries(locals.user.id, thirtyDaysAgo, now),
		MoodEntryService.getPersonalMoodEntries(locals.user.id, sevenDaysAgo, now),
		MoodEntryService.getPersonalMoodEntries(locals.user.id, fourteenDaysAgo, sevenDaysAgo),
		MoodEntryService.getPersonalMoodEntries(locals.user.id, ninetyDaysAgo, now),
		MoodEntryService.getPersonalMoodEntries(locals.user.id),
		MoodEntryService.getPersonalMoodEntries(
			locals.user.id,
			getCurrentWeekStart(),
			getCurrentWeekEnd()
		)
	]);

	return {
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
