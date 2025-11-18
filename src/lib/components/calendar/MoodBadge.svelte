<script lang="ts">
	import type { Emotion, MoodEntryWithDetails } from '$lib/types';
	import { GhostIcon, MessageCircleMore } from '@lucide/svelte';
	import type { Component } from 'svelte';

	interface Props {
		emotion: Emotion;
		mood?: MoodEntryWithDetails | null;
		currentUserId?: string;
		emojiSizeClass?: string;
	}

	let { emotion, mood = null, currentUserId, emojiSizeClass = 'text-2xl' }: Props = $props();

	const commentBadgeClass = '-top-1 -right-2';
	const anonymousBadgeClass = '-right-2 -bottom-1';
	// Emotion background styles
	const emotionBgStyle = `
		border-color: ${emotion.color}35;
		background-color: ${emotion.color}20;
	`.trim();

	// Check conditions
	const hasComment = $derived(mood?.comment);
	const isAnonymousOwned = $derived(mood?.isAnonymous && mood?.userId === currentUserId);
</script>

<div class="relative flex items-center justify-center rounded-full">
	<!-- Main emotion emoji -->
	<div class="rounded-full border p-0.5" style={emotionBgStyle}>
		<div class={emojiSizeClass}>{emotion.emoji}</div>
	</div>

	{#snippet badgeItem(icon: Component, title: string, className?: string)}
		{@const BadgeIcon = icon}
		<span
			{title}
			class="absolute flex h-5.5 w-5.5 {className} items-center justify-center rounded-full bg-muted p-1 text-muted-foreground"
		>
			<BadgeIcon class="h-5 w-5" />
		</span>
	{/snippet}
	{#if hasComment}
		{@render badgeItem(MessageCircleMore, 'Has comment', commentBadgeClass)}
	{/if}
	{#if isAnonymousOwned}
		{@render badgeItem(GhostIcon, 'Anonymous', anonymousBadgeClass)}
	{/if}
</div>
