import { env } from '$env/dynamic/private';
import { OAuthHandlerError, createOAuthCallbackHandler } from '$lib/server/oauth/callback-handler';

const handler = createOAuthCallbackHandler({
	providerId: 'microsoft',
	providerName: 'Microsoft',
	tokenUrl: 'https://login.microsoftonline.com/common/oauth2/v2.0/token',
	buildTokenParams: (code) => ({
		client_id: env.MICROSOFT_CLIENT_ID || '',
		client_secret: env.MICROSOFT_CLIENT_SECRET || '',
		code,
		grant_type: 'authorization_code',
		redirect_uri: env.MICROSOFT_REDIRECT_URI || '',
		scope: 'Calendars.Read offline_access'
	}),
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
	successRedirect: '/settings/calendar?success=microsoft_calendar_connected',
	errorRedirectBase: '/settings/calendar',
	logPrefix: '[Microsoft OAuth]'
});

export const GET = handler;
