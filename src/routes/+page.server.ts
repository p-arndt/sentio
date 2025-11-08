import { db } from '$lib/server/db';
import { emotion, calendarEntry, user, team, teamMember, settings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Get all emotions from database
	const emotions = await db.select().from(emotion);

	// Get settings
	const showWeekendsResult = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'showWeekends'))
		.limit(1);

	const showWeekends = showWeekendsResult.length > 0 
		? showWeekendsResult[0].value === 'true' 
		: true;

	// Get user's teams and team members
	let teams: Array<{ teamId: string; teamName: string }> = [];
	const members: Array<{ id: string; name: string; email: string }> = [];
	const entries: Array<typeof calendarEntry.$inferSelect> = [];

	if (locals.user) {
		// Get teams where user is a member
		const userTeams = await db
			.select({
				teamId: teamMember.teamId,
				teamName: team.name
			})
			.from(teamMember)
			.innerJoin(team, eq(teamMember.teamId, team.id))
			.where(eq(teamMember.userId, locals.user.id));

		teams = userTeams;

		// Get all members from user's teams
		if (userTeams.length > 0) {
			const teamIds = userTeams.map((t) => t.teamId);

			// Get all team members
			for (const teamId of teamIds) {
				const teamMembers = await db
					.select({
						id: user.id,
						name: user.name,
						email: user.email
					})
					.from(teamMember)
					.innerJoin(user, eq(teamMember.userId, user.id))
					.where(eq(teamMember.teamId, teamId));

				members.push(...teamMembers);
			}

			// Get calendar entries for all team members
			const memberIds = [...new Set(members.map((m) => m.id))];
			for (const memberId of memberIds) {
				const userEntries = await db
					.select()
					.from(calendarEntry)
					.where(eq(calendarEntry.userId, memberId));

				entries.push(...userEntries);
			}
		}
	}

	return {
		emotions,
		teams,
		members: [...new Map(members.map((m) => [m.id, m])).values()], // Remove duplicates
		entries,
		showWeekends,
		currentUserId: locals.user?.id
	};
};
