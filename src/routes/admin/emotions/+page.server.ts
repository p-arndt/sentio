import { db } from '$lib/server/db';
import { emotion } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async () => {
	const emotions = await db.select().from(emotion).orderBy(emotion.createdAt);

	return {
		emotions
	};
};

export const actions: Actions = {
	createEmotion: async ({ request }) => {
		const formData = await request.formData();
		const name = formData.get('name') as string;
		const emoji = formData.get('emoji') as string;
		const color = formData.get('color') as string;
		const valenceStr = formData.get('valence') as string;
		const description = formData.get('description') as string;

		if (!name || !emoji || !color) {
			return fail(400, { error: 'Name, emoji, and color are required' });
		}

		const valence = valenceStr ? parseInt(valenceStr, 10) : 0;

		try {
			await db.insert(emotion).values({
				name,
				emoji,
				color,
				valence,
				description: description || null
			});

			return { success: true };
		} catch (error) {
			console.error('Error creating emotion:', error);
			return fail(500, { error: 'Failed to create emotion' });
		}
	},

	updateEmotion: async ({ request }) => {
		const formData = await request.formData();
		const emotionId = formData.get('emotionId') as string;
		const name = formData.get('name') as string;
		const emoji = formData.get('emoji') as string;
		const color = formData.get('color') as string;
		const valenceStr = formData.get('valence') as string;
		const description = formData.get('description') as string;

		if (!emotionId || !name || !emoji || !color) {
			return fail(400, { error: 'All required fields must be provided' });
		}

		const valence = valenceStr ? parseInt(valenceStr, 10) : 0;

		try {
			await db
				.update(emotion)
				.set({
					name,
					emoji,
					color,
					valence,
					description: description || null,
					updatedAt: new Date()
				})
				.where(eq(emotion.id, emotionId));

			return { success: true };
		} catch (error) {
			console.error('Error updating emotion:', error);
			return fail(500, { error: 'Failed to update emotion' });
		}
	},

	deleteEmotion: async ({ request }) => {
		const formData = await request.formData();
		const emotionId = formData.get('emotionId') as string;

		if (!emotionId) {
			return fail(400, { error: 'Emotion ID is required' });
		}

		try {
			await db.delete(emotion).where(eq(emotion.id, emotionId));

			return { success: true };
		} catch (error) {
			console.error('Error deleting emotion:', error);
			return fail(500, { error: 'Failed to delete emotion' });
		}
	}
};
