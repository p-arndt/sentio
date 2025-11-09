import { building } from '$app/environment';
import { EMOTION_DATA } from '$lib/data/emotion-data';
import { db } from '$lib/server/db';
import { emotion, user as userTable } from '$lib/server/db/schema';
import { redirect, type Handle, type ServerInit } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { eq } from 'drizzle-orm';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { auth } from './auth';

let initialized = false;
let hasAdmin = false;

export const markAdminInitialized = () => {
	hasAdmin = true;
};

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

	// Check if an admin user exists
	if (!initialized) {
		const admins = await db.select().from(userTable).where(eq(userTable.isAdmin, true));
		hasAdmin = admins.length > 0;
		if (hasAdmin) {
			console.log('✓ Admin user found');
		} else {
			console.log('⚠ No admin user found - initialization required');
		}
		initialized = true;
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
	const unprotectedRoutes = ['/init', '/invitations'];
	if (unprotectedRoutes.some((route) => event.url.pathname.startsWith(route))) {
		return resolve(event);
	}

	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	// If no admin exists and not on init route, redirect to init
	if (!hasAdmin && event.url.pathname !== '/init') {
		return redirect(302, '/init');
	}

	// If admin exists but not on init route, proceed with normal auth checks
	if (hasAdmin) {
		if (
			!session?.user?.id &&
			!event.url.pathname.startsWith('/login') &&
			event.url.pathname !== '/register'
		) {
			return redirect(302, '/login');
		}

		if (session?.user?.id && event.url.pathname === '/login') {
			return redirect(302, '/');
		}
	}

	return resolve(event);
};

export const handle = sequence(betterAuthHandle, authHandle);
