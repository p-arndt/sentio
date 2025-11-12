import { env } from '$env/dynamic/private';
import { db } from '$lib/server/db';
import { settings, user } from '$lib/server/db/schema';
import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { LayoutServerLoad } from './$types';
import { isEmailConfigured } from '$lib/server/services/email';

export const load: LayoutServerLoad = async ({ locals }) => {
	// Check minimal SMTP config presence
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Fetch user from database to check admin status
	const dbUser = await db.select().from(user).where(eq(user.id, locals.user.id)).limit(1);

	if (!dbUser[0]?.isAdmin) {
		throw redirect(303, '/');
	}

	const emailConfigured = await isEmailConfigured();
	return {
		user: locals.user,
		isAdmin: dbUser[0].isAdmin,
		emailConfigured
	};
};
