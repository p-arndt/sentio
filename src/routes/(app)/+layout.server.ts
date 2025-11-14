import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import type { User } from '$lib';

export const load: LayoutServerLoad = async ({ locals }) => {
	// check better auth session
	if (!locals.user) {
		throw redirect(307, '/login');
	}

	return {
		user: locals.user,
		vapidPublicKey: env.VAPID_PUBLIC_KEY || null
	} as {
		user: User;
		vapidPublicKey: string | null;
	};
};
