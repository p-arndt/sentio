import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invitation, teamMember } from '$lib/server/db/schema';
import { eq, and, isNull } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { token } = await request.json();

		if (!token) {
			return json({ error: 'Missing invitation token' }, { status: 400 });
		}

		// Find invitation
		const invitationRecord = await db
			.select()
			.from(invitation)
			.where(
				and(
					eq(invitation.token, token),
					// Make sure invitation hasn't been accepted yet
					isNull(invitation.acceptedAt)
				)
			)
			.limit(1);

		if (invitationRecord.length === 0) {
			return json({ error: 'Invalid or expired invitation' }, { status: 404 });
		}

		const inv = invitationRecord[0];

		// Check if invitation has expired
		if (new Date() > inv.expiresAt) {
			return json({ error: 'Invitation has expired' }, { status: 400 });
		}

		// Check if email matches
		if (inv.email !== locals.user.email) {
			return json(
				{ error: 'This invitation is for a different email address' },
				{ status: 403 }
			);
		}

		// Handle general (platform-wide) invitations
		if (inv.type === 'general') {
			// Just mark as accepted - no team assignment
			await db
				.update(invitation)
				.set({
					acceptedAt: new Date(),
					acceptedBy: locals.user.id,
					updatedAt: new Date()
				})
				.where(eq(invitation.id, inv.id));

			return json(
				{ success: true, message: 'Invitation accepted successfully', type: 'general' },
				{ status: 200 }
			);
		}

		// Handle team-specific invitations
		if (!inv.teamId) {
			return json({ error: 'Invalid invitation' }, { status: 400 });
		}

		// Check if user is already a member of the team
		const existingMember = await db
			.select()
			.from(teamMember)
			.where(
				and(
					eq(teamMember.teamId, inv.teamId),
					eq(teamMember.userId, locals.user.id)
				)
			)
			.limit(1);

		if (existingMember.length > 0) {
			return json({ error: 'You are already a member of this team' }, { status: 400 });
		}

		// Add user to team
		await db.insert(teamMember).values({
			teamId: inv.teamId,
			userId: locals.user.id,
			role: 'member'
		});

		// Mark invitation as accepted
		await db
			.update(invitation)
			.set({
				acceptedAt: new Date(),
				acceptedBy: locals.user.id,
				updatedAt: new Date()
			})
			.where(eq(invitation.id, inv.id));

		return json(
			{ success: true, message: 'Invitation accepted successfully', teamId: inv.teamId, type: 'team' },
			{ status: 200 }
		);
	} catch (error) {
		console.error('Error accepting invitation:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
