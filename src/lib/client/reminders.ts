/**
 * Client-side reminder management
 */

import type { MoodReminder, MoodReminderCreate, MoodReminderUpdate } from '$lib/types';

// Re-export timezone utilities for convenience
export {
	formatReminderDays,
	getNextReminderTrigger,
	utcToLocal,
	localToUTC
} from '$lib/utils/timezone';

/**
 * Create a new reminder (time should be in local timezone)
 */
export async function createReminder(reminder: MoodReminderCreate): Promise<MoodReminder> {
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
}

/**
 * Update an existing reminder (time should be in local timezone)
 */
export async function updateReminder(
	id: string,
	updates: MoodReminderUpdate
): Promise<MoodReminder> {
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
}

/**
 * Delete a reminder
 */
export async function deleteReminder(id: string): Promise<void> {
	const response = await fetch(`/api/reminders/${id}`, {
		method: 'DELETE'
	});

	if (!response.ok) {
		const error = (await response.json()) as { error?: string };
		throw new Error(error.error || 'Failed to delete reminder');
	}
}
