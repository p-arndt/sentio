import type { Visibility } from '$lib/types';
import { Eye, Globe, Lock, type Icon } from '@lucide/svelte';

// ==================== UI UTILITIES ====================

/**
 * Get time-based greeting
 */
export function getGreeting(): string {
	const hour = new Date().getHours();
	if (hour < 12) return 'Good morning';
	if (hour < 18) return 'Good afternoon';
	return 'Good evening';
}

/**
 * Get icon component for visibility level
 */
export function getVisibilityIcon(visibility: string): typeof Icon {
	switch (visibility) {
		case 'public':
			return Globe;
		case 'private':
			return Lock;
		default:
			return Eye;
	}
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
	if (!text || text.length <= maxLength) return text;
	return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format count with label (singular/plural)
 */
export function formatCount(count: number, singular: string, plural?: string): string {
	const label = count === 1 ? singular : plural || `${singular}s`;
	return `${count} ${label}`;
}

export function getVisibilityDescription(visibility: string) {
	switch (visibility) {
		case 'public':
			return 'Anyone can view';
		case 'private':
			return 'Only you can view';
		default:
			return 'Team members only';
	}
}

export function getVisibilityValueText(value: Visibility) {
	switch (value) {
		case 'public':
			return 'Public';
		case 'private':
			return 'Private';
		case 'team':
			return 'Team';
		default:
			return 'unknown';
	}
}
