import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { db } from '$lib/server/db';
import { user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Fetch user from database to check admin status
	const dbUser = await db
		.select()
		.from(user)
		.where(eq(user.id, locals.user.id))
		.limit(1);

	if (!dbUser[0]?.isAdmin) {
		throw redirect(303, '/');
	}

	return {
		user: locals.user,
		isAdmin: dbUser[0].isAdmin
	};
};
