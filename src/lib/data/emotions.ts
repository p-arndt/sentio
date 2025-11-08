import type { Emotion } from '$lib/types';
import {
	Frown,
	Meh,
	Smile,
	Angry,
	Annoyed,
	Heart,
	Laugh,
	Sparkles,
	PartyPopper,
	ThumbsUp,
	ThumbsDown,
	Star
} from '@lucide/svelte';
import { EMOTION_DATA } from './emotion-data';

export interface EmotionWithIcon extends Emotion {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: any;
}

const EMOTION_ICONS = [
	Laugh,
	Smile,
	Sparkles,
	Meh,
	Annoyed,
	Angry,
	Frown,
	PartyPopper,
	Heart,
	ThumbsUp,
	ThumbsDown,
	Star
];

export const DEFAULT_EMOTIONS: EmotionWithIcon[] = EMOTION_DATA.map((emotion, index) => ({
	id: emotion.name.toLowerCase().replace(/\s+/g, '-'),
	...emotion,
	icon: EMOTION_ICONS[index]
}));