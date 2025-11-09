import { redirect } from '@sveltejs/kit';
import { TeamService } from '$lib/server/services/team.service';

export async function load({ locals }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const teams = await TeamService.getUserTeams(locals.user.id);

	return {
		user: locals.user,
		teams
	};
}

export const actions = {
	createTeam: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const data = await request.formData();
		const name = data.get('name')?.toString();
		const description = data.get('description')?.toString();
		const visibility = data.get('visibility')?.toString() as 'public' | 'team' | 'private';

		if (!name) {
			return { success: false, error: 'Team name is required' };
		}

		const team = await TeamService.createTeam(locals.user.id, {
			name,
			description: description || undefined,
			visibility: visibility || 'team'
		});

		throw redirect(303, `/teams/${team.id}`);
	}
};
