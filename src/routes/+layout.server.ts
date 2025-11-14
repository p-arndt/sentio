import { UserService } from '$lib/server/services/user.service';
import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url, request }) => {
	if (url.pathname === '/' && !url.searchParams.has('init') && locals.user) {
		// Only redirect if this appears to be a fresh entry (no internal referer)
		// This prevents redirect loops when navigating within the app
		const referer = request.headers.get('referer');
		const isExternalEntry = !referer || !referer.includes(url.hostname);

		if (isExternalEntry) {
			const preferences = await UserService.getUserPreferences(locals.user.id);
			const startPage = preferences?.settings?.startPage || '/';

			// Only redirect if they have a different startPage set
			// Add `?init=true` to prevent re-triggering on page load
			if (startPage !== '/') {
				throw redirect(307, `${startPage}?init=true`);
			}
		}
	}
};
