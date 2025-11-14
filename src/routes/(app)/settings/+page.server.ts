import { TeamService } from '$lib/server/services/team.service';
import { UserService } from '$lib/server/services/user.service';
import { SettingsService } from '$lib/server/services/settings.service';
import { redirect } from '@sveltejs/kit';

export async function load({ locals }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const user = await UserService.getUserById(locals.user.id);
	if (!user) {
		throw redirect(303, '/login');
	}

	const [preferences, teams, reminders, calendarAccounts, pushSubscriptionRecord] =
		await Promise.all([
			UserService.getUserPreferences(locals.user.id),
			TeamService.getUserTeams(locals.user.id),
			SettingsService.getMoodReminders(locals.user.id),
			SettingsService.getCalendarAccounts(locals.user.id),
			SettingsService.getActivePushSubscription(locals.user.id)
		]);

	const enableEventNotifications = Boolean(preferences?.settings?.enableEventNotifications);

	const hasPushSubscription = Boolean(pushSubscriptionRecord);

	return {
		user,
		preferences,
		teams,
		reminders,
		calendarAccounts,
		enableEventNotifications,
		hasPushSubscription
	};
}
