import { building } from '$app/environment';
import { db } from '$lib/server/db';
import { emotion } from '$lib/server/db/schema';
import { redirect, type Handle, type ServerInit } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { auth } from './auth';
import { EMOTION_DATA } from '$lib/data/emotion-data';

export const init: ServerInit = async () => {
	try {
		await db.execute(`SELECT NOW()`);
		console.log('Database connected successfully');
	} catch (error) {
		console.error('Failed to connect to database:', error);
		throw error;
	}

	await migrate(db, { migrationsFolder: 'drizzle' });
	console.log('Migrations completed successfully');

	try {
		const existingEmotions = await db.select().from(emotion);
		if (existingEmotions.length === 0) {
			console.log('Seeding default emotions...');
			await db.insert(emotion).values(EMOTION_DATA);
			console.log(`✓ Seeded ${EMOTION_DATA.length} emotions`);
		} else {
			console.log(`✓ Emotions already exist (${existingEmotions.length} found)`);
		}
	} catch (error) {
		console.error('Failed to seed emotions:', error);
	}
};

export const betterAuthHandle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.session = session.session;
		event.locals.user = session.user;
	}

	return svelteKitHandler({ event, resolve, auth, building });
};

export const authHandle: Handle = async ({ event, resolve }) => {
	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (!session?.user?.id && !event.url.pathname.startsWith('/login')) {
		return redirect(302, '/login');
	}

	if (session?.user?.id && event.url.pathname === '/login') {
		return redirect(302, '/');
	}

	return resolve(event);
};

export const handle = sequence(betterAuthHandle, authHandle);
