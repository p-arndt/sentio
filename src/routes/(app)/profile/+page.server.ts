import { redirect, fail } from '@sveltejs/kit';
import { UserService } from '$lib/server/services/user.service';

export async function load({ locals }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const user = await UserService.getUserById(locals.user.id);
	const preferences = await UserService.getUserPreferences(locals.user.id);

	return {
		user,
		preferences
	};
}

export const actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const name = data.get('name')?.toString();
		const timezone = data.get('timezone')?.toString();

		if (!name) {
			return fail(400, { error: 'Name is required' });
		}

		await UserService.updateUserProfile(locals.user.id, {
			name,
			timezone
		});

		return { success: true, message: 'Profile updated successfully' };
	},

	updatePreferences: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const theme = data.get('theme')?.toString() as 'light' | 'dark' | 'system';
		const defaultView = data.get('defaultView')?.toString() as 'day' | 'week' | 'month';
		const enableNotifications = data.get('enableNotifications') === 'true';

		await UserService.upsertUserPreferences(locals.user.id, {
			theme,
			defaultView,
			enableNotifications
		});

		return { success: true, message: 'Preferences updated successfully' };
	},

	togglePersonalMode: async ({ request, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const enabled = data.get('enabled') === 'true';

		await UserService.togglePersonalMode(locals.user.id, enabled);

		return { success: true, message: 'Personal mode updated' };
	}
};
