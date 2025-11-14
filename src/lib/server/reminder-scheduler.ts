/**
 * Reminder scheduler using PgBoss
 * Handles scheduling reminders and sending notifications
 */

import { env } from '$env/dynamic/private';
import { and, eq } from 'drizzle-orm';
import webpush from 'web-push';
import { db } from './db';
import { moodReminder, pushSubscription } from './db/schema';
import { getPgBoss } from './pg-boss-service';

const QUEUE_NAME = 'mood-reminder';

/**
 * Convert reminder time and days to cron expression
 * Time should already be in UTC
 * Example: time="09:30", days="1,2,3,4,5" → "30 9 * * 1,2,3,4,5"
 */
function toCron(time: string, daysOfWeek: string): string {
	const [hour, minute] = time.split(':');
	return `${minute} ${hour} * * ${daysOfWeek}`;
}

/**
 * Initialize the reminder system
 * Sets up the worker to process reminder jobs
 */
export async function initializeReminderScheduler(): Promise<void> {
	const boss = await getPgBoss();

	// Create the queue first (required before registering worker)
	await boss.createQueue(QUEUE_NAME);

	// Register worker to process reminder jobs
	await boss.work(QUEUE_NAME, async (jobs) => {

		for (const job of jobs) {
			const { reminderId } = job.data as { reminderId: string };

			try {
				const [reminder] = await db
					.select()
					.from(moodReminder)
					.where(eq(moodReminder.id, reminderId));

				if (!reminder) {
					console.warn(`[Reminder] Not found: ${reminderId}`);
					continue;
				}

				console.log(`[Reminder] Found reminder:`, {
					id: reminder.id,
					title: reminder.title,
					isActive: reminder.isActive,
					time: reminder.time
				});

				if (!reminder.isActive) {
					continue;
				}

				await sendNotification(reminder);

				await db
					.update(moodReminder)
					.set({ lastTriggered: new Date() })
					.where(eq(moodReminder.id, reminderId));

			} catch (error) {
				console.error(`[Reminder] Error processing ${reminderId}:`, error);
				throw error;
			}
		}
	});

	// Reschedule all active reminders
	await rescheduleAll();
}

/**
 * Schedule a single reminder
 */
export async function scheduleReminder(reminder: {
	id: string;
	time: string;
	daysOfWeek: string;
}): Promise<void> {
	const boss = await getPgBoss();
	const cron = toCron(reminder.time, reminder.daysOfWeek);


	await boss.schedule(
		QUEUE_NAME,
		cron,
		{ reminderId: reminder.id },
		{
			key: reminder.id,
			tz: 'UTC'
		}
	);
}

/**
 * Unschedule a reminder
 */
export async function unscheduleReminder(reminderId: string): Promise<void> {
	const boss = await getPgBoss();
	await boss.unschedule(QUEUE_NAME, reminderId);
}

/**
 * Reschedule all active reminders
 */
async function rescheduleAll(): Promise<void> {
	const reminders = await db.select().from(moodReminder).where(eq(moodReminder.isActive, true));

	for (const reminder of reminders) {
		await scheduleReminder({
			id: reminder.id,
			time: reminder.time,
			daysOfWeek: reminder.daysOfWeek
		});
	}
}

/**
 * Send push notification for a reminder
 */
async function sendNotification(reminder: {
	id: string;
	userId: string;
	title: string;
	message: string;
	emotionEmoji?: string | null;
}): Promise<void> {
	const vapidPublicKey = env.VAPID_PUBLIC_KEY;
	const vapidPrivateKey = env.VAPID_PRIVATE_KEY;
	const vapidSubject = env.VAPID_SUBJECT;

	if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
		console.warn('[Reminder] Push notifications not configured');
		return;
	}

	webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

	const subscriptions = await db
		.select()
		.from(pushSubscription)
		.where(and(eq(pushSubscription.userId, reminder.userId), eq(pushSubscription.isActive, true)));

	if (subscriptions.length === 0) {
		return;
	}

	const title = reminder.emotionEmoji
		? `${reminder.emotionEmoji} ${reminder.title}`
		: reminder.title;

	const payload = JSON.stringify({
		title,
		body: reminder.message,
		icon: '/favicon.png',
		badge: '/badge-72.png',
		tag: 'mood-reminder',
		data: { url: '/', reminderId: reminder.id }
	});

	const results = await Promise.allSettled(
		subscriptions.map(async (sub) => {
			try {
				await webpush.sendNotification(
					{
						endpoint: sub.endpoint,
						keys: { auth: sub.auth, p256dh: sub.p256dh }
					},
					payload
				);
			} catch (error) {
				const err = error as Record<string, unknown>;
				if (err.statusCode === 410 || err.statusCode === 404) {
					await db
						.update(pushSubscription)
						.set({ isActive: false })
						.where(eq(pushSubscription.id, sub.id));
				}
				throw error;
			}
		})
	);

	const successful = results.filter((r) => r.status === 'fulfilled').length;
	if (successful < subscriptions.length) {
		console.warn(
			`[Reminder] Some notifications failed: ${subscriptions.length - successful}/${
				subscriptions.length
			}`
		);
	}
}

/**
 * Manually trigger a reminder (for testing)
 */
export async function triggerReminder(reminderId: string): Promise<void> {
	const [reminder] = await db.select().from(moodReminder).where(eq(moodReminder.id, reminderId));

	if (!reminder) {
		throw new Error('Reminder not found');
	}

	await sendNotification(reminder);
}
