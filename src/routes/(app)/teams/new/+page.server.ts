import { redirect, error } from '@sveltejs/kit';

export async function load({ locals }) {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	// Only admins can create teams
	if (!locals.user.isAdmin) {
		throw error(403, 'Only administrators can create teams');
	}

	return {
		user: locals.user
	};
}
