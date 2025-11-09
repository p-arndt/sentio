import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invitation, team, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendInvitationEmail } from '$lib/server/services/email';
import { generateRandomString } from '$lib/utils';

export const POST: RequestHandler = async ({ request, locals, params }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { email, teamId: bodyTeamId } = await request.json();
		const { teamId } = params;

		// Use teamId from params, validate with body if provided
		const actualTeamId = bodyTeamId || teamId;

		if (!email || !actualTeamId) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		// Check if team exists
		const teamRecord = await db.select().from(team).where(eq(team.id, actualTeamId)).limit(1);
		if (teamRecord.length === 0) {
			return json({ error: 'Team not found' }, { status: 404 });
		}

		// Check if user is team owner or platform admin
		const isTeamOwner = teamRecord[0].createdBy === locals.user.id;
		const isAdmin = locals.user.isAdmin;

		if (!isTeamOwner && !isAdmin) {
			return json({ error: 'Only team owners and admins can invite members' }, { status: 403 });
		}

		// Generate token
		const token = generateRandomString(32);
		const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

		// Create invitation
		await db.insert(invitation).values({
			email,
			token,
			type: 'team',
			teamId: actualTeamId,
			createdBy: locals.user.id,
			expiresAt
		});

		// Get inviting user and team info
		const invitingUser = await db.select().from(user).where(eq(user.id, locals.user.id)).limit(1);
		const invitationLink = `${new URL(request.url).origin}/invitations/${token}`;

		// Send email
		const emailSent = await sendInvitationEmail(
			email,
			teamRecord[0].name,
			invitationLink,
			invitingUser[0]?.name || 'A team member'
		);

		if (!emailSent) {
			return json({ error: 'Failed to send invitation email' }, { status: 500 });
		}

		return json({ success: true, message: 'Invitation sent successfully' }, { status: 201 });
	} catch (error) {
		console.error('Error creating invitation:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
