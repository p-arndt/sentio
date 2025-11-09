import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invitation, team } from '$lib/server/db/schema';
import { gt, isNull, and, desc, eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
  try {
    if (!locals.user || !locals.user.isAdmin) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const now = new Date();

    const rows = await db
      .select({
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        type: invitation.type,
        teamId: invitation.teamId,
        teamName: team.name,
        createdBy: invitation.createdBy,
        expiresAt: invitation.expiresAt,
        createdAt: invitation.createdAt
      })
      .from(invitation)
      .leftJoin(team, eq(invitation.teamId, team.id))
      .where(and(isNull(invitation.acceptedAt), gt(invitation.expiresAt, now)))
      .orderBy(desc(invitation.createdAt))
      .limit(200);

    return json({ invitations: rows });
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
