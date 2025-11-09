<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Slider } from '$lib/components/ui/slider';

	type Props = {
		open: boolean;
		emotion?: {
			id: string;
			name: string;
			emoji: string;
			color: string;
			valence: number;
			description?: string | null;
		} | null;
	};
	let { open = $bindable(false), emotion = null }: Props = $props();

	let isSubmitting = $state(false);
	let emojiInputRef: HTMLInputElement | null = $state(null);

	let name = $state('');
	let emoji = $state('');
	let color = $state('#3b82f6');
	let valence = $state(0);
	let description = $state('');

	// Update form when emotion changes or dialog opens
	$effect(() => {
		if (emotion && open) {
			name = emotion.name;
			emoji = emotion.emoji;
			color = emotion.color;
			valence = emotion.valence;
			description = emotion.description || '';
		} else if (!emotion && open) {
			name = '';
			emoji = '';
			color = '#3b82f6';
			valence = 0;
			description = '';
		}
	});

	function closeDialog() {
		open = false;
		// Reset form after closing
		setTimeout(() => {
			name = '';
			emoji = '';
			color = '#3b82f6';
			valence = 0;
			description = '';
		}, 200);
	}

	function handleEmojiPaste(e: ClipboardEvent) {
		// Handle emoji pasting with better support for various emoji formats
		if (!e.clipboardData) return;

		const text = e.clipboardData.getData('text/plain');
		if (text) {
			// Take only the first character/emoji
			const firstEmoji = Array.from(text)[0];
			if (firstEmoji) {
				emoji = firstEmoji;
				e.preventDefault();
			}
		}
	}

	function clearEmoji() {
		emoji = '';
		emojiInputRef?.focus();
	}
</script>

<Dialog bind:open>
	<DialogContent>
		<form
			method="POST"
			action="?/{emotion ? 'updateEmotion' : 'createEmotion'}"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					closeDialog();
				};
			}}
		>
			{#if emotion}
				<input type="hidden" name="emotionId" value={emotion.id} />
			{/if}

			<DialogHeader>
				<DialogTitle>{emotion ? 'Edit' : 'Create'} Emotion</DialogTitle>
				<DialogDescription>
					{emotion ? 'Update' : 'Add a new'} emotion with a name, emoji, and color.
				</DialogDescription>
			</DialogHeader>

			<div class="grid gap-4 py-4">
				<div class="grid gap-2">
					<Label for="name">Name</Label>
					<Input id="name" name="name" placeholder="e.g., Very Happy" bind:value={name} required />
				</div>

				<div class="grid gap-2">
					<Label for="emoji">Emoji</Label>
					<div class="flex items-center gap-2">
						<Input
							bind:ref={emojiInputRef}
							id="emoji"
							name="emoji"
							placeholder="😊"
							bind:value={emoji}
							onpaste={handleEmojiPaste}
							maxlength={10}
							class="text-2xl"
							required
						/>
						<div
							class="flex h-10 w-16 items-center justify-center rounded-md border text-2xl"
							style="background-color: {color}20;"
						>
							{emoji || '😊'}
						</div>
						{#if emoji}
							<Button
								type="button"
								variant="ghost"
								size="icon"
								title="Clear emoji"
								onclick={clearEmoji}
								class="h-10 w-10"
							>
								✕
							</Button>
						{/if}
					</div>
					<p class="text-xs text-muted-foreground">
						Paste an emoji from your keyboard or emoji picker
					</p>
				</div>

				<div class="grid gap-2">
					<Label for="color">Color</Label>
					<div class="flex items-center gap-2">
						<Input id="color" name="color" type="color" bind:value={color} required />
						<Input
							id="color-text"
							type="text"
							placeholder="#3b82f6"
							bind:value={color}
							class="font-mono"
						/>
					</div>
					<p class="text-xs text-muted-foreground">Choose a color for this emotion's background</p>
				</div>

				<div class="grid gap-2">
					<Label for="valence">Valence (Sentiment Score)</Label>
					<div class="space-y-3">
						<div class="flex items-center gap-4">
							<Input
								id="valence"
								name="valence"
								type="number"
								bind:value={valence}
								min="-10"
								max="10"
								step="1"
								required
								class="w-20"
							/>
							<div class="flex-1 space-y-2">
								<Slider type="single" bind:value={valence} min={-10} max={10} step={1} />
								<div class="flex items-center justify-between text-xs">
									<div class="flex items-center gap-1">
										<span>😢</span>
									</div>
									<div class="flex items-center gap-1">
										<span>😐</span>
									</div>
									<div class="flex items-center gap-1">
										<span>😊</span>
									</div>
								</div>
							</div>
						</div>
						<p class="text-xs text-muted-foreground">
							Score representing how positive or negative this emotion is. Use for analytics and
							mood tracking.
							{#if valence > 0}
								<span class="text-green-600 dark:text-green-400">(+{valence} Positive)</span>
							{:else if valence < 0}
								<span class="text-red-600 dark:text-red-400">({valence} Negative)</span>
							{:else}
								<span class="text-muted-foreground">(Neutral)</span>
							{/if}
						</p>
					</div>
				</div>

				<div class="grid gap-2">
					<Label for="description">Description (Optional)</Label>
					<Input
						id="description"
						name="description"
						placeholder="e.g., Feeling great about work progress"
						bind:value={description}
					/>
					<p class="text-xs text-muted-foreground">
						Help your team understand when to use this emotion
					</p>
				</div>

				<div class="rounded-lg border p-4">
					<p class="mb-2 text-xs font-medium text-muted-foreground">Preview</p>
					<div class="flex items-center gap-3">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
							style="background-color: {color}20;"
						>
							{emoji || '😊'}
						</div>
						<div>
							<p class="font-medium">{name || 'Emotion Name'}</p>
							<p class="text-xs text-muted-foreground">{color}</p>
						</div>
					</div>
				</div>
			</div>

			<DialogFooter>
				<Button type="button" variant="outline" onclick={closeDialog} disabled={isSubmitting}>
					Cancel
				</Button>
				<Button type="submit" disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : emotion ? 'Update' : 'Create'}
				</Button>
			</DialogFooter>
		</form>
	</DialogContent>
</Dialog>
