import { db } from '$lib/server/db';
import { team, teamMember, calendarEntry, emotion, user } from '$lib/server/db/schema';
import { eq, gte, desc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Get stats
	const teams = await db.select().from(team);
	const members = await db.select().from(teamMember);

	// Get mood entries from this month
	const startOfMonth = new Date();
	startOfMonth.setDate(1);
	startOfMonth.setHours(0, 0, 0, 0);

	const moodEntries = await db
		.select()
		.from(calendarEntry)
		.where(gte(calendarEntry.date, startOfMonth));

	// Get recent entries with user and emotion info
	const recentEntries = await db
		.select({
			id: calendarEntry.id,
			date: calendarEntry.date,
			comment: calendarEntry.comment,
			user: {
				id: user.id,
				name: user.name,
				email: user.email
			},
			emotion: {
				id: emotion.id,
				name: emotion.name,
				emoji: emotion.emoji,
				color: emotion.color
			}
		})
		.from(calendarEntry)
		.innerJoin(user, eq(calendarEntry.userId, user.id))
		.innerJoin(emotion, eq(calendarEntry.emotionId, emotion.id))
		.orderBy(desc(calendarEntry.createdAt))
		.limit(10);

	return {
		stats: {
			totalTeams: teams.length,
			totalMembers: members.length,
			totalMoodEntries: moodEntries.length
		},
		recentEntries
	};
};
