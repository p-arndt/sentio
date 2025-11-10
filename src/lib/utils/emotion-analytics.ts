/**
 * Emotion analytics utilities
 * Helper functions for calculating mood statistics based on emotion valence scores
 */

import type { Emotion, MoodEntry, MoodEntryWithDetails } from '$lib/types';

export interface MoodScore {
	score: number;
	label: string;
	color: string;
}

export interface MoodDistribution {
	positive: number;
	neutral: number;
	negative: number;
	total: number;
}

export interface MoodAnalytics {
	averageScore: number;
	moodScore: MoodScore;
	distribution: MoodDistribution;
	trend: 'improving' | 'declining' | 'stable' | 'insufficient-data';
	warning?: string;
}

/**
 * Calculate average valence from mood entries
 */
export function calculateAverageValence(
	entries: (MoodEntry & { emotion: Emotion })[] | MoodEntryWithDetails[]
): number {
	if (entries.length === 0) return 0;

	const total = entries.reduce((sum, entry) => sum + entry.emotion.valence, 0);
	return total / entries.length;
}

/**
 * Normalize date input: entries sometimes have string dates (serialized) or Date objects.
 */
function toDate(d: string | Date): Date {
	return typeof d === 'string' ? new Date(d) : d;
}

function groupByDay<T extends { date: string | Date }>(entries: T[]) {
	const map = new Map<string, T[]>();
	for (const e of entries) {
		const day = toDate(e.date).toISOString().split('T')[0];
		const arr = map.get(day) ?? [];
		arr.push(e);
		map.set(day, arr);
	}
	return map;
}

function groupCount<T extends { timeOfDay?: string | null }>(entries: T[], keyFn: (e: T) => string) {
	const map = new Map<string, number>();
	for (const e of entries) {
		const k = keyFn(e) ?? 'unknown';
		map.set(k, (map.get(k) ?? 0) + 1);
	}
	return Object.fromEntries(map.entries());
}

/**
 * Convenience: average valence for entries (alias)
 */
export const averageValence = calculateAverageValence;

/**
 * Average valence for the last N days relative to `reference` (default: now).
 */
export function averageValenceForPeriod(
	entries: (MoodEntry & { emotion: Emotion })[] | MoodEntryWithDetails[],
	days: number,
	reference = new Date()
): number {
	if (entries.length === 0) return 0;
	const start = new Date(reference);
	start.setDate(start.getDate() - (days - 1));
	const filtered = entries.filter((e) => toDate(e.date) >= start && toDate(e.date) <= reference);
	return calculateAverageValence(filtered as any);
}

export const averageValence7Days = (
	entries: MoodEntryWithDetails[],
	reference = new Date()
) => averageValenceForPeriod(entries, 7, reference);

export const averageValence30Days = (last30DaysEntries: MoodEntryWithDetails[], reference = new Date()) =>
	averageValenceForPeriod(last30DaysEntries, 30, reference);

/**
 * Delta between last `days` and the previous window of same length.
 */
export function deltaValence(
	entries: MoodEntryWithDetails[],
	days = 7,
	reference = new Date()
): number {
	const endCurrent = reference;
	const startCurrent = new Date(reference);
	startCurrent.setDate(startCurrent.getDate() - (days - 1));

	const endPrev = new Date(startCurrent);
	endPrev.setDate(endPrev.getDate() - 1);
	const startPrev = new Date(endPrev);
	startPrev.setDate(startPrev.getDate() - (days - 1));

	const current = entries.filter((e) => toDate(e.date) >= startCurrent && toDate(e.date) <= endCurrent);
	const previous = entries.filter((e) => toDate(e.date) >= startPrev && toDate(e.date) <= endPrev);

	const avgCurrent = calculateAverageValence(current as any);
	const avgPrevious = calculateAverageValence(previous as any);

	return avgCurrent - avgPrevious;
}

/**
 * Mood stability (0..1) where 1 is very stable (low sd) and 0 is highly volatile.
 */
export function moodStability(entries: MoodEntryWithDetails[]) {
	if (entries.length === 0) return 0;
	const byDay = groupByDay(entries);
	const dailyAvg = Array.from(byDay.values()).map((day) =>
		calculateAverageValence(day as any)
	);
	const mean = calculateAverageValence(entries as any);
	const variance = dailyAvg.reduce((s, v) => s + (v - mean) ** 2, 0) / Math.max(dailyAvg.length, 1);
	const sd = Math.sqrt(variance);
	return 1 - Math.min(sd / 5, 1);
}

/**
 * Consistency: percentage of days with at least one entry over a window (default 30 days)
 */
export function consistency(entries: MoodEntryWithDetails[], days = 30, reference = new Date()) {
	if (entries.length === 0) return 0;
	const start = new Date(reference);
	start.setDate(start.getDate() - (days - 1));
	const uniqueDays = new Set(
		entries
			.filter((e) => toDate(e.date) >= start && toDate(e.date) <= reference)
			.map((e) => toDate(e.date).toISOString().split('T')[0])
	);
	return (uniqueDays.size / days) * 100;
}

export function mostUsedEmotion(entries: MoodEntryWithDetails[]) {
	const counts = new Map<string, number>();
	for (const e of entries) counts.set(e.emotion.name, (counts.get(e.emotion.name) ?? 0) + 1);
	const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
	const first = sorted[0];
	return first ? first[0] : 'None';
}

export function emotionDiversity(entries: MoodEntryWithDetails[]) {
	if (entries.length === 0) return 0;
	const counts = new Map<string, number>();
	for (const e of entries) counts.set(e.emotion.name, (counts.get(e.emotion.name) ?? 0) + 1);
	const total = entries.length;
	const entropy = [...counts.values()]
		.map((c) => {
			const p = c / total;
			return -p * Math.log2(p);
		})
		.reduce((a, b) => a + b, 0);
	const maxEntropy = Math.log2(counts.size || 1);
	if (maxEntropy === 0) return 0;
	return (entropy / maxEntropy) * 100;
}

export function entriesByTimeOfDay(entries: MoodEntryWithDetails[]) {
	return groupCount(entries, (e) => e.timeOfDay ?? 'unknown');
}

export function moodTrendSlope(entries: MoodEntryWithDetails[]) {
	const byDay = groupByDay(entries);
	const values = Array.from(byDay.values()).map((day) => calculateAverageValence(day as any));
	const n = values.length;
	if (n < 2) return 0;
	const x = Array.from({ length: n }, (_, i) => i + 1);
	const meanX = x.reduce((a, b) => a + b, 0) / n;
	const meanY = values.reduce((a, b) => a + b, 0) / n;
	const num = x.reduce((s, i, idx) => s + (i - meanX) * (values[idx] - meanY), 0);
	const den = x.reduce((s, i) => s + (i - meanX) ** 2, 0);
	if (den === 0) return 0;
	return num / den;
}

export function averageByWeekday(entries: MoodEntryWithDetails[]) {
	const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
	const grouped = new Map<number, MoodEntryWithDetails[]>();
	for (const e of entries) {
		const d = toDate(e.date).getDay();
		grouped.set(d, (grouped.get(d) ?? []).concat(e));
	}
	return days.map((label, i) => ({ day: label, avg: calculateAverageValence((grouped.get(i) ?? []) as any) }));
}

/**
 * Get mood score label and color based on average valence
 */
export function getMoodScore(averageValence: number): MoodScore {
	if (averageValence >= 4) {
		return { score: averageValence, label: 'Excellent', color: '#22c55e' };
	} else if (averageValence >= 2) {
		return { score: averageValence, label: 'Good', color: '#84cc16' };
	} else if (averageValence >= 0) {
		return { score: averageValence, label: 'Fair', color: '#eab308' };
	} else if (averageValence >= -2) {
		return { score: averageValence, label: 'Poor', color: '#f97316' };
	} else {
		return { score: averageValence, label: 'Critical', color: '#ef4444' };
	}
}

/**
 * Calculate mood distribution (positive, neutral, negative)
 */
export function getMoodDistribution(
	entries: (MoodEntry & { emotion: Emotion })[] | MoodEntryWithDetails[]
): MoodDistribution {
	const distribution = {
		positive: 0,
		neutral: 0,
		negative: 0,
		total: entries.length
	};

	entries.forEach((entry) => {
		if (entry.emotion.valence > 0) {
			distribution.positive++;
		} else if (entry.emotion.valence < 0) {
			distribution.negative++;
		} else {
			distribution.neutral++;
		}
	});

	return distribution;
}

/**
 * Analyze mood trend (comparing two time periods)
 */
export function analyzeMoodTrend(
	currentPeriodEntries: (MoodEntry & { emotion: Emotion })[] | MoodEntryWithDetails[],
	previousPeriodEntries: (MoodEntry & { emotion: Emotion })[] | MoodEntryWithDetails[]
): 'improving' | 'declining' | 'stable' | 'insufficient-data' {
	if (currentPeriodEntries.length === 0 || previousPeriodEntries.length === 0) {
		return 'insufficient-data';
	}

	const currentAvg = calculateAverageValence(currentPeriodEntries);
	const previousAvg = calculateAverageValence(previousPeriodEntries);

	const difference = currentAvg - previousAvg;

	if (difference > 0.5) return 'improving';
	if (difference < -0.5) return 'declining';
	return 'stable';
}

/**
 * Get comprehensive mood analytics
 */
export function getMoodAnalytics(
	entries: (MoodEntry & { emotion: Emotion })[] | MoodEntryWithDetails[],
	previousEntries?: (MoodEntry & { emotion: Emotion })[] | MoodEntryWithDetails[]
): MoodAnalytics {
	const averageScore = calculateAverageValence(entries);
	const moodScore = getMoodScore(averageScore);
	const distribution = getMoodDistribution(entries);

	// Check if all emotions have neutral valence (warning case)
	const allNeutral = entries.every((entry) => entry.emotion.valence === 0);
	const warning = allNeutral
		? 'All emotions have neutral valence. Assign sentiment scores to emotions for better insights.'
		: undefined;

	const trend = previousEntries ? analyzeMoodTrend(entries, previousEntries) : 'insufficient-data';

	return {
		averageScore,
		moodScore,
		distribution,
		trend,
		warning
	};
}

/**
 * Calculate team happiness index (0-100 scale)
 */
export function calculateHappinessIndex(
	entries: (MoodEntry & { emotion: Emotion })[] | MoodEntryWithDetails[]
): number {
	if (entries.length === 0) return 50; // Default to middle

	const avgValence = calculateAverageValence(entries);

	// Assuming valence range is typically -5 to +5
	// Convert to 0-100 scale
	const normalized = ((avgValence + 5) / 10) * 100;

	return Math.max(0, Math.min(100, normalized));
}

