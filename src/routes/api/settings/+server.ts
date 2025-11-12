import type { UserSettings } from '$lib';
import { SETTINGS_SECTIONS } from '$lib/settings/settings';
import { UserService } from '$lib/server/services/user.service';
import { json, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = await request.json();

		await UserService.upsertUserPreferences(locals.user.id, data as Partial<UserSettings>);

		// Re-fetch updated data to return to client
		const updatedPreferences = await UserService.getUserPreferences(locals.user.id);

		// Serialize only the necessary data
		return json({
			success: true,
			preferences: {
				settings: updatedPreferences?.settings || {}
			}
		});
	} catch (error) {
		console.error('Failed to update settings:', error);
		return json({ error: 'Failed to save settings' }, { status: 500 });
	}
};
