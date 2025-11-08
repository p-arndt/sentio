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

	type Props = {
		open: boolean;
		emotion?: {
			id: string;
			name: string;
			emoji: string;
			color: string;
		} | null;
	};
	let { open = $bindable(false), emotion = null }: Props = $props();

	let isSubmitting = $state(false);

	let formData = $derived({
		name: emotion?.name ?? '',
		emoji: emotion?.emoji ?? '',
		color: emotion?.color ?? '#3b82f6'
	});

	function closeDialog() {
		open = false;
	}
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-[425px]">
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
					<Input
						id="name"
						name="name"
						placeholder="e.g., Very Happy"
						value={formData.name}
						required
					/>
				</div>

				<div class="grid gap-2">
					<Label for="emoji">Emoji</Label>
					<div class="flex items-center gap-2">
						<Input
							id="emoji"
							name="emoji"
							placeholder="😊"
							value={formData.emoji}
							maxlength={2}
							class="text-2xl"
							required
						/>
						<div
							class="flex h-10 w-16 items-center justify-center rounded-md border text-2xl"
							style="background-color: {formData.color}20;"
						>
							{formData.emoji || '😊'}
						</div>
					</div>
					<p class="text-muted-foreground text-xs">
						Paste an emoji from your keyboard or emoji picker
					</p>
				</div>

				<div class="grid gap-2">
					<Label for="color">Color</Label>
					<div class="flex items-center gap-2">
						<Input id="color" name="color" type="color" value={formData.color} required />
						<Input
							id="color-text"
							name="color-text"
							type="text"
							placeholder="#3b82f6"
							value={formData.color}
							pattern="^#[0-9A-Fa-f]{6}$"
							class="font-mono"
							oninput={(e) => {
								const input = e.currentTarget;
								if (input.value.match(/^#[0-9A-Fa-f]{6}$/)) {
									const colorInput = document.getElementById('color') as HTMLInputElement;
									if (colorInput) colorInput.value = input.value;
								}
							}}
						/>
					</div>
					<p class="text-muted-foreground text-xs">Choose a color for this emotion's background</p>
				</div>

				<div class="rounded-lg border p-4">
					<p class="text-muted-foreground mb-2 text-xs font-medium">Preview</p>
					<div class="flex items-center gap-3">
						<div
							class="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
							style="background-color: {formData.color}20;"
						>
							{formData.emoji || '😊'}
						</div>
						<div>
							<p class="font-medium">{formData.name || 'Emotion Name'}</p>
							<p class="text-muted-foreground text-xs">{formData.color}</p>
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
