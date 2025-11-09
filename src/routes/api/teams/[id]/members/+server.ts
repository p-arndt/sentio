import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TeamService } from '$lib/server/services/team.service';

/**
 * GET /api/teams/[id]/members
 * Get all members of a team
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const isMember = await TeamService.isUserMember(params.id, locals.user.id);
		if (!isMember) {
			return json({ success: false, error: 'Forbidden' }, { status: 403 });
		}

		const members = await TeamService.getTeamMembers(params.id);
		return json({ success: true, data: members });
	} catch (error) {
		console.error('Error fetching team members:', error);
		return json({ success: false, error: 'Failed to fetch team members' }, { status: 500 });
	}
};

/**
 * POST /api/teams/[id]/members
 * Add a member to the team (admin only)
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const isAdmin = await TeamService.isUserTeamAdmin(params.id, locals.user.id);
		if (!isAdmin) {
			return json({ success: false, error: 'Forbidden - Admin access required' }, { status: 403 });
		}

		const { userId, role } = await request.json();
		if (!userId) {
			return json({ success: false, error: 'userId is required' }, { status: 400 });
		}

		const member = await TeamService.addMemberToTeam(params.id, userId, role || 'member');
		return json({ success: true, data: member }, { status: 201 });
	} catch (error) {
		console.error('Error adding team member:', error);
		return json({ success: false, error: 'Failed to add team member' }, { status: 500 });
	}
};
