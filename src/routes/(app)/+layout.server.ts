import { env } from '$env/dynamic/private';
import type { User } from '$lib';
import { TeamService } from '$lib/server/services/team.service';
import { redirect } from '@sveltejs/kit';
import packageJson from '../../../package.json';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// check better auth session
	if (!locals.user) {
		throw redirect(307, '/login');
	}

	const teams = await TeamService.getUserTeams(locals.user.id);

	return {
		user: locals.user,
		teams: teams.map((team) => ({ id: team.id, name: team.name })),
		vapidPublicKey: env.VAPID_PUBLIC_KEY || null,
		version: packageJson.version
	} as {
		user: User;
		teams: Array<{ id: string; name: string }>;
		vapidPublicKey: string | null;
		version: string;
	};
};
