import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MoodEntryService } from '$lib/server/services/mood-entry.service';

/**
 * GET /api/mood-entries/[id]
 * Get a single mood entry by ID
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const entry = await MoodEntryService.getMoodEntryWithDetails(params.id);

		if (!entry) {
			return json({ success: false, error: 'Mood entry not found' }, { status: 404 });
		}

		// Check if user owns the entry or is viewing a team entry
		if (entry.userId !== locals.user.id && entry.isPrivate) {
			return json({ success: false, error: 'Forbidden' }, { status: 403 });
		}

		return json({ success: true, data: entry });
	} catch (error) {
		console.error('Error fetching mood entry:', error);
		return json({ success: false, error: 'Failed to fetch mood entry' }, { status: 500 });
	}
};

/**
 * PATCH /api/mood-entries/[id]
 * Update a mood entry
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Verify ownership
		const isOwner = await MoodEntryService.isOwner(params.id, locals.user.id);
		if (!isOwner) {
			return json({ success: false, error: 'Forbidden' }, { status: 403 });
		}

		const body = await request.json();
		const { emotionId, comment, isPrivate, isAnonymous, timeOfDay } = body;

		const entry = await MoodEntryService.updateMoodEntry(params.id, {
			emotionId,
			comment,
			isPrivate,
			isAnonymous,
			timeOfDay
		});

		if (!entry) {
			return json({ success: false, error: 'Mood entry not found' }, { status: 404 });
		}

		return json({ success: true, data: entry });
	} catch (error) {
		console.error('Error updating mood entry:', error);
		return json({ success: false, error: 'Failed to update mood entry' }, { status: 500 });
	}
};

/**
 * DELETE /api/mood-entries/[id]
 * Delete a mood entry
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		// Verify ownership
		const isOwner = await MoodEntryService.isOwner(params.id, locals.user.id);
		if (!isOwner) {
			return json({ success: false, error: 'Forbidden' }, { status: 403 });
		}

		await MoodEntryService.deleteMoodEntry(params.id);
		return json({ success: true, message: 'Mood entry deleted' });
	} catch (error) {
		console.error('Error deleting mood entry:', error);
		return json({ success: false, error: 'Failed to delete mood entry' }, { status: 500 });
	}
};
