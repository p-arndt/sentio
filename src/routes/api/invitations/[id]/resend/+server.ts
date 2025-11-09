import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invitation, user } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendInvitationEmail } from '$lib/server/services/email';

export const POST: RequestHandler = async ({ params, request, locals }) => {
  try {
    if (!locals.user || !locals.user.isAdmin) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    if (!id) return json({ error: 'Missing id' }, { status: 400 });

    const rows = await db.select().from(invitation).where(eq(invitation.id, id)).limit(1);
    if (rows.length === 0) return json({ error: 'Invitation not found' }, { status: 404 });

    const inv = rows[0];

    // Build invitation link
    const invitationLink = `${new URL(request.url).origin}/invitations/${inv.token}`;

    // Get inviting user for name
    const invitingUser = await db.select().from(user).where(eq(user.id, inv.createdBy)).limit(1);

    const emailSent = await sendInvitationEmail(
      inv.email,
      inv.type === 'team' ? 'Team Invitation' : 'Platform Access',
      invitationLink,
      invitingUser[0]?.name || 'An admin',
      inv.type === 'general'
    );

    if (!emailSent) {
      return json({ error: 'Failed to resend invitation email' }, { status: 500 });
    }

    return json({ success: true });
  } catch (error) {
    console.error('Error resending invitation:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
