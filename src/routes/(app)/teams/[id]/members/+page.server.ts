import { redirect, fail } from '@sveltejs/kit';
import { TeamService } from '$lib/server/services/team.service';

export async function load({ params, locals }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Validate that params.id is a valid UUID/ID format
	if (!params.id || params.id === 'new') {
		throw redirect(303, '/teams');
	}

	const team = await TeamService.getTeamWithMembers(params.id);

	if (!team) {
		throw redirect(303, '/teams');
	}

	const isAdmin = await TeamService.isUserTeamAdmin(params.id, locals.user.id);

	if (!isAdmin) {
		throw redirect(303, `/teams/${params.id}`);
	}

	return {
		team
	};
}

export const actions = {
	removeMember: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const isAdmin = await TeamService.isUserTeamAdmin(params.id, locals.user.id);
		if (!isAdmin) {
			return fail(403, { error: 'Only admins can remove members' });
		}

		const data = await request.formData();
		const userId = data.get('userId')?.toString();

		if (!userId) {
			return fail(400, { error: 'User ID is required' });
		}

		await TeamService.removeMemberFromTeam(params.id, userId);

		return { success: true, message: 'Member removed successfully' };
	},

	updateRole: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const isAdmin = await TeamService.isUserTeamAdmin(params.id, locals.user.id);
		if (!isAdmin) {
			return fail(403, { error: 'Only admins can update roles' });
		}

		const data = await request.formData();
		const userId = data.get('userId')?.toString();
		const role = data.get('role')?.toString() as 'member' | 'admin';

		if (!userId || !role) {
			return fail(400, { error: 'User ID and role are required' });
		}

		await TeamService.updateMemberRole(params.id, userId, role);

		return { success: true, message: 'Role updated successfully' };
	}
};
