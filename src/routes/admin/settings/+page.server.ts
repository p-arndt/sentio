import { db } from '$lib/server/db';
import { settings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';

export const load: PageServerLoad = async () => {
	// Get settings from database
	const showWeekendsResult = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'showWeekends'))
		.limit(1);

	let showWeekends = true; // Default value

	if (showWeekendsResult.length > 0) {
		showWeekends = showWeekendsResult[0].value === 'true';
	} else {
		// Create default setting
		await db.insert(settings).values({
			key: 'showWeekends',
			value: 'true'
		});
	}

	return {
		settings: {
			showWeekends
		}
	};
};

export const actions: Actions = {
	updateSettings: async ({ request }) => {
		const formData = await request.formData();
		const showWeekendsValue = formData.get('showWeekends');
		const showWeekends = showWeekendsValue === 'true';

		try {
			// Update or insert setting
			const existing = await db
				.select()
				.from(settings)
				.where(eq(settings.key, 'showWeekends'))
				.limit(1);

			if (existing.length > 0) {
				await db
					.update(settings)
					.set({
						value: showWeekends.toString(),
						updatedAt: new Date()
					})
					.where(eq(settings.key, 'showWeekends'));
			} else {
				await db.insert(settings).values({
					key: 'showWeekends',
					value: showWeekends.toString()
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Error updating settings:', error);
			return fail(500, { error: 'Failed to update settings' });
		}
	}
};
