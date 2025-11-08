import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { emotion } from '$lib/server/db/schema';

export const GET: RequestHandler = async () => {
	const emotions = await db.select().from(emotion);
	return json({ emotions });
};
