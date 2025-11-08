/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
	return new Date(d.setDate(diff));
}

/**
 * Get an array of dates for the current week (Monday to Friday)
 */
export function getWeekDays(startDate: Date): Date[] {
	const days: Date[] = [];
	const start = getWeekStart(startDate);
	
	// Get Monday to Friday (5 working days)
	for (let i = 0; i < 5; i++) {
		const day = new Date(start);
		day.setDate(start.getDate() + i);
		days.push(day);
	}
	
	return days;
}

/**
 * Get the previous week's start date
 */
export function getPreviousWeek(date: Date): Date {
	const prev = new Date(date);
	prev.setDate(date.getDate() - 7);
	return prev;
}

/**
 * Get the next week's start date
 */
export function getNextWeek(date: Date): Date {
	const next = new Date(date);
	next.setDate(date.getDate() + 7);
	return next;
}

/**
 * Check if a date is today
 */
export function isToday(date: Date): boolean {
	const today = new Date();
	return date.toDateString() === today.toDateString();
}

/**
 * Check if a date is in the current week
 */
export function isCurrentWeek(date: Date): boolean {
	const today = new Date();
	const weekStart = getWeekStart(today);
	const weekEnd = new Date(weekStart);
	weekEnd.setDate(weekStart.getDate() + 6);
	
	return date >= weekStart && date <= weekEnd;
}

/**
 * Format date for display
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
	const defaultOptions: Intl.DateTimeFormatOptions = {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	};
	
	return date.toLocaleDateString('en-US', options || defaultOptions);
}