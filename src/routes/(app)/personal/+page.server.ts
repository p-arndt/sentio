import { redirect } from '@sveltejs/kit';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { EmotionService } from '$lib/server/services/emotion.service';
import type { User } from '$lib/types';

export async function load({ locals, url }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Accept weekStart as YYYY-MM-DD to match team calendar behavior
	const weekStartParam = url.searchParams.get('weekStart');

	let startOfWeek: Date;
	if (weekStartParam) {
		// Interpret as UTC midnight for stability across timezones
		startOfWeek = new Date(`${weekStartParam}T00:00:00.000Z`);
	} else {
		const today = new Date();
		const dayOfWeek = today.getDay();
		const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // If Sunday (0), go back 6 days
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

	// End of week (Sunday 23:59:59.999 UTC)
	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
	endOfWeek.setUTCHours(23, 59, 59, 999);

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
