import { db } from '$lib/server/db';
import { team, teamMember } from '$lib/server/db/schema';
import { eq, sql } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	// Get all teams with member count
	const teams = await db
		.select({
			id: team.id,
			name: team.name,
			description: team.description,
			createdBy: team.createdBy,
			createdAt: team.createdAt,
			updatedAt: team.updatedAt,
			memberCount: sql<number>`cast(count(${teamMember.id}) as int)`
		})
		.from(team)
		.leftJoin(teamMember, eq(team.id, teamMember.teamId))
		.groupBy(team.id);

	return {
		teams
	};
};

export const actions: Actions = {
	createTeam: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;

		if (!name) {
			return fail(400, { error: 'Team name is required' });
		}

		await db.insert(team).values({
			name,
			description: description || null,
			createdBy: locals.user.id
		});

		return { success: true };
	},

	updateTeam: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const teamId = formData.get('teamId') as string;
		const name = formData.get('name') as string;
		const description = formData.get('description') as string;

		if (!teamId || !name) {
			return fail(400, { error: 'Team ID and name are required' });
		}

		await db
			.update(team)
			.set({
				name,
				description: description || null,
				updatedAt: new Date()
			})
			.where(eq(team.id, teamId));

		return { success: true };
	},

	deleteTeam: async ({ request, locals }) => {
		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const formData = await request.formData();
		const teamId = formData.get('teamId') as string;

		if (!teamId) {
			return fail(400, { error: 'Team ID is required' });
		}

		await db.delete(team).where(eq(team.id, teamId));

		return { success: true };
	}
};
