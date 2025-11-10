import { env } from '$env/dynamic/private';

export type AuthProviderType = 'email' | 'oidc';

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
	const validProviders: AuthProviderType[] = ['email', 'oidc'];
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
	if (provider !== 'oidc') {
		return null;
	}

	return getOIDCConfig();
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
 * Determines if email/password auth should be enabled
 * Always enabled by default when using OAuth, can be explicitly disabled
 * This ensures invitations work correctly by allowing email signup as fallback
 * Set to 'true' to disable email auth (OAuth-only mode)
 */
export function isEmailAuthEnabled(): boolean {
	const disabled = process.env.EMAIL_AUTH_DISABLED === 'true';
	return !disabled;
}
