import type { EmotionWithIcon } from '$lib/data/emotions';
import {
	Angry,
	Annoyed,
	Cloud,
	Coffee,
	Frown,
	Heart,
	Laugh,
	Lightbulb,
	Meh,
	Moon,
	PartyPopper,
	Smile,
	Sparkles,
	Star,
	Sun,
	ThumbsDown,
	ThumbsUp,
	Zap
} from '@lucide/svelte';

// Map emotion names to Lucide icons
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ICON_MAP: Record<string, any> = {
	'very happy': Laugh,
	happy: Smile,
	excited: Sparkles,
	neutral: Meh,
	frustrated: Annoyed,
	angry: Angry,
	sad: Frown,
	celebrating: PartyPopper,
	loved: Heart,
	thumbs_up: ThumbsUp,
	good: ThumbsUp,
	thumbs_down: ThumbsDown,
	bad: ThumbsDown,
	star: Star,
	favorite: Star,
	inspired: Lightbulb,
	creative: Lightbulb,
	energized: Zap,
	tired: Coffee,
	relaxed: Cloud,
	sunny: Sun,
	sleepy: Moon
};

// Get an icon for an emotion based on its name or emoji
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getEmotionIcon(emotionName: string): any {
	const key = emotionName.toLowerCase().replace(/\s+/g, '_');
	return ICON_MAP[key] || Smile; // Default to Smile if no match
}

// Convert database emotions to EmotionWithIcon
export function mapEmotionsWithIcons(
	dbEmotions: Array<{
		id: string;
		name: string;
		emoji: string;
		color: string;
		valence: number;
		order: string;
		createdAt?: string | Date;
		updatedAt?: string | Date;
	}>
): EmotionWithIcon[] {
	return dbEmotions.map((emotion) => ({
		id: emotion.id,
		name: emotion.name,
		emoji: emotion.emoji,
		color: emotion.color,
		icon: getEmotionIcon(emotion.name),
		valence: emotion.valence,
		order: emotion.order,
		createdAt: emotion.createdAt ? new Date(emotion.createdAt) : new Date(),
		updatedAt: emotion.updatedAt ? new Date(emotion.updatedAt) : new Date()
	}));
}
