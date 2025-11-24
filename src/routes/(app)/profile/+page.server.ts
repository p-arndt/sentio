import { redirect, fail } from '@sveltejs/kit';
import { UserService } from '$lib/server/services/user.service';
import { TeamService } from '$lib/server/services/team.service';
import { AchievementService } from '$lib/server/services/achievement.service';

export async function load({ locals }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const user = await UserService.getUserById(locals.user.id);
	const preferences = await UserService.getUserPreferences(locals.user.id);
	const teams = await TeamService.getUserTeams(locals.user.id);
	const userAchievements = await AchievementService.getAchievementsForUser(locals.user.id);
	const allAchievements = await AchievementService.getAllAchievements();

	return {
		user,
		preferences,
		teams,
		userAchievements,
		allAchievements
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
		const theme = data.get('theme')?.toString() as 'light' | 'dark' | 'system' | undefined;
		const defaultView = data.get('defaultView')?.toString() as 'week' | 'month' | undefined;
		const enableNotificationsStr = data.get('enableNotifications')?.toString();
		const startPage = data.get('startPage')?.toString();

		const settings: Record<string, string | boolean> = {};
		if (theme) settings.theme = theme;
		if (defaultView) settings.defaultView = defaultView;
		if (enableNotificationsStr !== undefined)
			settings.enableNotifications = enableNotificationsStr === 'true';
		if (startPage) settings.startPage = startPage;

		await UserService.upsertUserPreferences(locals.user.id, settings);

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
