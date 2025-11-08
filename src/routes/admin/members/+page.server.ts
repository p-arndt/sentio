import { db } from '$lib/server/db';
import { team, teamMember, user } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Get all teams with their members
	const allTeams = await db.select().from(team);

	const teamsWithMembers = await Promise.all(
		allTeams.map(async (t) => {
			const members = await db
				.select({
					id: teamMember.id,
					userId: teamMember.userId,
					userName: user.name,
					userEmail: user.email,
					role: teamMember.role,
					joinedAt: teamMember.joinedAt
				})
				.from(teamMember)
				.innerJoin(user, eq(teamMember.userId, user.id))
				.where(eq(teamMember.teamId, t.id));

			return {
				...t,
				members
			};
		})
	);

	// Get all users for the add member dialog
	const allUsers = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email
		})
		.from(user);

	return {
		teams: teamsWithMembers,
		allTeams,
		allUsers
	};
};

export const actions: Actions = {
	addMember: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const teamId = formData.get('teamId') as string;
		const userId = formData.get('userId') as string;
		const role = formData.get('role') as string;

		if (!teamId || !userId) {
			return fail(400, { error: 'Team and user are required' });
		}

		// Check if already a member
		const existing = await db
			.select()
			.from(teamMember)
			.where(and(eq(teamMember.teamId, teamId), eq(teamMember.userId, userId)))
			.limit(1);

		if (existing.length > 0) {
			return fail(400, { error: 'User is already a member of this team' });
		}

		await db.insert(teamMember).values({
			teamId,
			userId,
			role: role || 'member'
		});

		return { success: true };
	},

	removeMember: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const memberId = formData.get('memberId') as string;

		if (!memberId) {
			return fail(400, { error: 'Member ID is required' });
		}

		await db.delete(teamMember).where(eq(teamMember.id, memberId));

		return { success: true };
	}
};
