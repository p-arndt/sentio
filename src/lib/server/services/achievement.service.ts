import { ACHIEVEMENT_DATA } from '$lib/data/achievement-data';
import { db } from '$lib/server/db';
import { achievement, calendarEntry, userAchievement } from '$lib/server/db/schema';
import { AchievementChecker } from '$lib/server/services/achievement-checker.service';
import type { Achievement, UserAchievement } from '$lib/types';
import { and, count, desc, eq } from 'drizzle-orm';

export class AchievementService {
	static async getBySlug(slug: string): Promise<Achievement | null> {
		const results = await db.select().from(achievement).where(eq(achievement.slug, slug)).limit(1);
		return results[0] ?? null;
	}

	// Backwards compatible alias for older code that used 'key'
	static async getByKey(key: string) {
		return this.getBySlug(key);
	}

	static async getAllAchievements(): Promise<Achievement[]> {
		const results = await db.select().from(achievement).orderBy(desc(achievement.createdAt));
		return results;
	}

	private static selectUserAchievementDetails() {
		return db
			.select({
				id: userAchievement.id,
				userId: userAchievement.userId,
				achievementId: userAchievement.achievementId,
				earnedAt: userAchievement.earnedAt,
				achievement: {
					...achievement
				}
			})
			.from(userAchievement)
			.innerJoin(achievement, eq(userAchievement.achievementId, achievement.id));
	}

	static async getAchievementsForUser(userId: string): Promise<UserAchievement[]> {
		const results = await this.selectUserAchievementDetails()
			.where(eq(userAchievement.userId, userId))
			.orderBy(desc(userAchievement.earnedAt));

		return results;
	}

	static async userHasAchievement(userId: string, badgeId: string): Promise<boolean> {
		const [result] = await db
			.select({ total: count() })
			.from(userAchievement)
			.where(and(eq(userAchievement.userId, userId), eq(userAchievement.achievementId, badgeId)))
			.limit(1);
		return Number(result?.total ?? 0) > 0;
	}

	static async grantToUser(
		userId: string,
		achievementSlugOrId: string
	): Promise<UserAchievement | null> {
		// Accept either a badge slug (e.g. 'first-mood') or a UUID string.
		// If a badge slug is provided and not found, return null instead of using it as a uuid.
		const badgeObj = await this.getBySlug(achievementSlugOrId);
		let achievementId: string | null = null;
		if (badgeObj) {
			achievementId = badgeObj.id;
		}
		if (!achievementId) return null;

		// Check if user already has it
		if (await this.userHasAchievement(userId, achievementId)) return null;

		const result = await db.insert(userAchievement).values({ userId, achievementId }).returning();

		if (!result[0]) return null;

		// Fetch created user badge with badge details
		const userBadgeId = result[0].id;
		const list = await this.selectUserAchievementDetails()
			.where(eq(userAchievement.id, userBadgeId))
			.limit(1);

		return list[0];
	}

	static async createOrUpdate({
		slug,
		name,
		description,
		category,
		rule,
		requirement
	}: Omit<Achievement, 'id'>): Promise<Achievement> {
		const payload = {
			slug,
			name,
			description: description ?? null,
			category: category ?? 'activity',
			rule: rule ?? 'COUNT',
			requirement: requirement ?? null
		};

		const existing = await this.getBySlug(slug);
		if (existing) {
			const needsUpdate =
				existing.name !== payload.name ||
				existing.description !== payload.description ||
				existing.category !== payload.category ||
				existing.rule !== payload.rule ||
				existing.requirement !== payload.requirement;

			if (!needsUpdate) return existing;

			const [updated] = await db
				.update(achievement)
				.set({ ...payload, updatedAt: new Date() })
				.where(eq(achievement.id, existing.id))
				.returning();
			return updated;
		}

		const [created] = await db.insert(achievement).values(payload).returning();
		return created;
	}

	static async ensureDefaultBadges() {
		try {
			for (const definition of ACHIEVEMENT_DATA) {
				await this.createOrUpdate({
					slug: definition.slug,
					name: definition.name,
					description: definition.description ?? null,
					category: definition.category ?? null,
					rule: definition.rule ?? null,
					requirement: definition.requirement ?? null
				});
			}
		} catch (err) {
			console.error('Failed to ensure default badges:', err);
		}
	}

	static async checkAndGrantAchievementForNewEntry(userId: string): Promise<UserAchievement[]> {
		const granted: UserAchievement[] = [];

		// Count mood entries for the user

		// Count total entries for user
		const [result] = await db
			.select({ total: count() })
			.from(calendarEntry)
			.where(eq(calendarEntry.userId, userId));
		const total = Number(result?.total ?? 0);

		// Count anonymous entries
		const [anonResult] = await db
			.select({ total: count() })
			.from(calendarEntry)
			.where(and(eq(calendarEntry.userId, userId), eq(calendarEntry.isAnonymous, true)));
		const anonTotal = Number(anonResult?.total ?? 0);

		// Find all badges in DB and evaluate their rules
		const allBadges = await db.select().from(achievement).orderBy(desc(achievement.createdAt));
		for (const b of allBadges) {
			try {
				const matches = await AchievementChecker.matches(b as Achievement, userId, {
					total,
					anonTotal
				});
				if (matches) {
					const newlyGranted = await this.grantToUser(userId, b.slug);
					if (newlyGranted) granted.push(newlyGranted);
				}
			} catch (err) {
				// Individual badge checks should not abort the overall process
				console.error('Error evaluating badge', b.slug, err);
			}
		}

		return granted;
	}
}
