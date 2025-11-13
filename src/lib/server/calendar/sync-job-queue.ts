/**
 * Calendar Sync Job Queue Handler
 * Manages job queueing using pgboss for async calendar synchronization
 */

import { getPgBoss } from '$lib/server/pg-boss-service';
import { syncCalendarAccount, syncUserCalendars } from './calendar-sync.job';
import { db } from '$lib/server/db';
import { calendarAccount, calendarEvent } from '$lib/server/db/schema';
import { eq, and, lte, gte } from 'drizzle-orm';
import { queueEventNotification } from './event-notification.processor';

const SYNC_ACCOUNT_QUEUE = 'calendar-sync-account';
const SYNC_USER_QUEUE = 'calendar-sync-user';
const SYNC_ALL_QUEUE = 'calendar-sync-all';

/**
 * Initialize pgboss job handlers
 * Should be called once during app startup
 */
export async function initializeCalendarJobHandlers() {
	try {
		const boss = await getPgBoss();

		// Create queues
		await boss.createQueue(SYNC_ACCOUNT_QUEUE);
		await boss.createQueue(SYNC_USER_QUEUE);
		await boss.createQueue(SYNC_ALL_QUEUE);

		// Handler for syncing a single calendar account
		await boss.work(
			SYNC_ACCOUNT_QUEUE,
			async (jobs: Array<{ id: string; data: { calendarAccountId: string } }>) => {
				for (const job of jobs) {
					console.log(`[Calendar Sync Queue] Processing sync job for account ${job.data.calendarAccountId}`);

					try {
						const account = await db
							.select()
							.from(calendarAccount)
							.where(eq(calendarAccount.id, job.data.calendarAccountId))
							.limit(1);

						if (!account || account.length === 0) {
							throw new Error(`Calendar account ${job.data.calendarAccountId} not found`);
						}

						await syncCalendarAccount(account[0]);
						console.log(`[Calendar Sync Queue] Successfully synced account ${job.data.calendarAccountId}`);
					} catch (error) {
						console.error(
							`[Calendar Sync Queue] Error syncing account ${job.data.calendarAccountId}:`,
							error
						);
						throw error;
					}
				}
			}
		);

		// Handler for syncing all calendars for a user
		await boss.work(
			SYNC_USER_QUEUE,
			async (jobs: Array<{ id: string; data: { userId: string } }>) => {
				for (const job of jobs) {
					console.log(`[Calendar Sync Queue] Processing user sync for user ${job.data.userId}`);

					try {
						await syncUserCalendars(job.data.userId);

						// Queue event notifications for events that just ended
						await queueEventsEndingNotifications(job.data.userId);

						console.log(`[Calendar Sync Queue] Successfully synced all calendars for user ${job.data.userId}`);
					} catch (error) {
						console.error(`[Calendar Sync Queue] Error syncing user ${job.data.userId}:`, error);
						throw error;
					}
				}
			}
		);

		// Handler for syncing all calendar accounts across all users
		await boss.work(SYNC_ALL_QUEUE, async (jobs: Array<{ id: string; data: Record<string, unknown> }>) => {
			// Process regardless of job data since this is a global sync
			if (jobs.length > 0) {
				console.log(`[Calendar Sync Queue] Processing global sync`);

				try {
					const accounts = await db
						.select()
						.from(calendarAccount)
						.where(eq(calendarAccount.isEnabled, true));

					for (const account of accounts) {
						try {
							await syncCalendarAccount(account);
						} catch (error) {
							console.error(`[Calendar Sync Queue] Error syncing account ${account.id}:`, error);
						}
					}

					console.log(`[Calendar Sync Queue] Global sync completed for ${accounts.length} accounts`);
				} catch (error) {
					console.error(`[Calendar Sync Queue] Error in global sync:`, error);
					throw error;
				}
			}
		});

		console.log('[Calendar Sync Queue] Job handlers initialized');
	} catch (error) {
		console.error('[Calendar Sync Queue] Failed to initialize job handlers:', error);
		throw error;
	}
}

/**
 * Queue a sync job for a specific calendar account
 * Useful for user-initiated syncs
 */
export async function queueCalendarSync(
	calendarAccountId: string,
	priority: 'low' | 'normal' | 'high' = 'normal'
) {
	const boss = await getPgBoss();

	const priorityMap = {
		low: 10,
		normal: 5,
		high: 1
	};

	try {
		const jobId = await boss.send(SYNC_ACCOUNT_QUEUE, { calendarAccountId }, {
			priority: priorityMap[priority],
			retryLimit: 2,
			retryDelay: 5,
			expireInSeconds: 3600
		});

		console.log(
			`[Calendar Sync Queue] Queued sync job for account ${calendarAccountId} with priority ${priority}: ${jobId}`
		);
		return jobId;
	} catch (error) {
		console.error(`[Calendar Sync Queue] Failed to queue sync job:`, error);
		throw error;
	}
}

/**
 * Queue a sync job for all calendars of a user
 */
export async function queueUserSync(userId: string, priority: 'low' | 'normal' | 'high' = 'high') {
	const boss = await getPgBoss();

	const priorityMap = {
		low: 10,
		normal: 5,
		high: 1
	};

	try {
		const jobId = await boss.send(SYNC_USER_QUEUE, { userId }, {
			priority: priorityMap[priority],
			retryLimit: 2,
			retryDelay: 5,
			expireInSeconds: 3600
		});

		console.log(`[Calendar Sync Queue] Queued user sync for user ${userId} with priority ${priority}: ${jobId}`);
		return jobId;
	} catch (error) {
		console.error(`[Calendar Sync Queue] Failed to queue user sync:`, error);
		throw error;
	}
}

/**
 * Queue a global sync for all enabled calendar accounts
 */
export async function queueGlobalSync(priority: 'low' | 'normal' | 'high' = 'normal') {
	const boss = await getPgBoss();

	const priorityMap = {
		low: 10,
		normal: 5,
		high: 1
	};

	try {
		const jobId = await boss.send(SYNC_ALL_QUEUE, {}, {
			priority: priorityMap[priority],
			retryLimit: 1,
			retryDelay: 10,
			expireInSeconds: 7200
		});

		console.log(`[Calendar Sync Queue] Queued global sync with priority ${priority}: ${jobId}`);
		return jobId;
	} catch (error) {
		console.error(`[Calendar Sync Queue] Failed to queue global sync:`, error);
		throw error;
	}
}

/**
 * Get job status
 */
export async function getJobStatus(queueName: string, jobId: string) {
	const boss = await getPgBoss();

	try {
		const job = await boss.getJobById(queueName, jobId);
		return job;
	} catch (error) {
		console.error(`[Calendar Sync Queue] Failed to get job status:`, error);
		throw error;
	}
}

/**
 * Queue event notifications for events
 * Finds both upcoming and recently-ended events and schedules their notifications
 */
export async function queueEventsEndingNotifications(userId: string): Promise<void> {
	try {
		// Find events with notifications not yet sent
		// Include both upcoming events and those that just ended
		const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

		const eventsToNotify = await db
			.select()
			.from(calendarEvent)
			.where(
				and(
					eq(calendarEvent.userId, userId),
					eq(calendarEvent.moodPromptSent, false), // Not yet notified
					lte(calendarEvent.endTime, thirtyDaysFromNow), // Within 30 days
					gte(calendarEvent.endTime, new Date(Date.now() - 60 * 1000)) // Ended in last minute or future
				)
			);

		for (const event of eventsToNotify) {
			try {
				// Queue the notification for when the event ends
				await queueEventNotification(event.id, userId, event.endTime);
			} catch (error) {
				console.error(`[Calendar Sync Queue] Failed to queue notification for event ${event.id}:`, error);
			}
		}

		if (eventsToNotify.length > 0) {
			console.log(`[Calendar Sync Queue] Scheduled ${eventsToNotify.length} event notifications for user ${userId}`);
		}
	} catch (error) {
		console.error(`[Calendar Sync Queue] Error queueing event notifications:`, error);
	}
}
