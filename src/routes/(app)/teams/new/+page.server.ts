import { redirect } from '@sveltejs/kit';
import { TeamService } from '$lib/server/services/team.service';

export async function load({ locals }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const teamTrees = await TeamService.getUserTeamTrees(locals.user.id);

	return {
		user: locals.user,
		teamTrees
	};
}
