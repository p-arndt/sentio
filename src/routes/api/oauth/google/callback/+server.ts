/**
 * Google Calendar OAuth Callback Handler
 * Receives the OAuth callback from Google and links the calendar to the user account
 */

import { json, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { calendarAccount, account } from '$lib/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { env } from '$env/dynamic/private';

export const GET: RequestHandler = async ({ url, locals }) => {
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const error = url.searchParams.get('error');

	// Check for OAuth errors
	if (error) {
		const errorDescription = url.searchParams.get('error_description') || error;
		console.error('[Google OAuth] Error:', errorDescription);
		throw redirect(303, `/settings?error=${encodeURIComponent(errorDescription)}`);
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

	if (!code) {
		return json({ error: 'Missing authorization code' }, { status: 400 });
	}

	// Exchange code for tokens
	const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: new URLSearchParams({
			client_id: env.GOOGLE_CLIENT_ID || '',
			client_secret: env.GOOGLE_CLIENT_SECRET || '',
			code,
			grant_type: 'authorization_code',
			redirect_uri: env.GOOGLE_REDIRECT_URI || ''
		})
	});

	if (!tokenResponse.ok) {
		const errorData = await tokenResponse.text();
		console.error('[Google OAuth] Token exchange failed:', errorData);
		throw redirect(303, '/settings?error=token_exchange_failed');
	}

	try {
		const tokens = (await tokenResponse.json()) as {
			access_token: string;
			refresh_token?: string;
			expires_in: number;
			id_token?: string;
		};

		// Decode ID token to get user info
		const idTokenParts = tokens.id_token?.split('.') || [];
		const decodedToken = idTokenParts[1]
			? JSON.parse(Buffer.from(idTokenParts[1], 'base64').toString())
			: null;

		const calendarEmail = decodedToken?.email || 'unknown@google.com';

		// Store the OAuth account in better-auth accounts table
		const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);
		const refreshExpiresAt = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year

		const existingAccount = await db
			.select()
			.from(account)
			.where(
				and(
					eq(account.userId, userId),
					eq(account.providerId, 'google'),
					eq(account.accountId, calendarEmail)
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
					idToken: tokens.id_token,
					accessTokenExpiresAt: expiresAt,
					refreshTokenExpiresAt: refreshExpiresAt,
					updatedAt: new Date()
				})
				.where(eq(account.id, existingAccount[0].id));
		} else {
			// Create new account
			await db.insert(account).values({
				id: crypto.randomUUID(),
				accountId: calendarEmail,
				providerId: 'google',
				userId,
				accessToken: tokens.access_token,
				refreshToken: tokens.refresh_token,
				idToken: tokens.id_token,
				accessTokenExpiresAt: expiresAt,
				refreshTokenExpiresAt: refreshExpiresAt,
				scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}

		// Create/update calendar account entry
		const existingCal = await db
			.select()
			.from(calendarAccount)
			.where(and(eq(calendarAccount.userId, userId), eq(calendarAccount.provider, 'google')))
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
				provider: 'google',
				email: calendarEmail,
				calendarId: 'primary',
				isEnabled: true,
				metadata: {
					displayName: decodedToken?.name || 'My Calendar',
					timezone: 'UTC'
				},
				createdAt: new Date(),
				updatedAt: new Date()
			});
		}
	} catch (error) {
		if (error instanceof Response) {
			throw error;
		}
		console.error('[Google OAuth] Error:', error);
		throw redirect(303, '/settings?error=connection_failed');
	}

	console.log(`[Google OAuth] Successfully linked Google Calendar for user ${userId}`);
	throw redirect(303, '/settings?success=google_calendar_connected');
};
