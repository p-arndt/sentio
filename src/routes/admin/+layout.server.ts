import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { settings, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';

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

	const smtpHostResult = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'smtpHost'))
		.limit(1);

	const smtpPortResult = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'smtpPort'))
		.limit(1);

	const smtpFromEmailResult = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'smtpFromEmail'))
		.limit(1);

	const hasSmtpHost = Boolean(smtpHostResult[0]?.value);
	const hasSmtpPort = Boolean(smtpPortResult[0]?.value);
	const hasFromEmail = Boolean(smtpFromEmailResult[0]?.value);

	const emailConfigured = hasSmtpHost && hasSmtpPort && hasFromEmail;

	return {
		user: locals.user,
		isAdmin: dbUser[0].isAdmin,
		emailConfigured
	};
};
