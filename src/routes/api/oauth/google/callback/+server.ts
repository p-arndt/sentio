import { createOAuthCallbackHandler } from '$lib/server/oauth/callback-handler';
import { env } from '$env/dynamic/private';

const handler = createOAuthCallbackHandler({
	providerId: 'google',
	providerName: 'Google',
	tokenUrl: 'https://oauth2.googleapis.com/token',
	buildTokenParams: (code) => ({
		client_id: env.GOOGLE_CLIENT_ID || '',
		client_secret: env.GOOGLE_CLIENT_SECRET || '',
		code,
		grant_type: 'authorization_code',
		redirect_uri: env.GOOGLE_REDIRECT_URI || ''
	}),
	deriveUserInfo: async (tokens) => {
		const idTokenParts = tokens.id_token?.split('.') ?? [];
		const decodedPayload = idTokenParts[1]
			? JSON.parse(Buffer.from(idTokenParts[1], 'base64').toString())
			: null;
		const calendarEmail = decodedPayload?.email ?? 'unknown@google.com';

		return {
			accountId: calendarEmail,
			calendarEmail,
			calendarId: 'primary',
			calendarMetadata: {
				displayName: decodedPayload?.name ?? 'My Calendar',
				timezone: 'UTC'
			}
		};
	},
	scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
	successRedirect: '/settings?success=google_calendar_connected',
	errorRedirectBase: '/settings',
	logPrefix: '[Google OAuth]',
	extraAccountFields: (_userInfo, tokens) => ({
		idToken: tokens.id_token
	})
});

export const GET = handler;
