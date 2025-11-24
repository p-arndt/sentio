import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TeamService } from '$lib/server/services/team.service';

/**
 * GET /api/teams
 * Get all teams for the current user
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const teams = await TeamService.getUserTeams(locals.user.id);
		return json({ success: true, data: teams });
	} catch (error) {
		console.error('Error fetching teams:', error);
		return json({ success: false, error: 'Failed to fetch teams' }, { status: 500 });
	}
};

/**
 * POST /api/teams
 * Create a new team
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const {
			name,
			description,
			visibility,
			allowMultipleMoodsPerDay,
			requireComment,
			showWeekends,
			parentId,
			isContainer
		} = body;

		if (!name) {
			return json({ success: false, error: 'Team name is required' }, { status: 400 });
		}

		// If parentId is provided, verify user has permission to create subteam?
		// Usually, if I can create a team, I can make it a child of any team I can access?
		// Or only if I am admin of the parent?
		if (parentId) {
			const canManageParent = await TeamService.canUserManageTeam(locals.user.id, parentId);
			if (!canManageParent) {
				return json({ success: false, error: 'You do not have permission to add a subteam to this team' }, { status: 403 });
			}
		}

		const team = await TeamService.createTeam(locals.user.id, {
			name,
			description,
			visibility,
			allowMultipleMoodsPerDay,
			requireComment,
			showWeekends,
			parentId,
			isContainer
		});

		return json({ success: true, data: team }, { status: 201 });
	} catch (error) {
		console.error('Error creating team:', error);
		return json({ success: false, error: 'Failed to create team' }, { status: 500 });
	}
};
