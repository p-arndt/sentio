import { redirect } from '@sveltejs/kit';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { EmotionService } from '$lib/server/services/emotion.service';
import { getWeekRange } from '$lib/utils/date';
import type { User } from '$lib/types';

export async function load({ locals, url }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Accept weekStart as YYYY-MM-DD to match team calendar behavior
	const weekStartParam = url.searchParams.get('weekStart');

	const { startOfWeek, endOfWeek } = getWeekRange(weekStartParam);

	const moodEntries = await MoodEntryService.getPersonalMoodEntries(
		locals.user.id,
		startOfWeek,
		endOfWeek
	);
	const emotions = await EmotionService.getGlobalEmotions();

	return {
		user: locals.user as User,
		moodEntries,
		emotions,
		weekStart: startOfWeek.toISOString(),
		weekEnd: endOfWeek.toISOString()
	};
}
