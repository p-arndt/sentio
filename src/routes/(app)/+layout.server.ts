import { env } from '$env/dynamic/private';
import type { User } from '$lib';
import { redirect } from '@sveltejs/kit';
import packageJson from '../../../package.json';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// check better auth session
	if (!locals.user) {
		throw redirect(307, '/login');
	}

	return {
		user: locals.user,
		vapidPublicKey: env.VAPID_PUBLIC_KEY || null,
		version: packageJson.version
	} as {
		user: User;
		vapidPublicKey: string | null;
		version: string;
	};
};
