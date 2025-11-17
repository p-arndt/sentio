import { db } from '$lib/server/db';
import { calendarEntry, emotion, user } from '$lib/server/db/schema';
import { FunnyNameService } from '$lib/server/services/funny-name.service';
import type {
	MoodEntry,
	MoodEntryCreate,
	MoodEntryUpdate,
	MoodEntryWithDetails,
	TeamMemberWithUser
} from '$lib/types';
import { and, desc, eq, gte, isNull, lte, type SQLWrapper } from 'drizzle-orm';

export class MoodEntryService {
	static anonymizeEntriesForViewer(
		entries: MoodEntryWithDetails[],
		viewerId: string,
		options?: {
			teamId?: string;
			aliasState?: {
				map: Map<string, { aliasId: string; aliasName: string }>;
				nextIndex: number;
			};
		}
	): {
		entries: MoodEntryWithDetails[];
		anonymousMembers: TeamMemberWithUser[];
		aliasState: {
			map: Map<string, { aliasId: string; aliasName: string }>;
			nextIndex: number;
		};
	} {
		const aliasMap =
			options?.aliasState?.map ?? new Map<string, { aliasId: string; aliasName: string }>();
		let nextIndex = options?.aliasState?.nextIndex ?? 1;

		const sanitizedEntries = entries.map((entry) => {
			if (!entry.isAnonymous || entry.userId === viewerId) {
				return entry;
			}

			if (!aliasMap.has(entry.userId)) {
				const aliasName = FunnyNameService.generate({ capitalized: true, seed: entry.userId });
				const aliasId = `anon-${nextIndex}`;
				aliasMap.set(entry.userId, { aliasId, aliasName });
				nextIndex += 1;
			}

			const alias = aliasMap.get(entry.userId)!;
			return {
				...entry,
				userId: alias.aliasId,
				user: {
					...entry.user,
					id: alias.aliasId,
					name: alias.aliasName,
					email: '',
					emailVerified: false,
					image: null,
					timezone: 'UTC',
					isAdmin: false,
					personalMode: false,
					createdAt: entry.user.createdAt,
					updatedAt: entry.user.updatedAt
				}
			};
		});

		let anonymousMembers: TeamMemberWithUser[] = [];

		if (options?.teamId) {
			anonymousMembers = Array.from(aliasMap.values()).map(({ aliasId, aliasName }) => ({
				id: `${aliasId}-member`,
				teamId: options.teamId!,
				userId: aliasId,
				role: 'member',
				joinedAt: new Date(0),
				createdAt: new Date(0),
				updatedAt: new Date(0),
				user: {
					id: aliasId,
					name: aliasName,
					email: '',
					emailVerified: false,
					image: null,
					timezone: 'UTC',
					isAdmin: false,
					personalMode: false,
					createdAt: new Date(0),
					updatedAt: new Date(0)
				}
			}));
		}

		return {
			entries: sanitizedEntries,
			anonymousMembers,
			aliasState: { map: aliasMap, nextIndex }
		};
	}

	/**
	 * Get mood entry by ID
	 */
	static async getMoodEntryById(entryId: string): Promise<MoodEntry | null> {
		const result = await db
			.select()
			.from(calendarEntry)
			.where(eq(calendarEntry.id, entryId))
			.limit(1);

		if (!result[0]) return null;
		return result[0] as MoodEntry;
	}

	/**
	 * Get mood entry with full details (emotion and user info)
	 */
	static async getMoodEntryWithDetails(entryId: string): Promise<MoodEntryWithDetails | null> {
		const conditions = [eq(calendarEntry.id, entryId)];
		const results = (await this.baseMoodEntriesQuery(conditions, true)) as MoodEntryWithDetails[];
		return results[0] ?? null;
	}

	static async getTeamMoodEntries(
		teamId: string,
		startDate?: Date,
		endDate?: Date,
		includePrivate = false
	): Promise<MoodEntryWithDetails[]> {
		const conditions = [eq(calendarEntry.teamId, teamId)];

		if (startDate) conditions.push(gte(calendarEntry.date, startDate));
		if (endDate) conditions.push(lte(calendarEntry.date, endDate));
		if (!includePrivate) conditions.push(eq(calendarEntry.isPrivate, false));

		return (await this.baseMoodEntriesQuery(conditions)) as MoodEntryWithDetails[];
	}

	static async getPersonalMoodEntries(
		userId: string,
		startDate?: Date,
		endDate?: Date
	): Promise<MoodEntryWithDetails[]> {
		const conditions = [eq(calendarEntry.userId, userId), isNull(calendarEntry.teamId)];

		if (startDate) conditions.push(gte(calendarEntry.date, startDate));
		if (endDate) conditions.push(lte(calendarEntry.date, endDate));

		return (await this.baseMoodEntriesQuery(conditions)) as MoodEntryWithDetails[];
	}

	/**
	 * Get the latest (most recent) team mood entry for a team
	 */
	static async getLatestTeamEntry(teamId: string): Promise<Pick<MoodEntry, 'id' | 'date'> | null> {
		const result = await db
			.select({ id: calendarEntry.id, date: calendarEntry.date })
			.from(calendarEntry)
			.where(eq(calendarEntry.teamId, teamId))
			.orderBy(desc(calendarEntry.date))
			.limit(1);

		return result[0] ?? null;
	}

	/**
	 * Create mood entry
	 */
	static async createMoodEntry(data: MoodEntryCreate): Promise<MoodEntry> {
		// Personal entries (no teamId) are always private
		const isPersonalEntry = !data.teamId;

		const result = await db
			.insert(calendarEntry)
			.values({
				userId: data.userId,
				teamId: data.teamId || null,
				emotionId: data.emotionId,
				date: data.date,
				timeOfDay: data.timeOfDay || null,
				comment: data.comment || null,
				isPrivate: isPersonalEntry ? true : data.isPrivate || false,
				isAnonymous: data.isAnonymous || false
			})
			.returning();

		return result[0] as MoodEntry;
	}

	/**
	 * Update mood entry
	 */
	static async updateMoodEntry(entryId: string, data: MoodEntryUpdate): Promise<MoodEntry | null> {
		// Get the existing entry to check if it's a personal entry
		const existingEntry = await MoodEntryService.getMoodEntryById(entryId);
		if (!existingEntry) return null;

		// Personal entries (no teamId) are always private
		const isPersonalEntry = !existingEntry.teamId;

		const result = await db
			.update(calendarEntry)
			.set({
				...data,
				// Force isPrivate to true for personal entries
				...(isPersonalEntry && { isPrivate: true, isAnonymous: false }),
				updatedAt: new Date()
			})
			.where(eq(calendarEntry.id, entryId))
			.returning();

		if (!result[0]) return null;
		return result[0] as MoodEntry;
	}

	/**
	 * Delete mood entry
	 */
	static async deleteMoodEntry(entryId: string): Promise<boolean> {
		await db.delete(calendarEntry).where(eq(calendarEntry.id, entryId));
		return true;
	}

	/**
	 * Check if user owns mood entry
	 */
	static async isOwner(entryId: string, userId: string): Promise<boolean> {
		const result = await db
			.select()
			.from(calendarEntry)
			.where(and(eq(calendarEntry.id, entryId), eq(calendarEntry.userId, userId)))
			.limit(1);

		return result.length > 0;
	}

	/**
	 * Get mood entries for a specific date
	 */
	static async getMoodEntriesForDate(
		userId: string,
		date: Date,
		teamId?: string
	): Promise<MoodEntry[]> {
		const startOfDay = new Date(date);
		startOfDay.setHours(0, 0, 0, 0);

		const endOfDay = new Date(date);
		endOfDay.setHours(23, 59, 59, 999);

		const conditions = [
			eq(calendarEntry.userId, userId),
			gte(calendarEntry.date, startOfDay),
			lte(calendarEntry.date, endOfDay)
		];

		if (teamId) {
			conditions.push(eq(calendarEntry.teamId, teamId));
		} else {
			conditions.push(isNull(calendarEntry.teamId));
		}

		return (await db
			.select()
			.from(calendarEntry)
			.where(and(...conditions))
			.orderBy(calendarEntry.createdAt)) as MoodEntry[];
	}

	static baseMoodEntriesQuery(conditions: (SQLWrapper | undefined)[], single: boolean = false) {
		const query = db
			.select({
				id: calendarEntry.id,
				userId: calendarEntry.userId,
				teamId: calendarEntry.teamId,
				emotionId: calendarEntry.emotionId,
				date: calendarEntry.date,
				timeOfDay: calendarEntry.timeOfDay,
				comment: calendarEntry.comment,
				isPrivate: calendarEntry.isPrivate,
				isAnonymous: calendarEntry.isAnonymous,
				createdAt: calendarEntry.createdAt,
				updatedAt: calendarEntry.updatedAt,
				emotion: {
					id: emotion.id,
					teamId: emotion.teamId,
					name: emotion.name,
					emoji: emotion.emoji,
					color: emotion.color,
					order: emotion.order,
					createdAt: emotion.createdAt,
					updatedAt: emotion.updatedAt,
					valence: emotion.valence
				},
				user: {
					id: user.id,
					name: user.name,
					email: user.email,
					emailVerified: user.emailVerified,
					image: user.image,
					timezone: user.timezone,
					isAdmin: user.isAdmin,
					personalMode: user.personalMode,
					createdAt: user.createdAt,
					updatedAt: user.updatedAt
				}
			})
			.from(calendarEntry)
			.innerJoin(emotion, eq(calendarEntry.emotionId, emotion.id))
			.innerJoin(user, eq(calendarEntry.userId, user.id))
			.where(and(...conditions))
			.orderBy(desc(calendarEntry.date));

		if (single) {
			return query.limit(1);
		}
		return query;
	}
}
