import { db } from '$lib/server/db';
import { user, userPreferences } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { User, UserPreferences, UserProfileUpdate, UserSettings } from '$lib/types';
import { getDefaultSettings } from '$lib/settings/settings';

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
	 * Get user preferences with defaults applied from settings config
	 */
	static async getUserPreferences(userId: string): Promise<UserPreferences | null> {
		const result = await db
			.select()
			.from(userPreferences)
			.where(eq(userPreferences.userId, userId))
			.limit(1);

		if (!result[0]) return null;

		const pref = result[0] as UserPreferences;
		// Ensure settings object exists and has defaults
		if (!pref.settings || typeof pref.settings !== 'object') {
			pref.settings = {};
		}

		const defaults = getDefaultSettings();
		pref.settings = {
			...defaults,
			...pref.settings // Preserve any existing user settings
		};
		if (!pref.settings.teamSharingOverrides) {
			pref.settings.teamSharingOverrides = {};
		}
		return pref;
	}

	/**
	 * Create or update user preferences, merging new settings with existing ones.
	 * Uses default settings for any missing values.
	 * This allows partial updates without losing other settings.
	 */
	static async upsertUserPreferences(
		userId: string,
		newSettings: Partial<UserSettings>
	): Promise<UserPreferences> {
		const existing = await this.getUserPreferences(userId);
		const defaults = getDefaultSettings();

		// Merge new settings with existing ones
		const mergedSettings = {
			...defaults,
			...(existing?.settings || {}),
			...newSettings
		};

		if (existing) {
			const result = await db
				.update(userPreferences)
				.set({
					settings: mergedSettings,
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
					settings: mergedSettings
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
