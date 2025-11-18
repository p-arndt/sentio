import type { MoodEntry, UserAchievement } from '$lib/types';

export const moodsApi = {
	async createMoodEntry({
		emotionId,
		date,
		comment,
		teamId,
		isPrivate,
		isAnonymous
	}: Partial<MoodEntry>): Promise<{
		entries: MoodEntry[];
		grantedAchievements: UserAchievement[];
	}> {
		const response = await fetch('/api/mood-entries', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				emotionId,
				date,
				comment,
				teamId,
				isPrivate: !!isPrivate,
				isAnonymous: !!isAnonymous
			})
		});

		if (!response.ok) {
			const errorData = await response.json();
			throw new Error(errorData.error || 'Failed to create mood entry');
		}

		return response.json();
	},
	async createMoodEntries(
		entries: {
			emotionId: string;
			date: string | Date;
			comment?: string;
			teamId?: string;
			isPrivate?: boolean;
			isAnonymous?: boolean;
		}[]
	) {
		const results = [];
		for (const entry of entries) {
			const payload: Partial<MoodEntry> = {
				...entry,
				date: entry.date instanceof Date ? entry.date : new Date(entry.date)
			};
			const res = await this.createMoodEntry(payload);
			results.push(res);
		}
		return results;
	}
};
