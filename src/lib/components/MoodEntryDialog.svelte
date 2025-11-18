<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import type { Emotion } from '$lib/types';
	import { CalendarIcon, Save } from '@lucide/svelte';

	type EditEntry = {
		id: string;
		emotionId: string;
		comment?: string | null;
		timeOfDay?: 'morning' | 'noon' | 'evening' | null;
		isPrivate?: boolean;
		isAnonymous?: boolean;
	};

	type Props = {
		open: boolean;
		emotions: Emotion[];
		teamId?: string;
		selectedDate?: Date;
		allowPrivate?: boolean;
		allowAnonymous?: boolean;
		defaultAnonymous?: boolean;
		requireComment?: boolean;
		// Create mode handler
		onSave: (data: {
			emotionId: string;
			comment?: string;
			timeOfDay?: string;
			isPrivate?: boolean;
			isAnonymous?: boolean;
		}) => Promise<void>;
		// Edit mode inputs/handlers (optional)
		entry?: EditEntry | null;
		onUpdate?: (
			id: string,
			data: {
				emotionId: string;
				comment?: string;
				timeOfDay?: string;
				isPrivate?: boolean;
				isAnonymous?: boolean;
			}
		) => Promise<void>;
		onDelete?: (id: string) => Promise<void>;
	};

	let {
		open = $bindable(false),
		emotions,
		teamId,
		selectedDate,
		allowPrivate = true,
		allowAnonymous = false,
		defaultAnonymous = false,
		requireComment = false,
		onSave,
		entry = undefined,
		onUpdate = undefined,
		onDelete = undefined
	}: Props = $props();

	let selectedEmotionId = $state<string | undefined>(undefined);
	let comment = $state('');
	let timeOfDay = $state<string | undefined>(undefined);
	let isPrivate = $state(false);
	let isAnonymous = $state(false);
	let saving = $state(false);
	let error = $state<string | null>(null);

	const sortedEmotions = $derived(
		[...emotions].sort((a, b) => b.valence - a.valence) // sort by valence descending
	);

	// When editing, prefill fields when entry changes or dialog opens
	$effect(() => {
		error = null; // Clear error when dialog state changes
		if (open && entry) {
			selectedEmotionId = entry.emotionId;
			comment = entry.comment ?? '';
			timeOfDay = entry.timeOfDay ?? undefined;
			isPrivate = entry.isPrivate ?? false;
			isAnonymous = entry.isAnonymous ?? false;
		}
		if (open && !entry) {
			// reset to defaults for create mode
			selectedEmotionId = undefined;
			comment = '';
			timeOfDay = undefined;
			isPrivate = false;
			isAnonymous = allowAnonymous ? defaultAnonymous : false;
		}
	});

	async function handlePrimaryAction() {
		if (!selectedEmotionId) return;

		saving = true;
		try {
			const payload = {
				emotionId: selectedEmotionId,
				comment: comment || undefined,
				timeOfDay: timeOfDay && timeOfDay !== '' ? timeOfDay : undefined,
				isPrivate: allowPrivate ? isPrivate : false,
				isAnonymous: allowAnonymous ? isAnonymous : false
			};

			if (entry && onUpdate) {
				await onUpdate(entry.id, payload);
			} else {
				await onSave(payload);
			}

			selectedEmotionId = undefined;
			comment = '';
			timeOfDay = undefined;
			isPrivate = false;
			isAnonymous = false;
			open = false;
		} catch (error) {
			console.error('Failed to save/update mood entry:', error);
			error = error instanceof Error ? error.message : 'Failed to save mood entry';
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!entry || !onDelete) return;
		saving = true;
		try {
			await onDelete(entry.id);
			open = false;
		} catch (error) {
			console.error('Failed to delete mood entry:', error);
		} finally {
			saving = false;
		}
	}

	let formattedDate = $derived(
		selectedDate
			? selectedDate.toLocaleDateString('en-US', {
					weekday: 'long',
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				})
			: 'today'
	);

	let canSave = $derived(
		selectedEmotionId && (!requireComment || (comment && comment.trim().length > 0))
	);
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-[500px]">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				<CalendarIcon class="h-5 w-5" />
				{entry ? 'Edit Mood Entry' : 'Add Mood Entry'}
			</DialogTitle>
			<DialogDescription>
				How are you feeling {formattedDate}?
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-6 py-4">
			<!-- Error Message -->
			{#if error}
				<div class="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
					{error}
				</div>
			{/if}
			<!-- Emotion Selection -->
			<div class="space-y-3">
				<Label>How do you feel?</Label>
				<div class="grid grid-cols-3 gap-2 sm:grid-cols-4">
					{#each sortedEmotions as emotion}
						<button
							type="button"
							class="flex flex-col items-center gap-2 rounded-lg border-2 p-3 transition-all hover:bg-accent"
							class:border-primary={selectedEmotionId === emotion.id}
							class:bg-accent={selectedEmotionId === emotion.id}
							onclick={() => (selectedEmotionId = emotion.id)}
						>
							<span class="text-3xl">{emotion.emoji}</span>
							<span class="text-xs font-medium">{emotion.name}</span>
							<span class="text-xs text-muted-foreground">({emotion.valence})</span>
						</button>
					{/each}
				</div>
			</div>

			<!-- Comment -->
			<div class="space-y-2">
				<Label for="comment">
					Comment {requireComment ? '(Required)' : '(Optional)'}
				</Label>
				<Textarea
					id="comment"
					bind:value={comment}
					placeholder="What's on your mind?"
					rows={4}
					required={requireComment}
					class={requireComment && !comment.trim() ? 'border-orange-400' : ''}
				/>
				{#if requireComment && !comment.trim()}
					<p class="text-sm font-medium text-orange-600">💬 Please add a comment before saving</p>
				{/if}
			</div>

			<!-- Privacy Toggle -->
			{#if allowPrivate && teamId}
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label>Private Entry</Label>
						<p class="text-xs text-muted-foreground">Only you can see this entry</p>
					</div>
					<Switch bind:checked={isPrivate} />
				</div>
			{/if}

			<!-- Anonymous Toggle -->
			{#if allowAnonymous && teamId}
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label>Share Anonymously</Label>
						<p class="text-xs text-muted-foreground">Teammates will not see your name</p>
					</div>
					<Switch bind:checked={isAnonymous} />
				</div>
			{/if}
		</div>

		<DialogFooter class="flex items-center justify-between gap-2">
			<div class="flex-1">
				{#if entry && onDelete}
					<Button variant="destructive" onclick={handleDelete} disabled={saving}>Delete</Button>
				{/if}
			</div>
			<div class="flex items-center gap-2">
				<Button variant="outline" onclick={() => (open = false)} disabled={saving}>Cancel</Button>
				<Button onclick={handlePrimaryAction} disabled={!canSave || saving}>
					<Save class="mr-2 h-4 w-4" />
					{saving ? (entry ? 'Updating...' : 'Saving...') : entry ? 'Update Mood' : 'Save Mood'}
				</Button>
			</div>
		</DialogFooter>
	</DialogContent>
</Dialog>
