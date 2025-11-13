import type { LayoutServerLoad } from './$types';
import { env } from '$env/dynamic/private';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user || null,
		vapidPublicKey: env.VAPID_PUBLIC_KEY || null
	};
};
