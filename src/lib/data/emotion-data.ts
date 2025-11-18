// Shared emotion data structure (without icons for server-side use)
export const EMOTION_DATA: { name: string; emoji: string; color: string; valence: number }[] = [
	{ name: 'Terrible', emoji: '🤬', color: '#7f1d1d', valence: -5 },
	{ name: 'Angry', emoji: '😠', color: '#ef4444', valence: -4 },
	{ name: 'Sad', emoji: '😢', color: '#3b82f6', valence: -3 },
	{ name: 'Frustrated', emoji: '😤', color: '#f97316', valence: -2 },
	{ name: 'Annoyed', emoji: '🙁', color: '#fb923c', valence: -1 },
	{ name: 'Neutral', emoji: '😐', color: '#6b7280', valence: 0 },
	{ name: 'Okay', emoji: '🙂', color: '#60a5fa', valence: 1 },
	{ name: 'Good', emoji: '👍', color: '#14b8a6', valence: 2 },
	{ name: 'Happy', emoji: '😊', color: '#10b981', valence: 3 },
	{ name: 'Excited', emoji: '🤩', color: '#f59e0b', valence: 4 },
	{ name: 'Loved', emoji: '❤️', color: '#ec4899', valence: 5 }
];
