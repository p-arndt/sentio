import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invitation, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendInvitationEmail } from '$lib/server/services/email';
import { generateRandomString } from '$lib/utils';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user || !locals.user.isAdmin) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { email } = await request.json();

		if (!email) {
			return json({ error: 'Missing email address' }, { status: 400 });
		}

		// Generate token
		const token = generateRandomString(32);
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		// Create general invitation
		await db.insert(invitation).values({
			email,
			token,
			type: 'general',
			teamId: null, // No specific team for general invitations
			createdBy: locals.user.id,
			expiresAt
		});

		// Get inviting user
		const invitingUser = await db.select().from(user).where(eq(user.id, locals.user.id)).limit(1);
		const invitationLink = `${new URL(request.url).origin}/invitations/${token}`;

		// Send email - generic platform invitation
		const emailSent = await sendInvitationEmail(
			email,
			'Platform Access',
			invitationLink,
			invitingUser[0]?.name || 'An admin',
			true // isGeneralInvitation flag
		);

		if (!emailSent) {
			return json({ error: 'Failed to send invitation email' }, { status: 500 });
		}

		return json({ success: true, message: 'Invitation sent successfully' }, { status: 201 });
	} catch (error) {
		console.error('Error creating general invitation:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
