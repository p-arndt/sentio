import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { moodReminder } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { MoodReminderCreate } from '$lib/types';
import { scheduleReminder } from '$lib/server/reminder-scheduler';

/**
 * GET /api/reminders
 * Get all reminders for the current user
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const reminders = await db
			.select()
			.from(moodReminder)
			.where(eq(moodReminder.userId, locals.user.id))
			.orderBy(moodReminder.time);

		return json({
			success: true,
			data: reminders
		});
	} catch (error) {
		console.error('Error fetching reminders:', error);
		return json({ error: 'Failed to fetch reminders' }, { status: 500 });
	}
};

/**
 * POST /api/reminders
 * Create a new reminder and schedule it with PgBoss
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = (await request.json()) as MoodReminderCreate;

		if (!data.time) {
			return json({ error: 'Missing required field: time' }, { status: 400 });
		}

		// Validate time format (HH:MM)
		if (!/^\d{2}:\d{2}$/.test(data.time)) {
			return json({ error: 'Invalid time format. Use HH:MM' }, { status: 400 });
		}


		// Provide defaults for optional fields
		const title = data.title ?? 'Mood Reminder';
		const message = data.message && data.message.trim().length > 0 ? data.message : 'How are you feeling today?';

		console.log(`[API] Creating reminder: received_time=${data.time}`);

		const newReminder = await db
			.insert(moodReminder)
			.values({
				userId: locals.user.id,
				title,
				message,
				time: data.time, // Expect UTC time (client converts to UTC before sending)
				daysOfWeek: data.daysOfWeek || '0,1,2,3,4,5,6'
			})
			.returning();

		const reminder = newReminder[0];

		// Schedule with PgBoss if reminder is active
		if (reminder.isActive) {
			try {
				await scheduleReminder({
					id: reminder.id,
					time: reminder.time,
					daysOfWeek: reminder.daysOfWeek
				});
			} catch (scheduleError) {
				console.error('Warning: Failed to schedule reminder with PgBoss:', scheduleError);
				// Continue anyway - reminder is created, scheduling failed
			}
		}

		return json(
			{
				success: true,
				message: 'Reminder created successfully',
				data: reminder
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Error creating reminder:', error);
		return json({ error: 'Failed to create reminder' }, { status: 500 });
	}
};
