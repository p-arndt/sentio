import { redirect } from '@sveltejs/kit';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { EmotionService } from '$lib/server/services/emotion.service';
import { UserService } from '$lib/server/services/user.service';
import { getWeekRange } from '$lib/utils/date';
import type { User } from '$lib/types';

export async function load({ locals, url }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Accept weekStart as YYYY-MM-DD to match team calendar behavior
	const weekStartParam = url.searchParams.get('weekStart');

	const { startOfWeek, endOfWeek } = getWeekRange(weekStartParam);

	// Fetch a broader date range to support calendar views
	// Get the entire month containing the week start date
	const monthStart = new Date(startOfWeek);
	monthStart.setDate(1);
	const monthEnd = new Date(startOfWeek);
	monthEnd.setMonth(monthEnd.getMonth() + 1);
	monthEnd.setDate(0);

	const moodEntries = await MoodEntryService.getPersonalMoodEntries(
		locals.user.id,
		monthStart,
		monthEnd
	);
	const emotions = await EmotionService.getGlobalEmotions();
	const preferences = await UserService.getUserPreferences(locals.user.id);

	return {
		user: locals.user as User,
		moodEntries,
		emotions,
		weekStart: startOfWeek.toISOString(),
		weekEnd: endOfWeek.toISOString(),
		defaultView: (preferences?.settings?.defaultView as 'day' | 'week' | 'month') || 'week'
	};
}
