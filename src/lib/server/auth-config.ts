import { env } from '$env/dynamic/private';

export type AuthProviderType = 'email' | 'oidc' | 'google' | 'microsoft';

/**
 * Gets environment variable (works with Svelte's env helper)
 */
function getEnvVar(name: string): string | undefined {
	return env[name as keyof typeof env];
}

/**
 * Parses the AUTH_PROVIDER environment variable
 * Defaults to 'email' if not set or invalid
 */
export function getAuthProvider(): AuthProviderType {
	const provider = (getEnvVar('AUTH_PROVIDER') || 'email').toLowerCase() as AuthProviderType;

	// Validate provider
	const validProviders: AuthProviderType[] = ['email', 'oidc', 'google', 'microsoft'];
	if (!validProviders.includes(provider)) {
		console.warn(
			`Invalid AUTH_PROVIDER: ${provider}. Must be one of: ${validProviders.join(', ')}. Defaulting to 'email'.`
		);
		return 'email';
	}

	return provider;
}

/**
 * Returns OAuth configuration for the genericOAuth plugin
 * Works for any OIDC provider including Azure, Keycloak, Auth0, etc.
 */
export function getOAuthConfig(provider: AuthProviderType): { config: unknown[] } | null {
	if (provider === 'oidc') {
		return getOIDCConfig();
	} else if (provider === 'google') {
		return getGoogleOAuthConfig();
	} else if (provider === 'microsoft') {
		return getMicrosoftOAuthConfig();
	}

	return null;
}

/**
 * Gets OIDC (Generic OpenID Connect) provider configuration
 * Works for any OIDC-compliant provider including:
 * - Azure Entra ID (Microsoft)
 * - Keycloak
 * - Auth0
 * - Any other OIDC provider
 *
 * Uses discoveryUrl for auto-discovery of OIDC endpoints
 */
function getOIDCConfig(): { config: unknown[] } | null {
	const clientId = getEnvVar('OIDC_CLIENT_ID');
	const clientSecret = getEnvVar('OIDC_CLIENT_SECRET');
	const issuer = getEnvVar('OIDC_ISSUER');

	if (!clientId || !clientSecret || !issuer) {
		console.warn(
			'OIDC auth provider selected but missing required env vars: OIDC_CLIENT_ID, OIDC_CLIENT_SECRET, OIDC_ISSUER'
		);
		return null;
	}

	return {
		config: [
			{
				providerId: 'oidc',
				clientId,
				clientSecret,
				discoveryUrl: `${issuer}/.well-known/openid-configuration`,
				scopes: ['openid', 'email', 'profile']
			}
		]
	};
}

/**
 * Gets Google OAuth configuration for user authentication
 * Also supports calendar scope for calendar integration
 */
function getGoogleOAuthConfig(): { config: unknown[] } | null {
	const clientId = getEnvVar('GOOGLE_CLIENT_ID');
	const clientSecret = getEnvVar('GOOGLE_CLIENT_SECRET');
	const redirectUri = getEnvVar('GOOGLE_REDIRECT_URI');

	if (!clientId || !clientSecret || !redirectUri) {
		console.warn(
			'Google auth provider selected but missing required env vars: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI'
		);
		return null;
	}

	return {
		config: [
			{
				providerId: 'google',
				clientId,
				clientSecret,
				redirectURI: redirectUri,
				scopes: ['openid', 'email', 'profile', 'https://www.googleapis.com/auth/calendar.readonly'],
				authorizationParams: {
					access_type: 'offline',
					prompt: 'consent'
				}
			}
		]
	};
}

/**
 * Gets Microsoft OAuth configuration for user authentication
 * Also supports Microsoft Graph Calendar scope for calendar integration
 */
function getMicrosoftOAuthConfig(): { config: unknown[] } | null {
	const clientId = getEnvVar('MICROSOFT_CLIENT_ID');
	const clientSecret = getEnvVar('MICROSOFT_CLIENT_SECRET');
	const redirectUri = getEnvVar('MICROSOFT_REDIRECT_URI');

	if (!clientId || !clientSecret || !redirectUri) {
		console.warn(
			'Microsoft auth provider selected but missing required env vars: MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, MICROSOFT_REDIRECT_URI'
		);
		return null;
	}

	return {
		config: [
			{
				providerId: 'microsoft',
				clientId,
				clientSecret,
				redirectURI: redirectUri,
				scopes: ['openid', 'email', 'profile', 'offline_access', 'Calendars.Read'],

				authorizationParams: {
					response_mode: 'query',
					prompt: 'consent' 
				}
			}
		]
	};
}

/**
 * Determines if email/password auth should be enabled
 * Always enabled by default when using OAuth, can be explicitly disabled
 * This ensures invitations work correctly by allowing email signup as fallback
 * Set to 'true' to disable email auth (OAuth-only mode)
 */
export function isEmailAuthEnabled(): boolean {
	const disabled = process.env.EMAIL_AUTH_DISABLED === 'true';
	return !disabled;
}
