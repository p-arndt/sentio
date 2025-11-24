import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TeamService } from '$lib/server/services/team.service';

/**
 * GET /api/teams/[id]
 * Get a specific team with members
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const canAccess = await TeamService.canUserAccessTeam(locals.user.id, params.id);
		if (!canAccess) {
			return json({ success: false, error: 'Forbidden' }, { status: 403 });
		}

		const team = await TeamService.getTeamWithMembers(params.id);
		if (!team) {
			return json({ success: false, error: 'Team not found' }, { status: 404 });
		}

		return json({ success: true, data: team });
	} catch (error) {
		console.error('Error fetching team:', error);
		return json({ success: false, error: 'Failed to fetch team' }, { status: 500 });
	}
};

/**
 * PATCH /api/teams/[id]
 * Update a team (admin only)
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const isAdmin = await TeamService.canUserManageTeam(locals.user.id, params.id);
		if (!isAdmin) {
			return json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 });
		}

		const body = await request.json();

		if (body.parentId) {
			const isValidMove = await TeamService.validateTeamMove(params.id, body.parentId);
			if (!isValidMove) {
				return json({ success: false, error: 'Invalid parent team (circular reference)' }, { status: 400 });
			}
			
			// Also check if user can manage the NEW parent
			const canManageParent = await TeamService.canUserManageTeam(locals.user.id, body.parentId);
			if (!canManageParent) {
				return json({ success: false, error: 'Forbidden - Cannot move team to this parent' }, { status: 403 });
			}
		}

		const team = await TeamService.updateTeam(params.id, body);

		if (!team) {
			return json({ success: false, error: 'Team not found' }, { status: 404 });
		}

		return json({ success: true, data: team });
	} catch (error) {
		console.error('Error updating team:', error);
		return json({ success: false, error: 'Failed to update team' }, { status: 500 });
	}
};

/**
 * DELETE /api/teams/[id]
 * Delete a team (admin only)
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const isAdmin = await TeamService.canUserManageTeam(locals.user.id, params.id);
		if (!isAdmin) {
			return json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 });
		}

		await TeamService.deleteTeam(params.id);
		return json({ success: true, message: 'Team deleted successfully' });
	} catch (error) {
		console.error('Error deleting team:', error);
		return json({ success: false, error: 'Failed to delete team' }, { status: 500 });
	}
};
