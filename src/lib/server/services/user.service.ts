import { db } from '$lib/server/db';
import { user, userPreferences } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { User, UserPreferences, UserProfileUpdate } from '$lib/types';

export class UserService {
	/**
	 * Get user by ID
	 */
	static async getUserById(userId: string): Promise<User | null> {
		const result = await db.select().from(user).where(eq(user.id, userId)).limit(1);
		return result[0] || null;
	}

	/**
	 * Get user by email
	 */
	static async getUserByEmail(email: string): Promise<User | null> {
		const result = await db.select().from(user).where(eq(user.email, email)).limit(1);
		return result[0] || null;
	}

	/**
	 * Update user profile
	 */
	static async updateUserProfile(
		userId: string,
		data: UserProfileUpdate
	): Promise<User | null> {
		const result = await db
			.update(user)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(eq(user.id, userId))
			.returning();

		return result[0] || null;
	}

	/**
	 * Toggle personal mode for user
	 */
	static async togglePersonalMode(userId: string, enabled: boolean): Promise<User | null> {
		const result = await db
			.update(user)
			.set({
				personalMode: enabled,
				updatedAt: new Date()
			})
			.where(eq(user.id, userId))
			.returning();

		return result[0] || null;
	}

	/**
	 * Get user preferences
	 */
	static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
		const result = await db
			.select()
			.from(userPreferences)
			.where(eq(userPreferences.userId, userId))
			.limit(1);

		return (result[0] as UserPreferences) || null;
	}

	/**
	 * Create or update user preferences
	 */
	static async upsertUserPreferences(
		userId: string,
		data: Partial<Omit<UserPreferences, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>
	): Promise<UserPreferences> {
		const existing = await this.getUserPreferences(userId);

		if (existing) {
			const result = await db
				.update(userPreferences)
				.set({
					...data,
					updatedAt: new Date()
				})
				.where(eq(userPreferences.userId, userId))
				.returning();

			return result[0] as UserPreferences;
		} else {
			const result = await db
				.insert(userPreferences)
				.values({
					userId,
					...data
				})
				.returning();

			return result[0] as UserPreferences;
		}
	}

	/**
	 * Check if user is admin
	 */
	static async isUserAdmin(userId: string): Promise<boolean> {
		const result = await db.select().from(user).where(eq(user.id, userId)).limit(1);
		return result[0]?.isAdmin || false;
	}

	/**
	 * Get all users (admin only)
	 */
	static async getAllUsers(): Promise<User[]> {
		return await db.select().from(user);
	}
}
