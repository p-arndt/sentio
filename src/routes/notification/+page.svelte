<script lang="ts">
	import { onMount } from 'svelte';
	import { invoke } from '@tauri-apps/api/core';
	import { listen } from '@tauri-apps/api/event';
	import XIcon from '@lucide/svelte/icons/x';
	import type { Emotion } from '$lib/types';
	import { moodsApi } from '$lib/client/api/moods';
	import { toDateString } from '$lib/utils';

	let title = $state('New Notification');
	let message = $state('You have a new message');
	let avatar = $state<string | null>(null);
	let autoHide = $state(true);
	let hideTimeout: ReturnType<typeof setTimeout> | null = null;
	let emotions = $state<Emotion[]>([]);
	let saving = $state<string | null>(null);
	let showMoods = $state(false);

	onMount(async () => {
		// Fetch emotions
		try {
			const response = await fetch('/api/emotions');
			if (response.ok) {
				const data = await response.json();
				emotions = data.emotions || [];
				// Sort by valence descending (most positive first)
				emotions.sort((a, b) => (b.valence ?? 0) - (a.valence ?? 0));
			}
		} catch (error) {
			console.error('Failed to fetch emotions:', error);
		}

		// Listen for notification data
		const unlisten = await listen<{
			title?: string;
			message?: string;
			avatar?: string;
			autoHide?: boolean;
			showMoods?: boolean;
		}>('show-notification', async (event) => {
			if (event.payload.title) title = event.payload.title;
			if (event.payload.message) message = event.payload.message;
			if (event.payload.avatar) avatar = event.payload.avatar;
			if (event.payload.autoHide !== undefined) autoHide = event.payload.autoHide;
			if (event.payload.showMoods !== undefined) showMoods = event.payload.showMoods;

			// Wait for DOM to update and emotions to be ready
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Calculate dimensions based on content
			// Base notification: ~120px, with moods: ~240px
			const baseWidth = 380;
			const baseHeight = showMoods && emotions.length > 0 ? 240 : 120;
			
			// Position and resize the window with calculated dimensions
			try {
				await invoke('position_notification', {
					width: baseWidth,
					height: baseHeight
				});
				
				// Show the window
				await invoke('show_notification');
			} catch (error) {
				console.error('Failed to position/show notification:', error);
			}

			// Auto-hide after 5 seconds if enabled (but not if showing moods)
			if (autoHide && !showMoods) {
				if (hideTimeout) clearTimeout(hideTimeout);
				hideTimeout = setTimeout(() => {
					invoke('hide_notification');
				}, 5000);
			}
		});

		// Cleanup
		return () => {
			unlisten();
			if (hideTimeout) clearTimeout(hideTimeout);
		};
	});

	async function handleClose() {
		if (hideTimeout) clearTimeout(hideTimeout);
		await invoke('hide_notification');
	}

	async function handleMoodSelect(emotion: Emotion) {
		if (saving) return;

		saving = emotion.id;
		try {
			const today = new Date();
			await moodsApi.createMoodEntry({
				emotionId: emotion.id,
				date: toDateString(today),
				isPrivate: false,
				isAnonymous: false
			});

			// Close notification after successful save
			await handleClose();
		} catch (error) {
			console.error('Failed to save mood:', error);
			alert(`Failed to save mood: ${error instanceof Error ? error.message : 'Unknown error'}`);
		} finally {
			saving = null;
		}
	}
</script>

<style>
	:global(body),
	:global(html),
	:global(#app) {
		margin: 0 !important;
		padding: 0 !important;
		border: none !important;
		outline: none !important;
		background: transparent !important;
		box-shadow: none !important;
	}
	:global(*) {
		box-sizing: border-box;
	}
</style>

<div class="w-full h-full bg-transparent flex items-end justify-end p-4">
	<div
		class="w-full max-w-sm bg-popover text-popover-foreground rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-right-4 fade-in-0 duration-300 overflow-hidden"
		role="alert"
		aria-live="polite"
		style="border: none; outline: none; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);"
	>
		<div class="p-4">
			<div class="flex items-start gap-3 mb-3">
				{#if avatar}
					<img
						src={avatar}
						alt="Avatar"
						class="h-10 w-10 shrink-0 rounded-full border border-border object-cover"
					/>
				{:else}
					<div
						class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted border border-border"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-muted-foreground"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
							stroke-width="2"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
							/>
						</svg>
					</div>
				{/if}

				<div class="min-w-0 flex-1">
					<div class="mb-1 truncate text-base font-semibold text-foreground">{title}</div>
					<div class="line-clamp-2 text-sm text-muted-foreground leading-relaxed">
						{message}
					</div>
				</div>

				<button
					onclick={handleClose}
					class="ml-2 shrink-0 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
					aria-label="Close notification"
				>
					<XIcon class="h-4 w-4" />
				</button>
			</div>

			{#if showMoods && emotions.length > 0}
				<div class="border-t border-border pt-3 mt-3">
					<div class="text-xs font-medium text-muted-foreground mb-2">Quick Mood Entry:</div>
					<div class="grid grid-cols-6 gap-1.5">
						{#each emotions as emotion (emotion.id)}
							<button
								onclick={() => handleMoodSelect(emotion)}
								disabled={saving === emotion.id}
								class="flex flex-col items-center justify-center gap-1 p-2 rounded-md border border-border bg-background hover:bg-accent hover:border-accent-foreground/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
								style="border-color: {emotion.color}40;"
								title={emotion.name}
							>
								<span class="text-lg leading-none">{emotion.emoji}</span>
								<span class="text-[10px] text-muted-foreground truncate w-full text-center">
									{emotion.name}
								</span>
							</button>
						{/each}
					</div>
					{#if saving}
						<div class="mt-2 text-xs text-muted-foreground text-center">Saving...</div>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>
