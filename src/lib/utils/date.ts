// ==================== DATE UTILITIES ====================

/**
 * Convert a date string or Date object to a Date object
 */
export function toDate(date: string | Date | null | undefined): Date | null {
	if (!date) return null;
	if (date instanceof Date) return date;
	return new Date(date);
}

/**
 * Convert a date to ISO date string (YYYY-MM-DD) in local timezone
 */
export function toDateString(date: string | Date | null | undefined): string | null {
	if (!date) return null;
	const d = toDate(date);
	if (!d || isNaN(d.getTime())) return null;
	
	// Use local date to avoid timezone issues
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

/**
 * Check if two dates are the same day
 */
export function isSameDay(
	date1: string | Date | null | undefined,
	date2: string | Date | null | undefined
): boolean {
	const d1 = toDateString(date1);
	const d2 = toDateString(date2);
	return d1 !== null && d2 !== null && d1 === d2;
}

/**
 * Get the start of the week (Monday) for a given date
 */
export function getWeekStart(date: Date | string = new Date()): Date {
	const d = toDate(date) || new Date();
	const day = d.getDay();
	const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
	const weekStart = new Date(d);
	weekStart.setDate(diff);
	weekStart.setHours(0, 0, 0, 0);
	return weekStart;
}

/**
 * Get an array of dates for the week (7 days starting from Monday)
 */
export function getWeekDays(startDate: Date | string): Date[] {
	// Always start from Monday of the week
	const weekStart = getWeekStart(startDate);
	const days: Date[] = [];

	for (let i = 0; i < 7; i++) {
		const day = new Date(weekStart);
		day.setDate(weekStart.getDate() + i);
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
export function isToday(date: Date | string | null | undefined): boolean {
	return isSameDay(date, new Date());
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
export function formatDate(
	date: Date | string | null | undefined,
	options?: Intl.DateTimeFormatOptions
): string {
	const d = toDate(date);
	if (!d || isNaN(d.getTime())) return '';

	const defaultOptions: Intl.DateTimeFormatOptions = {
		month: 'short',
		day: 'numeric',
		year: 'numeric'
	};

	return d.toLocaleDateString('en-US', options || defaultOptions);
}

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
	const day = date.getDay();
	return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Filter week days to exclude weekends if specified
 */
export function filterWeekDays(days: Date[], includeWeekends: boolean = true): Date[] {
	if (includeWeekends) return days;
	return days.filter((day) => !isWeekend(day));
}

/**
 * Get all days in a month
 */
export function getMonthDays(date: Date | string): Date[] {
	const d = toDate(date) || new Date();
	const year = d.getFullYear();
	const month = d.getMonth();
	
	const lastDay = new Date(year, month + 1, 0);
	
	const days: Date[] = [];
	for (let i = 1; i <= lastDay.getDate(); i++) {
		days.push(new Date(year, month, i));
	}
	
	return days;
}

/**
 * Get all days in a month with padding for the full grid (6 weeks)
 */
export function getMonthGrid(date: Date | string): Date[] {
	const d = toDate(date) || new Date();
	const year = d.getFullYear();
	const month = d.getMonth();
	
	const firstDay = new Date(year, month, 1);
	
	// Start from Monday before the first day of month
	const startDay = getWeekStart(firstDay);
	const days: Date[] = [];
	
	const current = new Date(startDay);
	// Generate 6 weeks worth of days
	for (let i = 0; i < 42; i++) {
		days.push(new Date(current));
		current.setDate(current.getDate() + 1);
	}
	
	return days;
}

/**
 * Get the month and year for display
 */
export function getMonthYear(date: Date | string): string {
	const d = toDate(date) || new Date();
	return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

