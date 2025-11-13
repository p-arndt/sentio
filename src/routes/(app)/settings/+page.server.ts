import { redirect } from '@sveltejs/kit';
import { UserService } from '$lib/server/services/user.service';
import { TeamService } from '$lib/server/services/team.service';
import { db } from '$lib/server/db';
import { moodReminder } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function load({ locals }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const user = await UserService.getUserById(locals.user.id);
	const preferences = await UserService.getUserPreferences(locals.user.id);
	const teams = await TeamService.getUserTeams(locals.user.id);
	
	// Load reminders
	const reminders = await db
		.select()
		.from(moodReminder)
		.where(eq(moodReminder.userId, locals.user.id))
		.orderBy(moodReminder.time);

	return {
		user,
		preferences,
		teams,
		reminders
	};
}
