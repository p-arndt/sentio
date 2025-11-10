<script lang="ts">
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip';
	import type { Emotion, Team } from '$lib/types';
	import { Heart, MessageCircle } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	type Props = {
		emotions: Emotion[];
		teams: Team[];
		onEntryAdded?: () => void | Promise<void>;
	};

	let { emotions, teams, onEntryAdded }: Props = $props();

	let selectedEmotionId = $state<string | undefined>(undefined);
	let comment = $state('');
	let showComment = $state(false);
	let isLoading = $state(false);

	// Initialize teams state with all team IDs set to false
	const initialTeams: Record<string, boolean> = {};
	teams.forEach((team) => {
		initialTeams[team.id] = false;
	});

	let selectedTargets = $state<{
		personal: boolean;
		teams: Record<string, boolean>;
	}>({
		personal: true,
		teams: initialTeams
	});

	// Derived map that normalizes team selections (handles any missing keys)
	const teamSelectionMap = $derived.by(() => {
		const map: Record<string, boolean> = {};
		teams.forEach((team) => {
			map[team.id] = selectedTargets.teams[team.id] ?? false;
		});
		return map;
	});

	const hasTargetSelected = $derived(
		selectedTargets.personal || Object.values(teamSelectionMap).some((v) => v === true)
	);

	// Check if any selected team requires comments
	const requiresComment = $derived.by(() => {
		for (const [teamId, isSelected] of Object.entries(teamSelectionMap)) {
			if (isSelected === true) {
				const team = teams.find((t) => t.id === teamId);
				if (team?.requireComment) {
					return true;
				}
			}
		}
		return false;
	});

	const commentValid = $derived(!requiresComment || comment.trim().length > 0);
	const canSubmit = $derived(
		!!selectedEmotionId && hasTargetSelected && commentValid && !isLoading
	);

	async function handleEmotionSelect(emotionId: string) {
		selectedEmotionId = emotionId;
		// Auto-show comment field when required (direct state update, no effect needed)
		if (requiresComment && !showComment) {
			showComment = true;
		}
	}

	async function handleSubmit() {
		if (!selectedEmotionId || !canSubmit) return;

		isLoading = true;
		const today = new Date();
		const dateStr = today.toISOString().split('T')[0];

		try {
			// Create personal entry if selected
			if (selectedTargets.personal) {
				const response = await fetch('/api/mood-entries', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						emotionId: selectedEmotionId,
						date: dateStr,
						comment: comment || undefined,
						isPrivate: false
					})
				});

				if (!response.ok) {
					const error = await response.json();
					throw new Error(error.error || 'Failed to save personal mood entry');
				}
			}

			// Create team entries for selected teams
			for (const [teamId, isSelected] of Object.entries(teamSelectionMap)) {
				if (isSelected === true) {
					const response = await fetch('/api/mood-entries', {
						method: 'POST',
						headers: { 'Content-Type': 'application/json' },
						body: JSON.stringify({
							emotionId: selectedEmotionId,
							date: dateStr,
							comment: comment || undefined,
							teamId,
							isPrivate: false
						})
					});

					if (!response.ok) {
						const error = await response.json();
						throw new Error(error.error || `Failed to save team mood entry for ${teamId}`);
					}
				}
			}

			// Success
			const targetNames = [];
			if (selectedTargets.personal) targetNames.push('personal calendar');
			Object.entries(teamSelectionMap).forEach(([teamId, isSelected]) => {
				if (isSelected === true) {
					const team = teams.find((t) => t.id === teamId);
					if (team) targetNames.push(`${team.name}`);
				}
			});

			toast.success(`Mood added to ${targetNames.join(', ')}`);

			// Reset form
			resetForm();

			if (onEntryAdded) {
				await onEntryAdded();
			}
		} catch (error) {
			console.error('Error adding mood entry:', error);
			toast.error(error instanceof Error ? error.message : 'Failed to add mood entry');
		} finally {
			isLoading = false;
		}
	}

	// Team checkbox is bound directly; no explicit toggle handler required

	function resetForm() {
		selectedEmotionId = undefined;
		comment = '';
		showComment = false;
		const newTeams = Object.fromEntries(
			Object.keys(selectedTargets.teams).map((teamId) => [teamId, false])
		) as Record<string, boolean>;
		selectedTargets = { personal: true, teams: newTeams };
	}
</script>

<Card>
	<CardHeader>
		<div class="flex items-center gap-2">
			<Heart class="h-5 w-5 text-primary" />
			<div>
				<CardTitle>Quick Mood Entry</CardTitle>
				<CardDescription>Add your mood to selected calendars</CardDescription>
			</div>
		</div>
	</CardHeader>
	<CardContent class="space-y-4">
		<!-- Emotions -->
		<div>
			<h4 class="mb-3 text-sm font-medium">How are you feeling?</h4>
			<TooltipProvider delayDuration={300} skipDelayDuration={0}>
				<div class="flex flex-wrap justify-center gap-2">
					{#each emotions as emotion (emotion.id)}
						<Tooltip disableHoverableContent={true}>
							<TooltipTrigger
								class={[
									buttonVariants({
										variant: selectedEmotionId === emotion.id ? 'default' : 'outline',
										size: 'icon'
									}),
									'h-12 w-12',
									'relative border-2 transition-all duration-200 hover:scale-110',
									selectedEmotionId === emotion.id && 'shadow-lg ring-2 ring-ring ring-offset-2'
								]}
								style={selectedEmotionId !== emotion.id
									? `border-color: ${emotion.color}30; background-color: ${emotion.color}10;`
									: ''}
								onclick={() => handleEmotionSelect(emotion.id)}
								disabled={isLoading}
							>
								<span class="text-2xl">{emotion.emoji}</span>
							</TooltipTrigger>
							<TooltipContent side="top">
								<p class="text-xs">{emotion.name}</p>
							</TooltipContent>
						</Tooltip>
					{/each}
				</div>
			</TooltipProvider>
		</div>

		<!-- Target Selection & Comment -->
		<div class="space-y-4 border-t pt-4">
			{#if selectedEmotionId}
				<!-- Target Selection -->
				<div class="space-y-2">
					<p class="text-xs font-medium text-muted-foreground">Add to:</p>
					<div class="space-y-2 rounded-lg border bg-muted/30 p-3">
						<!-- Personal Calendar -->
						<div class="flex items-center space-x-2">
							<Checkbox
								id="personal"
								bind:checked={selectedTargets.personal}
								disabled={isLoading}
								class="h-4 w-4"
							/>
							<Label for="personal" class="cursor-pointer font-medium">Personal Calendar</Label>
						</div>

						<!-- Teams -->
						{#if teams.length > 0}
							<div class="flex flex-col space-y-3 border-t py-3">
								{#each teams as team}
									<div class="flex items-center gap-3">
										<Checkbox
											id={`team-${team.id}`}
											bind:checked={selectedTargets.teams[team.id]}
											disabled={isLoading}
											class="h-4 w-4"
										/>
										<Label for={`team-${team.id}`} class="cursor-pointer font-medium">
											{team.name}
											{#if team.requireComment && teamSelectionMap[team.id]}
												<span class="ml-1 text-amber-500">*</span>
											{/if}
										</Label>
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<!-- Comment Section -->
				{#if showComment || requiresComment}
					<div class="space-y-2">
						<Textarea
							bind:value={comment}
							placeholder="How are you feeling? Any thoughts to share?"
							class={[
								'min-h-20 resize-none text-sm',
								requiresComment && !comment.trim() ? 'border-orange-400' : ''
							]}
							autofocus
							disabled={isLoading}
						/>
						{#if requiresComment && !comment.trim()}
							<p class="flex items-center space-x-2 text-xs font-medium text-orange-600">
								<MessageCircle class="mr-1 inline-block h-3 w-3" />
								Comment is required
							</p>
						{/if}
						<div class="flex justify-end gap-2">
							<Button
								variant="ghost"
								size="sm"
								onclick={() => {
									showComment = false;
								}}
								disabled={isLoading}
							>
								Cancel
							</Button>
							<Button size="sm" onclick={handleSubmit} disabled={!canSubmit}>
								{isLoading ? 'Adding...' : 'Add Mood'}
							</Button>
						</div>
					</div>
				{:else}
					<div class="flex items-center justify-between gap-2">
						<Button
							variant="ghost"
							size="sm"
							onclick={() => (showComment = true)}
							class="text-xs"
							disabled={isLoading}
						>
							<MessageCircle class="mr-1.5 h-3 w-3" />
							{comment ? 'Edit comment' : 'Add comment'}
						</Button>
						<Button size="sm" onclick={handleSubmit} disabled={!canSubmit}>
							{isLoading ? 'Adding...' : 'Add Mood'}
						</Button>
					</div>
				{/if}
			{:else}
				<p class="text-center text-sm text-muted-foreground">Select an emotion to continue</p>
			{/if}
		</div>
	</CardContent>
</Card>
