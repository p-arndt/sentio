import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { UserService } from '$lib/server/services/user.service';

/**
 * GET /api/user/preferences
 * Get current user's preferences
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const preferences = await UserService.getUserPreferences(locals.user.id);
		return json({ success: true, data: preferences });
	} catch (error) {
		console.error('Error fetching preferences:', error);
		return json({ success: false, error: 'Failed to fetch preferences' }, { status: 500 });
	}
};

/**
 * PATCH /api/user/preferences
 * Update current user's preferences
 */
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { theme, defaultView, enableNotifications } = body;

		const preferences = await UserService.upsertUserPreferences(locals.user.id, {
			theme,
			defaultView,
			enableNotifications
		});

		return json({ success: true, data: preferences });
	} catch (error) {
		console.error('Error updating preferences:', error);
		return json({ success: false, error: 'Failed to update preferences' }, { status: 500 });
	}
};
