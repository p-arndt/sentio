import { json } from '@sveltejs/kit';
import { TeamService } from '$lib/server/services/team.service';

export async function GET({ params, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const teamId = params.id;
	// If user can access the team, they can see its ancestors (to know where it is)
	const canAccess = await TeamService.canUserAccessTeam(locals.user.id, teamId);
	if (!canAccess) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const ancestors = await TeamService.getTeamAncestors(teamId);
	return json(ancestors);
}

