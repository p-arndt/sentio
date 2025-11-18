import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { pushSubscription as pushSubscriptionTable } from '$lib/server/db/schema';
import type { RequestHandler } from '@sveltejs/kit';
import { json } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import webpush from 'web-push';

/**
 * POST /api/push/send
 * Send a test push notification 
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { userId, title, body, icon, badge, tag, data } =
			(await request.json()) as Notification & { userId?: string };

		if(locals.user.id !== userId) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const vapidPublicKey = env.VAPID_PUBLIC_KEY;
		const vapidPrivateKey = env.VAPID_PRIVATE_KEY;
		const vapidSubject = env.VAPID_SUBJECT;

		if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
			return json({ error: 'Push notifications not properly configured' }, { status: 503 });
		}

		webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

		// Get subscriptions to send to
		let subscriptions = await db.select().from(pushSubscriptionTable);
		if (userId) {
			subscriptions = subscriptions.filter((s) => s.userId === userId);
		} else {
			return json({ error: 'Missing userId to send push notification to' }, { status: 400 });
		}

		if (subscriptions.length === 0) {
			return json({ message: 'No active subscriptions to send to' }, { status: 200 });
		}

		const payload = JSON.stringify({
			title: title || 'Mood Reminder',
			body,
			icon: icon || '/favicon.png',
			badge: badge || '/badge-72.png',
			tag: tag || Date.now(),
			data: data || {}
		});

		const results = await Promise.allSettled(
			subscriptions.map(async (sub) => {
				try {
					await webpush.sendNotification(
						{
							endpoint: sub.endpoint,
							keys: {
								auth: sub.auth,
								p256dh: sub.p256dh
							}
						},
						payload
					);
					return { success: true, id: sub.id };
				} catch (error) {
					const err = error as Record<string, unknown>;
					// Mark subscription as inactive if it fails
					if (err.statusCode === 410 || err.statusCode === 404) {
						await db
							.update(pushSubscriptionTable)
							.set({ isActive: false })
							.where(eq(pushSubscriptionTable.id, sub.id));
					}
					return { success: false, id: sub.id, error: String(err.message) };
				}
			})
		);

		const successful = results.filter(
			(r) => r.status === 'fulfilled' && (r.value as Record<string, unknown>).success
		).length;
		const failed = results.length - successful;

		return json({
			success: true,
			message: `Sent to ${successful} subscriptions`,
			sent: successful,
			failed,
			results
		});
	} catch (error) {
		console.error('Push send error:', error);
		return json({ error: 'Failed to send push notification' }, { status: 500 });
	}
};
