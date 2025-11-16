export const moodsApi = {
	async createMoodEntry({
		emotionId,
		date,
		comment,
		teamId,
		isPrivate
	}: {
		emotionId: string;
		date: string;
		comment?: string;
		teamId?: string;
		isPrivate?: boolean;
	}) {
		const response = await fetch('/api/mood-entries', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ emotionId, date, comment, teamId, isPrivate: !!isPrivate })
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
			date: string;
			comment?: string;
			teamId?: string;
			isPrivate?: boolean;
		}[]
	) {
		const results = [];
		for (const entry of entries) {
			const res = await this.createMoodEntry(entry);
			results.push(res);
		}
		return results;
	}
};
