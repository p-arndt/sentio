import { getRequestEvent } from '$app/server';
import { db } from '$lib/server/db';
import { account, session, user, verification } from '$lib/server/db/schema';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';

export const auth = betterAuth({
	advanced: {
		database: {
			generateId: false
		}
	},
	emailAndPassword: {
		enabled: true
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
	plugins: [sveltekitCookies(getRequestEvent)] // make sure this is the last plugin in the array
});
