import { env } from '$env/dynamic/public';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invitation } from '$lib/server/db/schema';
import { eq, isNull, and } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	let invitationEmail = '';
	let hasValidInvitation = false;

	// If an invitation token is provided, fetch the email from the invitation
	const token = url.searchParams.get('invitationToken');
	if (token) {
		try {
			const rows = await db
				.select()
				.from(invitation)
				.where(
					and(
						eq(invitation.token, token),
						isNull(invitation.acceptedAt)
					)
				)
				.limit(1);

			if (rows.length > 0) {
				// Check if invitation has not expired
				if (new Date() < rows[0].expiresAt) {
					invitationEmail = rows[0].email;
					hasValidInvitation = true;
				}
			}
		} catch (err) {
			console.error('Error fetching invitation:', err);
		}
	}

	// Only allow signup if PUBLIC_ALLOW_SIGNUP is true OR if there's a valid invitation token
	if (env.PUBLIC_ALLOW_SIGNUP !== 'true' && !hasValidInvitation) {
		throw redirect(303, '/login');
	}

	return { invitationEmail, hasValidInvitation };
};
