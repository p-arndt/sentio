/**
 * Timezone utilities for converting between local and UTC times
 * All reminder times are stored in UTC in the database
 */

import type { MoodReminder } from '$lib/types';

/**
 * Convert local time to UTC
 * @param localTime HH:MM in local timezone
 * @returns HH:MM in UTC
 */
export function localToUTC(localTime: string): string {
	const [hours, minutes] = localTime.split(':').map(Number);
	const date = new Date();
	date.setHours(hours, minutes, 0, 0);

	const utcHours = date.getUTCHours().toString().padStart(2, '0');
	const utcMinutes = date.getUTCMinutes().toString().padStart(2, '0');

	return `${utcHours}:${utcMinutes}`;
}

/**
 * Convert UTC time to local time
 * @param utcTime HH:MM in UTC
 * @returns HH:MM in local timezone
 */
export function utcToLocal(utcTime: string): string {
	const [hours, minutes] = utcTime.split(':').map(Number);
	const date = new Date();
	date.setUTCHours(hours, minutes, 0, 0);

	const localHours = date.getHours().toString().padStart(2, '0');
	const localMinutes = date.getMinutes().toString().padStart(2, '0');

	return `${localHours}:${localMinutes}`;
}

/**
 * Format reminder days for display
 */
export function formatReminderDays(daysString: string): string {
	if (daysString === '0,1,2,3,4,5,6') {
		return 'Every day';
	}

	const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
	const selectedDays = daysString.split(',').map((d) => days[parseInt(d, 10)]);

	if (selectedDays.length === 0) {
		return 'Never';
	}

	if (selectedDays.length === 1) {
		return `Every ${selectedDays[0]}`;
	}

	return selectedDays.join(', ');
}

/**
 * Get the next trigger time for a reminder
 * reminder.time is stored in UTC
 */
export function getNextReminderTrigger(reminder: MoodReminder): Date | null {
	const now = new Date();
	const [hoursUTC, minutesUTC] = reminder.time.split(':').map(Number);
	const daysArray = reminder.daysOfWeek.split(',').map((d) => parseInt(d, 10));

	// Create a UTC date for today at the reminder time
	const nextTrigger = new Date();
	nextTrigger.setUTCHours(hoursUTC, minutesUTC, 0, 0);

	// If the time has already passed today, start checking from tomorrow
	if (nextTrigger <= now) {
		nextTrigger.setUTCDate(nextTrigger.getUTCDate() + 1);
	}

	// Find the next matching day (check up to 7 days)
	for (let i = 0; i < 7; i++) {
		if (daysArray.includes(nextTrigger.getDay())) {
			return nextTrigger;
		}
		nextTrigger.setUTCDate(nextTrigger.getUTCDate() + 1);
	}

	return null;
}
