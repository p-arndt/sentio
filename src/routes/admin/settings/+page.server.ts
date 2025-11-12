import { db } from '$lib/server/db';
import { settings } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { env } from '$env/dynamic/private';

export const load: PageServerLoad = async () => {
	// Get settings from database
	const showWeekendsResult = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'showWeekends'))
		.limit(1);

	let showWeekends = true; // Default value

	if (showWeekendsResult.length > 0) {
		showWeekends = showWeekendsResult[0].value === 'true';
	} else {
		// Create default setting
		await db.insert(settings).values({
			key: 'showWeekends',
			value: 'true'
		});
	}

	// Get email settings
	const smtpHostResult = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'smtpHost'))
		.limit(1);

	const smtpPortResult = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'smtpPort'))
		.limit(1);

	const smtpUsernameResult = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'smtpUsername'))
		.limit(1);

	const smtpPasswordResult = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'smtpPassword'))
		.limit(1);

	const smtpFromEmailResult = await db
		.select()
		.from(settings)
		.where(eq(settings.key, 'smtpFromEmail'))
		.limit(1);

	// Allow environment variables to provide defaults when DB entries are not set.
	const envHost = env.SMTP_HOST;
	const envPort = env.SMTP_PORT;
	const envUsername = env.SMTP_USERNAME;
	const envPassword = env.SMTP_PASSWORD;
	const envFrom = env.SMTP_FROM;

	const smtpHostValue = smtpHostResult[0]?.value || envHost || '';
	const smtpPortValue = smtpPortResult[0]?.value || envPort || '587';
	const smtpUsernameValue = smtpUsernameResult[0]?.value || envUsername || '';
	const smtpFromEmailValue = smtpFromEmailResult[0]?.value || envFrom || '';

	const smtpFromEnv = {
		host: !smtpHostResult[0]?.value && Boolean(envHost),
		port: !smtpPortResult[0]?.value && Boolean(envPort),
		username: !smtpUsernameResult[0]?.value && Boolean(envUsername),
		password: !smtpPasswordResult[0]?.value && Boolean(envPassword),
		fromEmail: !smtpFromEmailResult[0]?.value && Boolean(envFrom)
	};

	return {
		settings: {
			showWeekends,
			smtpHost: smtpHostValue,
			smtpPort: smtpPortValue,
			smtpUsername: smtpUsernameValue,
			smtpPassword: '',
			smtpFromEmail: smtpFromEmailValue,
			smtpFromEnv
		}
	};
};

export const actions: Actions = {
	updateSettings: async ({ request }) => {
		const formData = await request.formData();
		const showWeekendsValue = formData.get('showWeekends');
		const showWeekends = showWeekendsValue === 'true';

		try {
			// Update or insert setting
			const existing = await db
				.select()
				.from(settings)
				.where(eq(settings.key, 'showWeekends'))
				.limit(1);

			if (existing.length > 0) {
				await db
					.update(settings)
					.set({
						value: showWeekends.toString(),
						updatedAt: new Date()
					})
					.where(eq(settings.key, 'showWeekends'));
			} else {
				await db.insert(settings).values({
					key: 'showWeekends',
					value: showWeekends.toString()
				});
			}

			return { success: true };
		} catch (error) {
			console.error('Error updating settings:', error);
			return fail(500, { error: 'Failed to update settings' });
		}
	},

	updateEmailSettings: async ({ request }) => {
		const formData = await request.formData();
		const smtpHost = formData.get('smtpHost')?.toString() || '';
		const smtpPort = formData.get('smtpPort')?.toString() || '587';
		const smtpUsername = formData.get('smtpUsername')?.toString() || '';
		const smtpPassword = formData.get('smtpPassword')?.toString() || '';
		const smtpFromEmail = formData.get('smtpFromEmail')?.toString() || '';

		// Accept either plain email or "Name <email@example.com>". Validate the inner email.
		// This regex captures the email part from either format.
		const emailMatch = smtpFromEmail.match(/(?:.*<)?\s*([^<>\s@]+@[^<>\s@]+\.[^<>\s@]+)\s*>?$/);
		if (!emailMatch) {
			console.warn('Invalid from email format provided:', smtpFromEmail);
			return fail(400, { error: 'Invalid From address. Use email or "Name <email@example.com>".' });
		}
		// store the original string (may include display name) but validate email part is ok
		const fromEmailNormalized = smtpFromEmail;

		try {
			const settingsToUpdate = [
				{ key: 'smtpHost', value: smtpHost },
				{ key: 'smtpPort', value: smtpPort },
				{ key: 'smtpUsername', value: smtpUsername },
				{ key: 'smtpPassword', value: smtpPassword },
				{ key: 'smtpFromEmail', value: fromEmailNormalized }
			];

			for (const setting of settingsToUpdate) {
				const existing = await db
					.select()
					.from(settings)
					.where(eq(settings.key, setting.key))
					.limit(1);

				if (existing.length > 0) {
					await db
						.update(settings)
						.set({
							value: setting.value,
							updatedAt: new Date()
						})
						.where(eq(settings.key, setting.key));
				} else {
					await db.insert(settings).values({
						key: setting.key,
						value: setting.value
					});
				}
			}

			return { success: true };
		} catch (error) {
			console.error('Error updating email settings:', error);
			return fail(500, { error: 'Failed to update email settings' });
		}
	}
};
