import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { account, session, user, verification } from '$lib/server/db/schema';
import { getAuthProvider, getOAuthConfig, isEmailAuthEnabled } from '$lib/server/auth-config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { genericOAuth } from 'better-auth/plugins';

const authProvider = getAuthProvider();
const oauthConfig = getOAuthConfig(authProvider);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const plugins: any[] = [sveltekitCookies(getRequestEvent)];

// Add OAuth plugin if configured
if (oauthConfig) {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	plugins.push(genericOAuth(oauthConfig as any));
}

export const auth = betterAuth({
	advanced: {
		database: {
			generateId: false
		}
	},
	emailAndPassword: {
		enabled: isEmailAuthEnabled()
	},
	user: {
		additionalFields: {
			isAdmin: {
				type: 'boolean',
				defaultValue: false,
				required: false
			}
		}
	},
	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user: user,
			session: session,
			account: account,
			verification: verification
		}
	}),
	plugins: plugins
});
