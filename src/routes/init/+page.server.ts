import { redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db';
import { user as userTable } from '$lib/server/db/schema';
import { auth } from '../../auth';
import { markAdminInitialized } from '../../hooks.server';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is already logged in
	if (locals.user) {
		throw redirect(303, '/');
	}

	// Check if any admin exists
	const admins = await db.select().from(userTable).where(eq(userTable.isAdmin, true));
	if (admins.length > 0) {
		// Admin already exists, redirect to login
		throw redirect(303, '/login');
	}
};

export const actions = {
	create: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;
		const name = formData.get('name') as string;

		// Validation
		if (!email || !password || !name) {
			return {
				success: false,
				error: 'Email, password, and name are required'
			};
		}

		if (password.length < 8) {
			return {
				success: false,
				error: 'Password must be at least 8 characters long'
			};
		}

		if (!email.includes('@')) {
			return {
				success: false,
				error: 'Invalid email format'
			};
		}

		try {
			// Create admin user using better-auth
			const response = await auth.api.signUpEmail({
				body: {
					email,
					password,
					name
				}
			});

			if (!response || !response.user) {
				return {
					success: false,
					error: 'Failed to create admin user'
				};
			}

			// Set isAdmin to true
			await db.update(userTable).set({ isAdmin: true }).where(eq(userTable.email, email));

			markAdminInitialized();

			return {
				success: true,
				message: 'Admin user created successfully. Please log in.'
			};
		} catch (error) {
			const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
			return {
				success: false,
				error: `Failed to create admin user: ${errorMessage}`
			};
		}
	}
} satisfies Actions;
