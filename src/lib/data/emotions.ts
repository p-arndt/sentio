import type { Emotion } from '$lib/types';

export interface EmotionWithIcon extends Emotion {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: any;
}
