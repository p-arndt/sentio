import { redirect } from '@sveltejs/kit';
import { UserService } from '$lib/server/services/user.service';
import { TeamService } from '$lib/server/services/team.service';

export async function load({ locals }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const user = await UserService.getUserById(locals.user.id);
	const preferences = await UserService.getUserPreferences(locals.user.id);
	const teams = await TeamService.getUserTeams(locals.user.id);

	return {
		user,
		preferences,
		teams
	};
}
