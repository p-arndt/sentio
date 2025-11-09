import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { invitation } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ params, locals }) => {
  try {
    if (!locals.user || !locals.user.isAdmin) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    const id = params.id;
    if (!id) return json({ error: 'Missing id' }, { status: 400 });

    await db.delete(invitation).where(eq(invitation.id, id));

    return json({ success: true });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
};
