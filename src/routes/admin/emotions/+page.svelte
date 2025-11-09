<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Plus, Edit, Trash2 } from '@lucide/svelte';
	import type { PageData } from './$types';
	import EmotionDialog from './EmotionDialog.svelte';

	type Props = {
		data: PageData;
		form?: { success?: boolean; error?: string } | null;
	};
	let { data, form = null }: Props = $props();

	let showDialog = $state(false);
	let editingEmotion = $state<(typeof data.emotions)[0] | null>(null);

	function openCreateDialog() {
		editingEmotion = null;
		showDialog = true;
	}

	function openEditDialog(emotion: (typeof data.emotions)[0]) {
		editingEmotion = emotion;
		showDialog = true;
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h3 class="text-lg font-medium">Emotions</h3>
			<p class="text-muted-foreground text-sm">Manage the available mood options for your team</p>
		</div>
		<Button onclick={openCreateDialog}>
			<Plus class="mr-2 h-4 w-4" />
			Add Emotion
		</Button>
	</div>

	{#if form?.success}
		<div class="rounded-lg border border-green-500 bg-green-50 p-4 text-green-900 dark:bg-green-950 dark:text-green-100">
			Emotion saved successfully!
		</div>
	{/if}

	{#if form?.error}
		<div class="rounded-lg border border-red-500 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100">
			{form.error}
		</div>
	{/if}

	<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.emotions as emotion}
			<Card>
				<CardHeader>
					<div class="flex items-start justify-between">
						<div class="flex items-center gap-3">
							<div
								class="flex h-12 w-12 items-center justify-center rounded-full text-2xl"
								style="background-color: {emotion.color}20;"
							>
								{emotion.emoji}
							</div>
							<div>
								<CardTitle class="text-base">{emotion.name}</CardTitle>
								<Badge
									variant="outline"
									class="mt-1"
									style="border-color: {emotion.color}; color: {emotion.color};"
								>
									{emotion.color}
								</Badge>
							</div>
						</div>
						<div class="flex gap-1">
							<Button variant="ghost" size="icon" onclick={() => openEditDialog(emotion)}>
								<Edit class="h-4 w-4" />
							</Button>
							<form method="POST" action="?/deleteEmotion">
								<input type="hidden" name="emotionId" value={emotion.id} />
								<Button
									variant="ghost"
									size="icon"
									type="submit"
									onclick={(e) => {
										if (!confirm(`Are you sure you want to delete "${emotion.name}"?`)) {
											e.preventDefault();
										}
									}}
								>
									<Trash2 class="h-4 w-4 text-destructive" />
								</Button>
							</form>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div class="text-muted-foreground text-xs">
						Created {new Date(emotion.createdAt).toLocaleDateString()}
					</div>
				</CardContent>
			</Card>
		{/each}

		{#if data.emotions.length === 0}
			<div class="col-span-full">
				<Card>
					<CardContent class="flex flex-col items-center justify-center py-16">
						<div class="mb-4 text-6xl">😊</div>
						<h3 class="mb-2 text-lg font-semibold">No emotions yet</h3>
						<p class="text-muted-foreground mb-4 text-sm">
							Get started by adding your first emotion
						</p>
						<Button onclick={openCreateDialog}>
							<Plus class="mr-2 h-4 w-4" />
							Add Emotion
						</Button>
					</CardContent>
				</Card>
			</div>
		{/if}
	</div>
</div>

<EmotionDialog bind:open={showDialog} emotion={editingEmotion} />
