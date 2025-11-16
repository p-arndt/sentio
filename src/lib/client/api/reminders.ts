import type { MoodReminder, MoodReminderCreate, MoodReminderUpdate } from '$lib/types';

export const remindersApi = {
	async create(reminder: MoodReminderCreate): Promise<MoodReminder> {
		const response = await fetch('/api/reminders', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(reminder)
		});

		if (!response.ok) {
			const error = (await response.json()) as { error?: string };
			throw new Error(error.error || 'Failed to create reminder');
		}

		const data = (await response.json()) as { data: MoodReminder };
		return data.data;
	},
	async update(id: string, updates: MoodReminderUpdate): Promise<MoodReminder> {
		const response = await fetch(`/api/reminders/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(updates)
		});

		if (!response.ok) {
			const error = (await response.json()) as { error?: string };
			throw new Error(error.error || 'Failed to update reminder');
		}

		const data = (await response.json()) as { data: MoodReminder };
		return data.data;
	},
	async delete(id: string): Promise<void> {
		const response = await fetch(`/api/reminders/${id}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			const error = (await response.json()) as { error?: string };
			throw new Error(error.error || 'Failed to delete reminder');
		}
	}
};
