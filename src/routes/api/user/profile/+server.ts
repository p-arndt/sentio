import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { UserService } from '$lib/server/services/user.service';

/**
 * GET /api/user/profile
 * Get current user's profile
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const user = await UserService.getUserById(locals.user.id);
		if (!user) {
			return json({ success: false, error: 'User not found' }, { status: 404 });
		}

		const preferences = await UserService.getUserPreferences(locals.user.id);

		return json({
			success: true,
			data: {
				user,
				preferences
			}
		});
	} catch (error) {
		console.error('Error fetching user profile:', error);
		return json({ success: false, error: 'Failed to fetch profile' }, { status: 500 });
	}
};

/**
 * PATCH /api/user/profile
 * Update current user's profile
 */
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ success: false, error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { name, image, timezone } = body;

		const user = await UserService.updateUserProfile(locals.user.id, {
			name,
			image,
			timezone
		});

		if (!user) {
			return json({ success: false, error: 'User not found' }, { status: 404 });
		}

		return json({ success: true, data: user });
	} catch (error) {
		console.error('Error updating profile:', error);
		return json({ success: false, error: 'Failed to update profile' }, { status: 500 });
	}
};
