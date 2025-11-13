/**
 * Calendar Sync Job
 * Background job that periodically syncs calendar events for all users
 * Designed to run via cron or queue worker (e.g., BullMQ, node-cron)
 */

import { db } from '$lib/server/db';
import {
	calendarAccount,
	calendarEvent,
	calendarSync,
	account as authAccount
} from '$lib/server/db/schema';
import {
	fetchGoogleCalendarEvents,
	fetchMicrosoftCalendarEvents,
	refreshAccessToken,
	calculateEventDuration
} from './calendar.service';
import { eq, and } from 'drizzle-orm';
import type { CalendarEvent } from './types';

/**
 * Main sync job - syncs all enabled calendar accounts
 * Call this periodically (e.g., every 5-15 minutes)
 */
export async function syncAllCalendars(): Promise<void> {
	console.log('[Calendar Sync] Starting calendar sync job');

	try {
		// Get all enabled calendar accounts
		const accounts = await db
			.select()
			.from(calendarAccount)
			.where(eq(calendarAccount.isEnabled, true));

		console.log(`[Calendar Sync] Found ${accounts.length} enabled calendar accounts`);

		for (const calAcc of accounts) {
			try {
				await syncCalendarAccount(calAcc);
			} catch (error) {
				console.error(`[Calendar Sync] Error syncing calendar account ${calAcc.id}:`, error);
			}
		}

		console.log('[Calendar Sync] Calendar sync job completed');
	} catch (error) {
		console.error('[Calendar Sync] Fatal error in sync job:', error);
	}
}

/**
 * Sync a single calendar account
 */
export async function syncCalendarAccount(cal: typeof calendarAccount.$inferSelect): Promise<void> {
	const syncId = crypto.randomUUID();

	try {
		// Create sync record
		await createSyncRecord(syncId, cal.userId, cal.id, 'in_progress');

		// Get OAuth account (stores access/refresh tokens)
		const oauthAccount = await db
			.select()
			.from(authAccount)
			.where(and(eq(authAccount.userId, cal.userId), eq(authAccount.providerId, cal.provider)))
			.limit(1);

		if (!oauthAccount || oauthAccount.length === 0) {
			throw new Error(`No OAuth account found for user ${cal.userId} and provider ${cal.provider}`);
		}

		const oauth = oauthAccount[0];

		// Refresh access token if needed
		let accessToken = oauth.accessToken;
		if (!accessToken || (oauth.accessTokenExpiresAt && oauth.accessTokenExpiresAt < new Date())) {
			if (!oauth.refreshToken) {
				throw new Error('No refresh token available');
			}
			accessToken = await refreshAccessToken(
				oauth.refreshToken,
				cal.provider as 'google' | 'microsoft'
			);
		}

		if (!accessToken) {
			throw new Error('Failed to obtain access token');
		}

		// Fetch events from provider
		let events: CalendarEvent[];
		const now = new Date();

		if (cal.provider === 'google') {
			events = await fetchGoogleCalendarEvents(
				accessToken,
				cal.calendarId || 'primary',
				undefined,
				100
			);
		} else if (cal.provider === 'microsoft') {
			events = await fetchMicrosoftCalendarEvents(
				accessToken,
				new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
				100
			);
		} else {
			throw new Error(`Unsupported calendar provider: ${cal.provider}`);
		}

		// Sync events to database
		const { imported, updated } = await syncEventsToDatabase(cal.id, cal.userId, events);

		// Update sync record
		await db
			.update(calendarSync)
			.set({
				status: 'completed',
				eventsImported: imported,
				eventsUpdated: updated,
				completedAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(calendarSync.id, syncId));

		// Update calendar account sync timestamp
		await db
			.update(calendarAccount)
			.set({
				lastSyncedAt: new Date(),
				nextSyncAt: new Date(Date.now() + 15 * 60 * 1000) // Next sync in 15 mins
			})
			.where(eq(calendarAccount.id, cal.id));

		console.log(
			`[Calendar Sync] Successfully synced ${cal.provider} calendar for user ${cal.userId}. Imported: ${imported}, Updated: ${updated}`
		);
	} catch (error) {
		const errorMsg = error instanceof Error ? error.message : String(error);

		// Update sync record with error
		await db
			.update(calendarSync)
			.set({
				status: 'failed',
				error: errorMsg,
				completedAt: new Date(),
				updatedAt: new Date()
			})
			.where(eq(calendarSync.id, syncId))
			.catch((err) => console.error('Failed to update sync record:', err));

		throw error;
	}
}

/**
 * Create a new sync record in database
 */
async function createSyncRecord(
	id: string,
	userId: string,
	calendarAccountId: string,
	status: 'pending' | 'in_progress' | 'completed' | 'failed'
): Promise<typeof calendarSync.$inferSelect> {
	const records = await db
		.insert(calendarSync)
		.values({
			id,
			userId,
			calendarAccountId,
			status,
			eventsImported: 0,
			eventsUpdated: 0,
			eventsDeleted: 0,
			startedAt: new Date()
		})
		.returning();

	return records[0];
}

/**
 * Sync fetched events to database
 * Returns counts of imported and updated events
 */
async function syncEventsToDatabase(
	calendarAccountId: string,
	userId: string,
	events: CalendarEvent[]
): Promise<{ imported: number; updated: number }> {
	let imported = 0;
	let updated = 0;

	for (const event of events) {
		const eventData = {
			calendarAccountId,
			userId,
			externalEventId: event.externalEventId,
			provider: event.provider,
			title: event.title,
			description: event.description,
			startTime: event.startTime,
			endTime: event.endTime,
			duration: calculateEventDuration(event.startTime, event.endTime),
			isAllDay: event.isAllDay,
			location: event.location,
			attendeeCount: event.attendeeCount,
			externalMetadata: event.externalMetadata,
			updatedAt: new Date()
		};

		// Check if event already exists
		const existing = await db
			.select()
			.from(calendarEvent)
			.where(
				and(
					eq(calendarEvent.externalEventId, event.externalEventId),
					eq(calendarEvent.calendarAccountId, calendarAccountId)
				)
			)
			.limit(1);

		if (existing.length > 0) {
			// Update existing event
			await db.update(calendarEvent).set(eventData).where(eq(calendarEvent.id, existing[0].id));
			updated++;
		} else {
			// Insert new event
			await db.insert(calendarEvent).values({
				id: crypto.randomUUID(),
				createdAt: new Date(),
				...eventData
			});
			imported++;
		}
	}

	return { imported, updated };
}

/**
 * Trigger a calendar sync for a specific user (on-demand)
 * Useful for user-initiated sync or after they connect a calendar
 */
export async function syncUserCalendars(userId: string): Promise<void> {
	const userCalendars = await db
		.select()
		.from(calendarAccount)
		.where(eq(calendarAccount.userId, userId));

	for (const cal of userCalendars) {
		try {
			await syncCalendarAccount(cal);
		} catch (error) {
			console.error(`Error syncing calendar ${cal.id} for user ${userId}:`, error);
		}
	}
}

/**
 * Get sync history for debugging/monitoring
 */
export async function getSyncHistory(
	userId?: string,
	limit: number = 50
): Promise<(typeof calendarSync.$inferSelect)[]> {
	let query = db.select().from(calendarSync).orderBy(calendarSync.startedAt).limit(limit);

	if (userId) {
		// @ts-expect-error - Drizzle type issue
		query = query.where(eq(calendarSync.userId, userId));
	}

	return query;
}
