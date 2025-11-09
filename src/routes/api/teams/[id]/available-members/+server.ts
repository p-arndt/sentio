import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { TeamService } from '$lib/server/services/team.service';
import { UserService } from '$lib/server/services/user.service';
import { db } from '$lib/server/db';
import { teamMember } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/teams/[id]/available-members
 * Get all users who are not already members of this team
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

		// Get all users
		const allUsers = await UserService.getAllUsers();

		// Get current team members
		const currentMembers = await db
			.select({ userId: teamMember.userId })
			.from(teamMember)
			.where(eq(teamMember.teamId, params.id));

		const currentMemberIds = new Set(currentMembers.map((m) => m.userId));

		// Filter out current members
		const availableUsers = allUsers
			.filter((user) => !currentMemberIds.has(user.id))
			.map((user) => ({
				id: user.id,
				name: user.name,
				email: user.email
			}));

		return json({ success: true, data: availableUsers });
	} catch (error) {
		console.error('Error fetching available members:', error);
		return json({ success: false, error: 'Failed to fetch available members' }, { status: 500 });
	}
};
