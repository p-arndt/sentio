import type { PageServerLoad } from './$types';
import { getEnabledProviders } from '$lib/server/auth-providers';

export const load: PageServerLoad = async () => {
	const enabledProviders = getEnabledProviders();

	return {
		enabledProviders
	};
};
