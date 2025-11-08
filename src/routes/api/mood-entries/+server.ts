import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { calendarEntry } from '$lib/server/db/schema';
import { eq, and, gte, lte } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { emotionId, date, comment } = await request.json();

		if (!emotionId || !date) {
			return json({ error: 'Emotion and date are required' }, { status: 400 });
		}

		// Normalize date to start of day in UTC
		const entryDate = new Date(date);
		entryDate.setUTCHours(0, 0, 0, 0);

		console.log('Saving mood entry:', { userId: locals.user.id, emotionId, date: entryDate });

		// Check if entry already exists for this user and date
		const existing = await db
			.select()
			.from(calendarEntry)
			.where(eq(calendarEntry.userId, locals.user.id));

		// Find matching entry by date (compare date strings)
		const matchingEntry = existing.find((e) => {
			const existingDate = new Date(e.date);
			existingDate.setUTCHours(0, 0, 0, 0);
			return existingDate.getTime() === entryDate.getTime();
		});

		let result;

		if (matchingEntry) {
			// Update existing entry
			console.log('Updating existing entry:', matchingEntry.id);
			result = await db
				.update(calendarEntry)
				.set({
					emotionId,
					comment: comment || null,
					updatedAt: new Date()
				})
				.where(eq(calendarEntry.id, matchingEntry.id))
				.returning();
		} else {
			// Create new entry
			console.log('Creating new entry');
			result = await db
				.insert(calendarEntry)
				.values({
					userId: locals.user.id,
					emotionId,
					date: entryDate,
					comment: comment || null
				})
				.returning();
		}

		console.log('Save successful:', result[0]);
		return json({ success: true, entry: result[0] });
	} catch (error) {
		console.error('Error saving mood entry:', error);
		return json({ error: 'Failed to save mood entry' }, { status: 500 });
	}
};

export const GET: RequestHandler = async ({ url, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const startDate = url.searchParams.get('startDate');
	const endDate = url.searchParams.get('endDate');

	const conditions = [eq(calendarEntry.userId, locals.user.id)];

	if (startDate) {
		conditions.push(gte(calendarEntry.date, new Date(startDate)));
	}

	if (endDate) {
		conditions.push(lte(calendarEntry.date, new Date(endDate)));
	}

	const entries = await db
		.select()
		.from(calendarEntry)
		.where(and(...conditions));

	return json({ entries });
};
