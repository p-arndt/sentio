import { db } from '$lib/server/db';
import { account, calendarAccount } from '$lib/server/db/schema';
import { json, redirect, type RequestHandler } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';

const REFRESH_TOKEN_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

export type OAuthTokens = {
	access_token: string;
	refresh_token?: string;
	expires_in: number;
	id_token?: string;
};

export type OAuthUserInfo = {
	accountId: string;
	calendarEmail: string;
	calendarMetadata?: Record<string, unknown>;
	calendarId?: string;
};

export class OAuthHandlerError extends Error {
	constructor(
		public code: string,
		message?: string
	) {
		super(message);
	}
}

export interface OAuthProviderConfig {
	providerId: string;
	providerName: string;
	tokenUrl: string;
	tokenHeaders?: Record<string, string>;
	buildTokenParams: (code: string) => Record<string, string>;
	deriveUserInfo: (tokens: OAuthTokens) => Promise<OAuthUserInfo>;
	scope: string;
	successRedirect: string;
	errorRedirectBase: string;
	logPrefix: string;
	extraAccountFields?: (userInfo: OAuthUserInfo, tokens: OAuthTokens) => Record<string, unknown>;
}

const pickDefined = (fields: Record<string, unknown>) =>
	Object.fromEntries(Object.entries(fields).filter(([, value]) => value !== undefined));

export const createOAuthCallbackHandler =
	(config: OAuthProviderConfig): RequestHandler =>
	async ({ url, locals }) => {
		const error = url.searchParams.get('error');
		const errorDescription = url.searchParams.get('error_description') || error;
		const buildErrorRedirect = (reason: string) =>
			`${config.errorRedirectBase}?error=${encodeURIComponent(reason)}`;

		if (error && errorDescription) {
			console.error(`${config.logPrefix} Error:`, errorDescription);
			throw redirect(303, buildErrorRedirect(errorDescription));
		}

		const state = url.searchParams.get('state');

		if (!state) {
			return json({ error: 'Missing state parameter' }, { status: 400 });
		}

		if (!locals.user) {
			throw redirect(303, '/login');
		}

		const userId = locals.user.id;
		const code = url.searchParams.get('code');

		if (!code) {
			return json({ error: 'Missing authorization code' }, { status: 400 });
		}

		const tokenParams = config.buildTokenParams(code);

		// Ensure confidential clients include client credentials
		const hasClientSecret = Boolean(tokenParams.client_secret);
		const hasClientAssertion = Boolean(tokenParams.client_assertion);

		if (!hasClientSecret && !hasClientAssertion) {
			console.error(`${config.logPrefix} Missing client credentials for token exchange`);
			throw redirect(303, buildErrorRedirect('missing_client_credentials'));
		}

		const tokenResponse = await fetch(config.tokenUrl, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				...config.tokenHeaders
			},
			body: new URLSearchParams(tokenParams)
		});

		if (!tokenResponse.ok) {
			const errorBody = await tokenResponse.text();
			console.error(`${config.logPrefix} Token exchange failed:`, errorBody);
			throw redirect(303, buildErrorRedirect('token_exchange_failed'));
		}

		try {
			const tokens = (await tokenResponse.json()) as OAuthTokens;
			const userInfo = await config.deriveUserInfo(tokens);

			const now = new Date();
			const expiresAt = new Date(now.getTime() + tokens.expires_in * 1000);
			const refreshExpiresAt = new Date(now.getTime() + REFRESH_TOKEN_TTL_MS);
			const extraFields = pickDefined(config.extraAccountFields?.(userInfo, tokens) ?? {});

			const existingAccount = await db
				.select()
				.from(account)
				.where(
					and(
						eq(account.userId, userId),
						eq(account.providerId, config.providerId),
						eq(account.accountId, userInfo.accountId)
					)
				)
				.limit(1);

			if (existingAccount.length > 0) {
				await db
					.update(account)
					.set({
						accessToken: tokens.access_token,
						refreshToken: tokens.refresh_token || existingAccount[0].refreshToken,
						accessTokenExpiresAt: expiresAt,
						refreshTokenExpiresAt: refreshExpiresAt,
						updatedAt: now,
						...extraFields
					})
					.where(eq(account.id, existingAccount[0].id));
			} else {
				await db.insert(account).values({
					id: crypto.randomUUID(),
					accountId: userInfo.accountId,
					providerId: config.providerId,
					userId,
					accessToken: tokens.access_token,
					refreshToken: tokens.refresh_token,
					accessTokenExpiresAt: expiresAt,
					refreshTokenExpiresAt: refreshExpiresAt,
					scope: config.scope,
					createdAt: now,
					updatedAt: now,
					...extraFields
				});
			}

			const existingCalendar = await db
				.select()
				.from(calendarAccount)
				.where(
					and(eq(calendarAccount.userId, userId), eq(calendarAccount.provider, config.providerId))
				)
				.limit(1);

			if (existingCalendar.length > 0) {
				await db
					.update(calendarAccount)
					.set({
						email: userInfo.calendarEmail,
						isEnabled: true,
						updatedAt: now
					})
					.where(eq(calendarAccount.id, existingCalendar[0].id));
			} else {
				type CalendarInsert = typeof calendarAccount.$inferInsert;

				const calendarValues: CalendarInsert = {
					id: crypto.randomUUID(),
					userId,
					provider: config.providerId,
					email: userInfo.calendarEmail,
					isEnabled: true,
					metadata: userInfo.calendarMetadata ?? { timezone: 'UTC' },
					createdAt: now,
					updatedAt: now
				};

				if (userInfo.calendarId) {
					calendarValues.calendarId = userInfo.calendarId;
				}

				await db.insert(calendarAccount).values(calendarValues);
			}
		} catch (error) {
			if (error instanceof Response) {
				throw error;
			}

			const errorCode = error instanceof OAuthHandlerError ? error.code : 'connection_failed';
			console.error(`${config.logPrefix} Error:`, error);
			throw redirect(303, buildErrorRedirect(errorCode));
		}

		throw redirect(303, config.successRedirect);
	};
