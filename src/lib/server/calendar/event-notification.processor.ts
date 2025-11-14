/**
 * Calendar Event Notification Job Handler
 * Sends web push notifications when calendar events end for users who opted in
 * Uses PgBoss for one-time, scheduled notification delivery at event end times
 */

import { db } from '$lib/server/db';
import { calendarEvent, userPreferences, pushSubscription } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import webpush from 'web-push';
import { getPgBoss } from '$lib/server/pg-boss-service';

const EVENT_NOTIFICATION_QUEUE = 'calendar-event-notification';

/**
 * Initialize event notification job handler
 * Should be called once during app startup
 */
export async function initializeEventNotificationHandler() {
	try {
		const boss = await getPgBoss();

		// Create queue if it doesn't exist
		await boss.createQueue(EVENT_NOTIFICATION_QUEUE);

		// Handler for sending event end notifications
		await boss.work(EVENT_NOTIFICATION_QUEUE, async (jobs: Array<{ id: string; data: { eventId: string; userId: string } }>) => {
			for (const job of jobs) {
				const { eventId, userId } = job.data;
				console.log(`[Event Notification] Processing notification for event ${eventId} (user ${userId})`);

				try {
					// Fetch event
					const events = await db
						.select()
						.from(calendarEvent)
						.where(eq(calendarEvent.id, eventId))
						.limit(1);

					if (!events || events.length === 0) {
						console.warn(`[Event Notification] Event ${eventId} not found`);
						return;
					}

					const event = events[0];

					// Check if already sent (prevent duplicates)
					if (event.moodPromptSent) {
						console.log(`[Event Notification] Notification already sent for event ${eventId}`);
						return;
					}

					// Check if user has notifications enabled
					const userPrefs = await db
						.select()
						.from(userPreferences)
						.where(eq(userPreferences.userId, userId))
						.limit(1);

					if (!userPrefs || userPrefs.length === 0) {
						console.warn(`[Event Notification] User preferences not found for ${userId}`);
						return;
					}

					const settings = userPrefs[0].settings as Record<string, unknown>;
					if (settings?.enableEventNotifications !== true) {
						console.log(`[Event Notification] Notifications disabled for user ${userId}`);
						return;
					}

					// Send notifications to all user's devices
					try {
						await sendEventNotifications(event, userId);
						console.log(`[Event Notification] Notifications sent successfully for event ${eventId}`);
					} catch (notifError) {
						console.error(`[Event Notification] Error sending notifications for event ${eventId}:`, notifError);
						// Continue to mark as sent anyway, so we don't retry forever
					}

					// Mark as sent (IMPORTANT: Always do this to prevent re-sending)
					try {
						await db
							.update(calendarEvent)
							.set({ moodPromptSent: true, moodPromptSentAt: new Date() })
							.where(eq(calendarEvent.id, eventId));

						console.log(`[Event Notification] ✓ Database marked moodPromptSent=true for event ${eventId}`);
					} catch (updateError) {
						console.error(`[Event Notification] ✗ Failed to update database for event ${eventId}:`, updateError);
						throw updateError; // Let PgBoss retry this job
					}

					console.log(`[Event Notification] Successfully processed event ${eventId}`);
				} catch (error) {
					console.error(`[Event Notification] Error processing event ${job.data.eventId}:`, error);
					throw error;
				}
			}
		});

		console.log('[Event Notification] Job handler initialized');
	} catch (error) {
		console.error('[Event Notification] Failed to initialize handler:', error);
		throw error;
	}
}

/**
 * Queue an event notification job to run at the event end time
 * This uses sendAfter() to schedule it for a specific date
 */
export async function queueEventNotification(eventId: string, userId: string, endTime: Date) {
	const boss = await getPgBoss();

	try {
		// Only queue if the event is in the future
		const now = new Date();
		if (endTime <= now) {
			console.log(`[Event Notification] Event ${eventId} already ended, sending immediately`);
			// Send immediately for already-ended events
			const jobId = await boss.send(
				EVENT_NOTIFICATION_QUEUE,
				{ eventId, userId },
				{
					priority: 1, // High priority
					retryLimit: 2,
					retryDelay: 5,
					expireInSeconds: 300
				}
			);
			console.log(`[Event Notification] Queued immediate notification for past event ${eventId}: ${jobId}`);
			return jobId;
		}

		// For future events, use sendAfter() to schedule at end time
		const jobId = await boss.sendAfter(
			EVENT_NOTIFICATION_QUEUE,
			{ eventId, userId },
			{
				priority: 1, // High priority
				retryLimit: 2,
				retryDelay: 5,
				expireInSeconds: 300
			},
			endTime
		);

		console.log(`[Event Notification] Scheduled notification for event ${eventId} at ${endTime.toISOString()}: ${jobId}`);
		return jobId;
	} catch (error) {
		console.error(`[Event Notification] Failed to queue notification:`, error);
		throw error;
	}
}

/**
 * Send push notifications for an event
 * Sends to all active subscriptions for the user
 */
async function sendEventNotifications(event: typeof calendarEvent.$inferSelect, userId: string): Promise<void> {
	// Get all active push subscriptions for the user
	const subscriptions = await db
		.select()
		.from(pushSubscription)
		.where(and(eq(pushSubscription.userId, userId), eq(pushSubscription.isActive, true)));

	if (subscriptions.length === 0) {
		console.log(`[Event Notification] No active subscriptions for user ${userId}`);
		return;
	}

	const payload = JSON.stringify({
		title: 'How was your event?',
		body: `${event.title} just ended. How was your mood?`,
		icon: '/android-chrome-192x192.png',
		tag: `event-${event.id}`,
		data: {
			eventId: event.id,
			link: '/'
		}
	});

	// Send to all subscriptions
	for (const subscription of subscriptions) {
		try {
			const subscriptionObj = {
				endpoint: subscription.endpoint,
				keys: {
					p256dh: subscription.p256dh,
					auth: subscription.auth
				}
			};

			await webpush.sendNotification(subscriptionObj, payload);
			console.log(`[Event Notification] Sent to subscription ${subscription.id}`);
		} catch (error: unknown) {
			if (error instanceof Error && error.message.includes('410')) {
				// Subscription gone, deactivate it
				await db
					.update(pushSubscription)
					.set({ isActive: false })
					.where(eq(pushSubscription.id, subscription.id));
				console.log(`[Event Notification] Deactivated expired subscription`);
			} else if (error instanceof Error && error.message.includes('404')) {
				// Subscription not found, deactivate it
				await db
					.update(pushSubscription)
					.set({ isActive: false })
					.where(eq(pushSubscription.id, subscription.id));
				console.log(`[Event Notification] Deactivated invalid subscription`);
			} else {
				console.error(`[Event Notification] Error sending notification:`, error);
			}
		}
	}
}

