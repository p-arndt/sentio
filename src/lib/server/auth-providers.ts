import { getAuthProvider } from './auth-config';

export type EnabledAuthProviders = {
	email: boolean;
	oidc: boolean;
};

/**
 * Determines which auth providers are enabled based on configuration
 */
export function getEnabledProviders(): EnabledAuthProviders {
	const provider = getAuthProvider();

	return {
		email: true, // Always available unless explicitly disabled
		oidc: provider === 'oidc'
	};
}
