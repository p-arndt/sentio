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

	const isAdmin = await TeamService.canUserManageTeam(locals.user.id, params.id);

	if (!isAdmin) {
		throw redirect(303, `/teams/${params.id}`);
	}

	const teamTrees = await TeamService.getUserTeamTrees(locals.user.id);

	return {
		team,
		teamTrees
	};
}

export const actions = {
	updateSettings: async ({ request, params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const isAdmin = await TeamService.canUserManageTeam(locals.user.id, params.id);
		if (!isAdmin) {
			return fail(403, { error: 'Only admins can update settings' });
		}

		const data = await request.formData();
		const name = data.get('name')?.toString();
		const description = data.get('description')?.toString();
		const visibilityValue = data.get('visibility')?.toString();
		const visibility = visibilityValue === 'members_only' ? 'team' : (visibilityValue as 'public' | 'private' | 'team');
		const allowMultipleMoodsPerDay = data.get('allowMultipleMoodsPerDay') === 'true';
		const requireComment = data.get('requireComment') === 'true';
		const showWeekends = data.get('showWeekends') === 'true';
		const parentId = data.get('parentId')?.toString() || null;
		const isContainer = data.get('isContainer') === 'true';

		if (!name) {
			return fail(400, { error: 'Team name is required' });
		}

		if (parentId) {
			const isValidMove = await TeamService.validateTeamMove(params.id, parentId);
			if (!isValidMove) {
				return fail(400, { error: 'Invalid parent team (circular reference detected)' });
			}
		}

		await TeamService.updateTeam(params.id, {
			name,
			description: description || undefined,
			visibility,
			allowMultipleMoodsPerDay,
			requireComment,
			showWeekends,
			parentId,
			isContainer
		});

		return { success: true, message: 'Settings updated successfully' };
	},

	deleteTeam: async ({ params, locals }) => {
		if (!locals.user) {
			return fail(401, { error: 'Unauthorized' });
		}

		const isAdmin = await TeamService.canUserManageTeam(locals.user.id, params.id);
		if (!isAdmin) {
			return fail(403, { error: 'Only admins can delete teams' });
		}

		await TeamService.deleteTeam(params.id);

		throw redirect(303, '/teams');
	}
};
