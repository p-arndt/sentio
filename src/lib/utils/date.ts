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
 * Get an array of dates for the week (7 days starting from Monday) when the given
 * start date is a UTC week start (midnight UTC). This returns Date objects at the
 * local timezone midnight for each Y-M-D corresponding to the UTC week start.
 */
export function getWeekDaysFromUTCStart(startDate: Date | string): Date[] {
	const d = toDate(startDate) || new Date();
	// Use the UTC YMD values to construct local midnight Date objects
	const year = d.getUTCFullYear();
	const month = d.getUTCMonth();
	const day = d.getUTCDate();
	const days: Date[] = [];
	for (let i = 0; i < 7; i++) {
		days.push(new Date(year, month, day + i));
	}
	return days;
}

export function getCurrentWeekStart(): Date {
	return getWeekStart(new Date());
}


export function getCurrentWeekEnd(): Date {
	const start = getCurrentWeekStart();
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	end.setHours(23, 59, 59, 999);
	return end;
}

/**
 * Get the previous week's start date
 */
export function getPreviousWeek(_date?: Date): Date {
	const date = _date || new Date();
	const prev = new Date(date);
	prev.setDate(date.getDate() - 7);
	return prev;
}

export function getDaysBefore(days: number, _date?: Date): Date {
	const date = _date || new Date();
	const prev = new Date(date);
	prev.setDate(date.getDate() - days);
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

// ==================== ENHANCED DATE FORMATTING ====================

/**
 * Format day name (e.g., "Mon" or "Monday")
 */
export function formatDayName(
	date: Date | string | null | undefined,
	format: 'short' | 'long' = 'short'
): string {
	const d = toDate(date);
	if (!d || isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-US', { weekday: format });
}

/**
 * Format day date (e.g., "Jan 15")
 */
export function formatDayDate(date: Date | string | null | undefined): string {
	const d = toDate(date);
	if (!d || isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Format month and year (e.g., "January 2024")
 */
export function formatMonthYear(date: Date | string | null | undefined): string {
	const d = toDate(date);
	if (!d || isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/**
 * Format full date (e.g., "Monday, January 15, 2024")
 */
export function formatFullDate(date: Date | string | null | undefined): string {
	const d = toDate(date);
	if (!d || isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-US', {
		weekday: 'long',
		month: 'long',
		day: 'numeric',
		year: 'numeric'
	});
}

/**
 * Format date with custom weekday and date (e.g., "Mon, Jan 15")
 */
export function formatDayNameAndDate(date: Date | string | null | undefined): string {
	const d = toDate(date);
	if (!d || isNaN(d.getTime())) return '';
	return d.toLocaleDateString('en-US', {
		weekday: 'short',
		month: 'short',
		day: 'numeric'
	});
}

/**
 * Convert date to YYYY-MM-DD format using UTC (for URL params and server communication)
 */
export function toYMD(date: Date | string | null | undefined): string {
	const d = toDate(date);
	if (!d || isNaN(d.getTime())) return '';
	const y = d.getUTCFullYear();
	const m = String(d.getUTCMonth() + 1).padStart(2, '0');
	const day = String(d.getUTCDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

/**
 * Format a date range (e.g., "Jan 15 - Jan 21")
 */
export function formatDateRange(
	start: Date | string | null | undefined,
	end: Date | string | null | undefined
): string {
	const startDate = toDate(start);
	const endDate = toDate(end);
	if (!startDate || !endDate || isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';

	const startStr = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	const endStr = endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	return `${startStr} - ${endStr}`;
}

/**
 * Get week boundaries (start = Monday, end = Sunday)
 */
export function getWeekBoundaries(date: Date | string = new Date()): { start: Date; end: Date } {
	const start = getWeekStart(date);
	const end = new Date(start);
	end.setDate(start.getDate() + 6);
	end.setHours(23, 59, 59, 999);
	return { start, end };
}

/**
 * Add days to a date
 */
export function addDays(date: Date | string, days: number): Date {
	const d = toDate(date) || new Date();
	const result = new Date(d);
	result.setDate(d.getDate() + days);
	return result;
}

/**
 * Add weeks to a date
 */
export function addWeeks(date: Date | string, weeks: number): Date {
	return addDays(date, weeks * 7);
}

/**
 * Get Monday of a week using UTC (for server-side consistency)
 */
export function getMondayUTC(date: Date | string): Date {
	const d = toDate(date) || new Date();
	const day = d.getUTCDay();
	const diff = day === 0 ? -6 : 1 - day;
	return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff, 0, 0, 0, 0));
}

/**
 * Get week range (start = Monday 00:00:00.000Z, end = Sunday 23:59:59.999Z) for a given
 * optional weekStartParam (YYYY-MM-DD) or the provided `now` Date.
 *
 * This matches the server-side behavior where a query param `weekStart` is interpreted
 * as UTC midnight of that date. When no param is provided, the current UTC week is used.
 */
export function getWeekRange(
	weekStartParam?: string | null,
	now: Date = new Date()
): { startOfWeek: Date; endOfWeek: Date } {
	if (weekStartParam) {
		const startOfWeek = new Date(`${weekStartParam}T00:00:00.000Z`);
		const endOfWeek = new Date(startOfWeek);
		endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
		endOfWeek.setUTCHours(23, 59, 59, 999);
		return { startOfWeek, endOfWeek };
	}

	const today = now;
	const dayOfWeek = today.getUTCDay();
	const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
	const startOfWeek = new Date(
		Date.UTC(
			today.getUTCFullYear(),
			today.getUTCMonth(),
			today.getUTCDate() + daysToMonday,
			0,
			0,
			0,
			0
		)
	);
	const endOfWeek = new Date(startOfWeek);
	endOfWeek.setUTCDate(startOfWeek.getUTCDate() + 6);
	endOfWeek.setUTCHours(23, 59, 59, 999);
	return { startOfWeek, endOfWeek };
}
