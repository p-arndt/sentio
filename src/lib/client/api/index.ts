import { moodsApi } from '$lib/client/api/moods';
import { remindersApi } from '$lib/client/api/reminders';

export const api = {
	moods: moodsApi,
	reminders: remindersApi,
	async saveUserPreferences(payload: {
		lastQuickMoodTargets: { personal: boolean; teamIds: string[] };
	}) {
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
