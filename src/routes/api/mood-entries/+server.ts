import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';
import { TeamService } from '$lib/server/services/team.service';

/**
 * GET /api/mood-entries
 * Get mood entries for a user or team within a date range
 */
export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	const startDate = url.searchParams.get('startDate');
	const endDate = url.searchParams.get('endDate');
	const teamId = url.searchParams.get('teamId');
	const personal = url.searchParams.get('personal') === 'true';

	if (!startDate || !endDate) {
		return json({ success: false, error: 'startDate and endDate are required' }, { status: 400 });
	}

	try {
		const start = new Date(startDate);
		const end = new Date(endDate);

		let entries;

		if (personal || !teamId) {
			entries = await MoodEntryService.getPersonalMoodEntries(locals.user.id, start, end);
		} else {
			entries = await MoodEntryService.getTeamMoodEntries(teamId, start, end);
		}

		return json({ success: true, data: entries });
	} catch (error) {
		console.error('Error fetching mood entries:', error);
		return json({ success: false, error: 'Failed to fetch mood entries' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { emotionId, date, comment, teamId, timeOfDay, isPrivate } = await request.json();

		if (!emotionId || !date) {
			return json({ error: 'Emotion and date are required' }, { status: 400 });
		}

		// If teamId is provided, check if comment is required
		if (teamId) {
			const teamData = await TeamService.getTeamById(teamId);
			if (teamData && teamData.requireComment) {
				if (!comment || comment.trim().length === 0) {
					return json({ error: 'Comment is required for this team' }, { status: 400 });
				}
			}
		}

		// Expect date as 'YYYY-MM-DD'; fallback to parsing full string
		let dateStr = typeof date === 'string' ? date.trim() : '';
		if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
		const [y, m, d] = dateStr.split('-').map(Number);
		if (!y || !m || !d) {
			return json({ error: 'Invalid date format' }, { status: 400 });
		}
		// Create UTC date at noon to avoid timezone shifting across locales
		const entryDate = new Date(Date.UTC(y, m - 1, d, 12, 0, 0, 0));

		// Always create a new entry (allowing multiple moods per day)
		const result = await MoodEntryService.createMoodEntry({
			userId: locals.user.id,
			emotionId,
			date: entryDate,
			comment: comment || null,
			teamId: teamId || null,
			timeOfDay: timeOfDay || null,
			isPrivate: isPrivate || false
		});

		return json(result);
	} catch (error) {
		console.error('Error saving mood entry:', error);
		return json({ error: 'Failed to save entry' }, { status: 500 });
	}
};
