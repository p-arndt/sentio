import { db } from '$lib/server/db';
import { emotion } from '$lib/server/db/schema';
import { eq, isNull, desc } from 'drizzle-orm';
import type { Emotion, EmotionCreateInput, EmotionUpdateInput } from '$lib/types';

export class EmotionService {
	/**
	 * Get emotion by ID
	 */
	static async getEmotionById(emotionId: string): Promise<Emotion | null> {
		const result = await db.select().from(emotion).where(eq(emotion.id, emotionId)).limit(1);
		if (!result[0]) return null;
		return result[0] as Emotion;
	}

	/**
	 * Get all global emotions (not team-specific)
	 */
	static async getGlobalEmotions(): Promise<Emotion[]> {
		return (await db
			.select()
			.from(emotion)
			.where(isNull(emotion.teamId))
			.orderBy(emotion.order)) as Emotion[];
	}

	/**
	 * Get emotions for a team (team-specific + global)
	 */
	static async getTeamEmotions(teamId: string): Promise<Emotion[]> {
		const teamSpecific = await db
			.select()
			.from(emotion)
			.where(eq(emotion.teamId, teamId))
			.orderBy(emotion.order);

		const global = await this.getGlobalEmotions();

		return [...teamSpecific, ...global] as Emotion[];
	}

	/**
	 * Create emotion
	 */
	static async createEmotion(data: EmotionCreateInput): Promise<Emotion> {
		const result = await db
			.insert(emotion)
			.values({
				teamId: data.teamId || null,
				name: data.name,
				emoji: data.emoji,
				color: data.color,
				valence: data.valence ?? 0,
				description: data.description || null,
				order: data.order || '0'
			})
			.returning();

		return result[0] as Emotion;
	}

	/**
	 * Update emotion
	 */
	static async updateEmotion(emotionId: string, data: EmotionUpdateInput): Promise<Emotion | null> {
		const result = await db
			.update(emotion)
			.set({
				...data,
				updatedAt: new Date()
			})
			.where(eq(emotion.id, emotionId))
			.returning();

		if (!result[0]) return null;
		return result[0] as Emotion;
	}

	/**
	 * Delete emotion
	 */
	static async deleteEmotion(emotionId: string): Promise<boolean> {
		await db.delete(emotion).where(eq(emotion.id, emotionId));
		return true;
	}

	/**
	 * Get all emotions (admin only)
	 */
	static async getAllEmotions(): Promise<Emotion[]> {
		return (await db.select().from(emotion).orderBy(emotion.order, desc(emotion.createdAt))) as Emotion[];
	}

	/**
	 * Initialize default emotions if none exist
	 */
	static async initializeDefaultEmotions(): Promise<void> {
		const existing = await db.select().from(emotion).limit(1);
		if (existing.length > 0) return;

		const defaultEmotions = [
			{ name: 'Very Happy', emoji: '😄', color: '#10b981', valence: 5, order: '1' },
			{ name: 'Happy', emoji: '🙂', color: '#84cc16', valence: 4, order: '2' },
			{ name: 'Neutral', emoji: '😐', color: '#eab308', valence: 0, order: '3' },
			{ name: 'Sad', emoji: '🙁', color: '#f97316', valence: -3, order: '4' },
			{ name: 'Very Sad', emoji: '😢', color: '#ef4444', valence: -5, order: '5' }
		];

		for (const emotionData of defaultEmotions) {
			await db.insert(emotion).values({
				teamId: null,
				...emotionData
			});
		}
	}
}
