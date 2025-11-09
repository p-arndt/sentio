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

	// Get admin users
	const adminUsers = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email
		})
		.from(user)
		.where(eq(user.isAdmin, true));

	// Get non-admin users
	const nonAdminUsers = await db
		.select({
			id: user.id,
			name: user.name,
			email: user.email
		})
		.from(user)
		.where(eq(user.isAdmin, false));

	return {
		teams: teamsWithMembers,
		allTeams,
		allUsers,
		adminUsers,
		nonAdminUsers
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
	},

	makeAdmin: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) {
			return fail(400, { error: 'User ID is required' });
		}

		try {
			await db.update(user).set({ isAdmin: true }).where(eq(user.id, userId));
			return { success: true };
		} catch {
			return fail(400, { error: 'Failed to make user admin' });
		}
	},

	removeAdmin: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) {
			return fail(400, { error: 'User ID is required' });
		}

		// Prevent removing the last admin
		const admins = await db.select().from(user).where(eq(user.isAdmin, true));
		if (admins.length <= 1) {
			return fail(400, { error: 'Cannot remove the last admin' });
		}

		try {
			await db.update(user).set({ isAdmin: false }).where(eq(user.id, userId));
			return { success: true };
		} catch {
			return fail(400, { error: 'Failed to remove admin privileges' });
		}
	},

	deleteUser: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;

		if (!userId) {
			return fail(400, { error: 'User ID is required' });
		}

		// Prevent deleting the current user
		if (userId === locals.user.id) {
			return fail(400, { error: 'Cannot delete your own account' });
		}

		// Prevent deleting the last admin
		const targetUser = await db.select().from(user).where(eq(user.id, userId)).limit(1);
		if (targetUser.length > 0 && targetUser[0].isAdmin) {
			const admins = await db.select().from(user).where(eq(user.isAdmin, true));
			if (admins.length <= 1) {
				return fail(400, { error: 'Cannot delete the last admin' });
			}
		}

		try {
			// Delete user from all teams first
			await db.delete(teamMember).where(eq(teamMember.userId, userId));
			// Delete the user
			await db.delete(user).where(eq(user.id, userId));
			return { success: true };
		} catch (error) {
			console.error('Error deleting user:', error);
			return fail(400, { error: 'Failed to delete user' });
		}
	}
};
