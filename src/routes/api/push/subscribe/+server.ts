import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { pushSubscription } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import type { PushSubscriptionInput } from '$lib/types';

/**
 * POST /api/push/subscribe
 * Subscribe a user device to push notifications
 */
export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const subscriptionData = (await request.json()) as PushSubscriptionInput;

		if (!subscriptionData.endpoint || !subscriptionData.keys) {
			return json(
				{ error: 'Invalid subscription data' },
				{ status: 400 }
			);
		}

		const userAgent = request.headers.get('user-agent') || undefined;

		// Check if subscription already exists (same endpoint)
		const existing = await db
			.select()
			.from(pushSubscription)
			.where(
				and(
					eq(pushSubscription.userId, locals.user.id),
					eq(pushSubscription.endpoint, subscriptionData.endpoint)
				)
			);

		if (existing.length > 0) {
			// Update existing subscription
			await db
				.update(pushSubscription)
				.set({
					auth: subscriptionData.keys.auth,
					p256dh: subscriptionData.keys.p256dh,
					userAgent,
					isActive: true,
					updatedAt: new Date()
				})
				.where(eq(pushSubscription.id, existing[0].id));

			return json(
				{
					success: true,
					message: 'Subscription updated',
					id: existing[0].id
				},
				{ status: 200 }
			);
		}

		// Create new subscription
		const newSubscription = await db
			.insert(pushSubscription)
			.values({
				userId: locals.user.id,
				endpoint: subscriptionData.endpoint,
				auth: subscriptionData.keys.auth,
				p256dh: subscriptionData.keys.p256dh,
				userAgent
			})
			.returning({ id: pushSubscription.id });

		return json(
			{
				success: true,
				message: 'Subscription created',
				id: newSubscription[0]?.id
			},
			{ status: 201 }
		);
	} catch (error) {
		console.error('Push subscription error:', error);
		return json(
			{ error: 'Failed to create subscription' },
			{ status: 500 }
		);
	}
};

/**
 * DELETE /api/push/subscribe
 * Unsubscribe a user device from push notifications
 */
export const DELETE: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { endpoint } = (await request.json()) as { endpoint: string };

		if (!endpoint) {
			return json(
				{ error: 'Endpoint is required' },
				{ status: 400 }
			);
		}

		const result = await db
			.delete(pushSubscription)
			.where(
				and(
					eq(pushSubscription.userId, locals.user.id),
					eq(pushSubscription.endpoint, endpoint)
				)
			)
			.returning({ id: pushSubscription.id });

		if (result.length === 0) {
			return json(
				{ error: 'Subscription not found' },
				{ status: 404 }
			);
		}

		return json({
			success: true,
			message: 'Subscription removed'
		});
	} catch (error) {
		console.error('Push unsubscribe error:', error);
		return json(
			{ error: 'Failed to remove subscription' },
			{ status: 500 }
		);
	}
};
