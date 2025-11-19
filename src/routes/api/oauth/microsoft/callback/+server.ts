import { env } from '$env/dynamic/private';
import { env as publicEnv } from '$env/dynamic/public';
import { OAuthHandlerError, createOAuthCallbackHandler } from '$lib/server/oauth/callback-handler';

const tenant = env.MICROSOFT_TENANT_ID || publicEnv.PUBLIC_MICROSOFT_TENANT_ID || 'common';

const handler = createOAuthCallbackHandler({
	providerId: 'microsoft',
	providerName: 'Microsoft',
	tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`,
	buildTokenParams: (code) => {
		const configuredRedirect = env.MICROSOFT_REDIRECT_URI;
		const fallbackBase = env.BETTER_AUTH_URL || '';
		const redirectUri =
			configuredRedirect && configuredRedirect.startsWith('http')
				? configuredRedirect
				: fallbackBase
					? `${fallbackBase.replace(/\/$/, '')}/api/oauth/microsoft/callback`
					: '';

		return {
			client_id: env.MICROSOFT_CLIENT_ID || publicEnv.PUBLIC_MICROSOFT_CLIENT_ID || '',
			client_secret: env.MICROSOFT_CLIENT_SECRET || '',
			code,
			grant_type: 'authorization_code',
			redirect_uri: redirectUri,
			scope: 'Calendars.Read offline_access'
		};
	},
	deriveUserInfo: async (tokens) => {
		const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
			headers: {
				Authorization: `Bearer ${tokens.access_token}`,
				Accept: 'application/json'
			}
		});

		if (!userResponse.ok) {
			throw new OAuthHandlerError('user_info_failed');
		}

		const userInfo = (await userResponse.json()) as {
			id: string;
			mail?: string;
			userPrincipalName?: string;
			displayName?: string;
		};

		const calendarEmail = userInfo.mail || userInfo.userPrincipalName || 'unknown@microsoft.com';

		return {
			accountId: userInfo.id,
			calendarEmail,
			calendarMetadata: {
				displayName: userInfo.displayName || 'My Calendar',
				timezone: 'UTC',
				microsoftId: userInfo.id
			}
		};
	},
	scope: 'Calendars.Read offline_access',
	successRedirect: '/settings?success=microsoft_calendar_connected',
	errorRedirectBase: '/settings',
	logPrefix: '[Microsoft OAuth]'
});

export const GET = handler;
