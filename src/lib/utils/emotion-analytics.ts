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

export const averageValence30Days = (last30DaysEntries: MoodEntryWithDetails[]) => {
	if (last30DaysEntries.length === 0) return 0;
	const total = last30DaysEntries.reduce((sum, e) => sum + e.emotion.valence, 0);
	return total / last30DaysEntries.length;
};

export const consistency = (last30DaysEntries: MoodEntryWithDetails[]) => {
	if (last30DaysEntries.length === 0) return 0;
	const uniqueDays = new Set(
		last30DaysEntries.map((e) => new Date(e.date).toISOString().split('T')[0])
	);
	return (uniqueDays.size / 30) * 100;
};
