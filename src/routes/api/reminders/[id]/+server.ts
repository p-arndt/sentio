import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { moodReminder } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { MoodReminderUpdate } from '$lib/types';
import { scheduleReminder, unscheduleReminder } from '$lib/server/reminder-scheduler';
import { localToUTC } from '$lib/utils/timezone';

/**
 * GET /api/reminders/[id]
 * Get a specific reminder
 */
export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const reminder = await db
			.select()
			.from(moodReminder)
			.where(and(eq(moodReminder.id, params.id!), eq(moodReminder.userId, locals.user.id)));

		if (reminder.length === 0) {
			return json({ error: 'Reminder not found' }, { status: 404 });
		}

		return json({
			success: true,
			data: reminder[0]
		});
	} catch (error) {
		console.error('Error fetching reminder:', error);
		return json({ error: 'Failed to fetch reminder' }, { status: 500 });
	}
};

/**
 * PATCH /api/reminders/[id]
 * Update a reminder and reschedule with PgBoss if needed
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const reminderId = params.id!;
		const updates = (await request.json()) as MoodReminderUpdate;

		// Validate time format if provided
		if (updates.time && !/^\d{2}:\d{2}$/.test(updates.time)) {
			return json({ error: 'Invalid time format. Use HH:MM' }, { status: 400 });
		}

		// Convert local time to UTC if provided
		const updateData = { ...updates };
		if (updates.time) {
			updateData.time = localToUTC(updates.time);
		}

		const updated = await db
			.update(moodReminder)
			.set({
				...updateData,
				updatedAt: new Date()
			})
			.where(and(eq(moodReminder.id, reminderId), eq(moodReminder.userId, locals.user.id)))
			.returning();

		if (updated.length === 0) {
			return json({ error: 'Reminder not found' }, { status: 404 });
		}

		const reminder = updated[0];

		// Handle scheduling changes
		if (updates.isActive === true) {
			// Schedule if being activated
			await scheduleReminder({
				id: reminder.id,
				time: reminder.time,
				daysOfWeek: reminder.daysOfWeek
			});
		} else if (updates.isActive === false) {
			// Unschedule if being deactivated
			await unscheduleReminder(reminder.id);
		} else if (updates.time || updates.daysOfWeek) {
			// Reschedule if time or days changed and reminder is active
			if (reminder.isActive) {
				await scheduleReminder({
					id: reminder.id,
					time: reminder.time,
					daysOfWeek: reminder.daysOfWeek
				});
			}
		}

		return json({
			success: true,
			message: 'Reminder updated successfully',
			data: reminder
		});
	} catch (error) {
		console.error('Error updating reminder:', error);
		return json({ error: 'Failed to update reminder' }, { status: 500 });
	}
};

/**
 * DELETE /api/reminders/[id]
 * Delete a reminder and remove its schedule from PgBoss
 */
export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const reminderId = params.id!;

		const deleted = await db
			.delete(moodReminder)
			.where(and(eq(moodReminder.id, reminderId), eq(moodReminder.userId, locals.user.id)))
			.returning();

		if (deleted.length === 0) {
			return json({ error: 'Reminder not found' }, { status: 404 });
		}

		// Remove from PgBoss schedule
		await unscheduleReminder(reminderId);

		return json({
			success: true,
			message: 'Reminder deleted successfully'
		});
	} catch (error) {
		console.error('Error deleting reminder:', error);
		return json({ error: 'Failed to delete reminder' }, { status: 500 });
	}
};
