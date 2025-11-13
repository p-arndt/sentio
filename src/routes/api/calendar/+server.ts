/**
 * Calendar API Endpoints
 * Handles calendar data retrieval, connection management, and sync operations
 */

import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { calendarAccount, calendarEvent } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { queueUserSync, queueCalendarSync } from '$lib/server/calendar/sync-job-queue';

/**
 * GET /api/calendar/accounts
 * Get all calendar accounts for authenticated user
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const accounts = await db
			.select()
			.from(calendarAccount)
			.where(eq(calendarAccount.userId, locals.user.id));

		return json({ accounts });
	} catch (error) {
		console.error('Error fetching calendar accounts:', error);
		return json({ error: 'Failed to fetch calendar accounts' }, { status: 500 });
	}
};

/**
 * POST /api/calendar
 * Handle various calendar operations: disconnect, sync
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const data = (await request.json()) as {
			action?: string;
			accountId?: string;
		};

		// Handle disconnect action
		if (data.action === 'disconnect' || !data.action) {
			if (!data.accountId) {
				return json({ error: 'Missing accountId' }, { status: 400 });
			}

			// Verify account belongs to user
			const account = await db
				.select()
				.from(calendarAccount)
				.where(eq(calendarAccount.id, data.accountId))
				.limit(1);

			if (!account || account.length === 0 || account[0].userId !== locals.user.id) {
				return json({ error: 'Account not found' }, { status: 404 });
			}

			// Delete the calendar account
			await db.delete(calendarAccount).where(eq(calendarAccount.id, data.accountId));

			// Delete associated events
			await db
				.delete(calendarEvent)
				.where(eq(calendarEvent.calendarAccountId, data.accountId));

			console.log(`Disconnected calendar account ${data.accountId} for user ${locals.user.id}`);

			return json({ success: true });
		}

		// Handle sync action
		if (data.action === 'sync') {
			if (data.accountId) {
				// Sync specific calendar account
				const account = await db
					.select()
					.from(calendarAccount)
					.where(eq(calendarAccount.id, data.accountId))
					.limit(1);

				if (!account || account.length === 0 || account[0].userId !== locals.user.id) {
					return json({ error: 'Account not found' }, { status: 404 });
				}

				try {
					const jobId = await queueCalendarSync(data.accountId, 'high');
					return json({
						success: true,
						message: 'Calendar sync queued',
						jobId,
						status: 'queued'
					});
				} catch (error) {
					console.error('Error queueing calendar sync:', error);
					return json({ error: 'Failed to queue sync' }, { status: 500 });
				}
			} else {
				// Sync all user calendars
				try {
					const jobId = await queueUserSync(locals.user.id, 'high');
					return json({
						success: true,
						message: 'All calendars sync queued',
						jobId,
						status: 'queued'
					});
				} catch (error) {
					console.error('Error queueing user sync:', error);
					return json({ error: 'Failed to queue sync' }, { status: 500 });
				}
			}
		}

		return json({ error: 'Invalid action' }, { status: 400 });
	} catch (error) {
		console.error('Error in calendar API:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
