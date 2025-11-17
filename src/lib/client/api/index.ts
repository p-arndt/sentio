import { moodsApi } from '$lib/client/api/moods';
import { remindersApi } from '$lib/client/api/reminders';
import type { UserSettings } from '$lib/types';

export const api = {
	moods: moodsApi,
	reminders: remindersApi,
	async saveUserPreferences(payload: Partial<UserSettings>) {
		const response = await fetch('/api/user/preferences', {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(payload)
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Failed to update user preferences');
		}

		return response.json();
	}
};
