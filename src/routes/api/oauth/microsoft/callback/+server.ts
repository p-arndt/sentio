/**
 * Microsoft/Outlook Calendar OAuth Callback Handler
 * Receives the OAuth callback from Microsoft and links the calendar to the user account
 */

import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { calendarAccount, account } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');

	// Check for OAuth errors
	if (error) {
		const errorDescription = url.searchParams.get('error_description') || error;
		console.error('[Microsoft OAuth] Error:', errorDescription);
		throw redirect(303, `/settings/calendar?error=${encodeURIComponent(errorDescription)}`);
	}

	// Validate state for CSRF protection
	if (!state) {
		return json({ error: 'Missing state parameter' }, { status: 400 });
	}

	// Verify user is authenticated
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const userId = locals.user.id;

	try {
		if (!code) {
			return json({ error: 'Missing authorization code' }, { status: 400 });
		}

		// Exchange code for tokens
		const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				client_id: process.env.MICROSOFT_CLIENT_ID || '',
				client_secret: process.env.MICROSOFT_CLIENT_SECRET || '',
				code,
				grant_type: 'authorization_code',
				redirect_uri: process.env.MICROSOFT_REDIRECT_URI || '',
				scope: 'Calendars.Read offline_access'
			})
		});

		if (!tokenResponse.ok) {
			const errorData = await tokenResponse.text();
			console.error('[Microsoft OAuth] Token exchange failed:', errorData);
			throw redirect(303, '/settings/calendar?error=token_exchange_failed');
		}

		const tokens = (await tokenResponse.json()) as {
			access_token: string;
			refresh_token?: string;
			expires_in: number;
		};

		// Get user info from Microsoft Graph
		const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
				Accept: 'application/json'
			}
		});

		if (!userResponse.ok) {
			console.error('[Microsoft OAuth] Failed to get user info');
			throw redirect(303, '/settings/calendar?error=user_info_failed');
		}

		const userInfo = (await userResponse.json()) as {
			id: string;
			mail?: string;
			userPrincipalName?: string;
			displayName?: string;
		};

		const calendarEmail = userInfo.mail || userInfo.userPrincipalName || 'unknown@microsoft.com';

		// Store the OAuth account in better-auth accounts table
		const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
		const refreshExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

		const existingAccount = await db
			.select()
			.from(account)
			.where(
				and(
					eq(account.userId, userId),
					eq(account.providerId, 'microsoft'),
					eq(account.accountId, userInfo.id)
				)
			)
			.limit(1);

		if (existingAccount.length > 0) {
			// Update existing account
			await db
				.update(account)
				.set({
					accessToken: tokens.access_token,
					refreshToken: tokens.refresh_token || existingAccount[0].refreshToken,
					accessTokenExpiresAt: expiresAt,
					refreshTokenExpiresAt: refreshExpiresAt,
					updatedAt: new Date()
				})
				.where(eq(account.id, existingAccount[0].id));
		} else {
			// Create new account
			await db.insert(account).values({
				id: crypto.randomUUID(),
				accountId: userInfo.id,
				providerId: 'microsoft',
				userId,
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				accessTokenExpiresAt: expiresAt,
				refreshTokenExpiresAt: refreshExpiresAt,
				scope: 'Calendars.Read offline_access',
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}

		// Create/update calendar account entry
		const existingCal = await db
			.select()
			.from(calendarAccount)
			.where(and(eq(calendarAccount.userId, userId), eq(calendarAccount.provider, 'microsoft')))
			.limit(1);

		if (existingCal.length > 0) {
			await db
				.update(calendarAccount)
				.set({
					email: calendarEmail,
					isEnabled: true,
					updatedAt: new Date()
				})
				.where(eq(calendarAccount.id, existingCal[0].id));
		} else {
			await db.insert(calendarAccount).values({
				id: crypto.randomUUID(),
				userId,
				provider: 'microsoft',
				email: calendarEmail,
				isEnabled: true,
				metadata: {
					displayName: userInfo.displayName || 'My Calendar',
					timezone: 'UTC',
					microsoftId: userInfo.id
				},
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}

		console.log(`[Microsoft OAuth] Successfully linked Microsoft Calendar for user ${userId}`);
		throw redirect(303, '/settings/calendar?success=microsoft_calendar_connected');
	} catch (error) {
		if (error instanceof Response) {
			throw error;
		}
		console.error('[Microsoft OAuth] Error:', error);
		throw redirect(303, '/settings/calendar?error=connection_failed');
	}
};
