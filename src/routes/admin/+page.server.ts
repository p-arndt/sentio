import { db } from '$lib/server/db';
import { team, teamMember, calendarEntry, emotion } from '$lib/server/db/schema';
import { eq, gte, desc, isNotNull, and, count, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Get stats
	const teams = await db.select().from(team);
	const members = await db.select().from(teamMember);

	// Get mood entries from this month (only team entries, exclude personal and private)
	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	const moodEntries = await db
		.select()
		.from(calendarEntry)
		.where(and(
			gte(calendarEntry.date, startOfMonth),
			isNotNull(calendarEntry.teamId),
			eq(calendarEntry.isPrivate, false)
		));

	// Get team activity stats
	const teamActivity = await db
		.select({
			teamId: team.id,
			teamName: team.name,
			memberCount: count(teamMember.id),
		})
		.from(team)
		.leftJoin(teamMember, eq(team.id, teamMember.teamId))
		.groupBy(team.id, team.name)
		.orderBy(desc(count(teamMember.id)));

	// Get teams with their recent entry count (last 7 days)
	const sevenDaysAgo = new Date();
	sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

	const teamEntryStats = await db
		.select({
			teamId: team.id,
			teamName: team.name,
			entryCount: count(calendarEntry.id),
		})
		.from(team)
		.leftJoin(calendarEntry, and(
			eq(team.id, calendarEntry.teamId),
			gte(calendarEntry.date, sevenDaysAgo),
			eq(calendarEntry.isPrivate, false)
		))
		.groupBy(team.id, team.name)
		.orderBy(desc(count(calendarEntry.id)));

	// Get global emotions count
	const emotions = await db
		.select()
		.from(emotion)
		.where(eq(emotion.teamId, sql`NULL`));

	return {
		stats: {
			totalTeams: teams.length,
			totalMembers: members.length,
			totalMoodEntries: moodEntries.length,
			globalEmotions: emotions.length
		},
		teamActivity,
		teamEntryStats
	};
};
