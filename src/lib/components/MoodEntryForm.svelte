<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/client/api';
	import { Button, buttonVariants } from '$lib/components/ui/button';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import {
		Tooltip,
		TooltipContent,
		TooltipProvider,
		TooltipTrigger
	} from '$lib/components/ui/tooltip';
	import type { Emotion, Team, MoodSharePreference } from '$lib/types';
	import { toDateString } from '$lib/utils';
	import { Ghost, MessageCircle } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	type Targets = { personal: boolean; teamIds: string[] };

	type Props = {
		emotions: Emotion[];
		teams?: Team[];
		quickEntry?: boolean; // If true it doesn't show target selection
		initialTargets?: Targets;
		initialComment?: string;
		requireComment?: boolean; // Deprecated: prefer deriving from teams
		// Optional submission context and callbacks
		date?: Date;
		teamId?: string;
		allowPrivate?: boolean;
		allowAnonymous?: boolean;
		updatePreferences?: boolean;
		teamSharingDefault?: MoodSharePreference;
		teamSharingOverrides?: Record<string, MoodSharePreference>;

		onSuccess?: (result: any) => void | Promise<void>;
		onError?: (err: Error) => void;
		onAnonymousModeChange?: (isAnonymous: boolean) => void;
	};

	let {
		emotions,
		teams = [],
		quickEntry: showAddToCalendar = false,
		initialTargets = { personal: true, teamIds: [] },
		initialComment = '',
		requireComment = false,
		date,
		teamId,
		allowPrivate = false,
		allowAnonymous = true,
		updatePreferences = true,
		teamSharingDefault = 'public',
		teamSharingOverrides = {} as Record<string, MoodSharePreference>,
		onSuccess,
		onError,
		onAnonymousModeChange
	}: Props = $props();

	let selectedEmotionId = $state<string | undefined>(undefined);
	let comment = $state(initialComment);
	let showComment = $state(false);
	let isLoading = $state(false);

	// Initialize teams state with initial selection
	const initialTeams: Record<string, boolean> = {};
	teams.forEach((team) => {
		initialTeams[team.id] = initialTargets.teamIds.includes(team.id);
	});

	let selectedTargets = $state<{ personal: boolean; teams: Record<string, boolean> }>({
		personal: initialTargets.personal ?? true,
		teams: initialTeams
	});

	const baseTeamSharing: Record<string, MoodSharePreference> = {};
	teams.forEach((team) => {
		baseTeamSharing[team.id] = teamSharingOverrides[team.id] ?? teamSharingDefault;
	});

	let teamSharingSelection = $state<Record<string, MoodSharePreference>>({ ...baseTeamSharing });
	let singleTeamSharing = $state<MoodSharePreference>(
		teamId ? (teamSharingOverrides[teamId] ?? teamSharingDefault) : teamSharingDefault
	);
	let singleTeamDirty = $state(false);

	$effect(() => {
		if (onAnonymousModeChange && teamId) {
			onAnonymousModeChange(singleTeamSharing === 'anonymous');
		}
	});

	function getTeamSharingPreference(targetTeamId: string): MoodSharePreference {
		return (
			teamSharingSelection[targetTeamId] ?? teamSharingOverrides[targetTeamId] ?? teamSharingDefault
		);
	}

	function setTeamSharingPreference(targetTeamId: string, pref: MoodSharePreference) {
		teamSharingSelection[targetTeamId] = pref;
	}

	const teamSelectionMap = $derived.by(() => {
		const map: Record<string, boolean> = {};
		teams.forEach((team) => (map[team.id] = selectedTargets.teams[team.id] ?? false));
		return map;
	});

	const hasTargetSelected = $derived(
		selectedTargets.personal || Object.values(teamSelectionMap).some((v) => v === true)
	);

	const sortedEmotions = $derived(
		[...emotions].sort((a, b) => b.valence - a.valence) // sort by valence descending
	);

	const requiresComment = $derived.by(() => {
		if (requireComment) return true;
		for (const [teamId, isSelected] of Object.entries(teamSelectionMap)) {
			if (isSelected === true) {
				const team = teams.find((t) => t.id === teamId);
				if (team?.requireComment) return true;
			}
		}
		return false;
	});

	const commentValid = $derived(!requiresComment || comment.trim().length > 0);
	const canSubmit = $derived(
		!!selectedEmotionId &&
			(showAddToCalendar || hasTargetSelected || !!teamId) &&
			commentValid &&
			!isLoading
	);

	function resetForm() {
		selectedEmotionId = undefined;
		comment = '';
		showComment = false;
		// restore initial targets
		selectedTargets.personal = initialTargets.personal ?? true;
		teams.forEach((t) => (selectedTargets.teams[t.id] = initialTargets.teamIds.includes(t.id)));
		teams.forEach((t) => setTeamSharingPreference(t.id, baseTeamSharing[t.id]));
		if (teamId) {
			singleTeamSharing = teamSharingOverrides[teamId] ?? teamSharingDefault;
			singleTeamDirty = false;
		}
	}

	$effect(() => {
		if (!teamId || singleTeamDirty) return;
		const next = teamSharingOverrides[teamId] ?? teamSharingDefault;
		singleTeamSharing = next;
	});

	async function handleSubmit() {
		if (!selectedEmotionId || !canSubmit) return;
		isLoading = true;
		try {
			const dateObj = date ?? new Date();
			const dateStr = toDateString(dateObj) as string;

			const teamIdsFromSelection = Object.entries(teamSelectionMap)
				.filter(([_, v]) => v === true)
				.map(([id]) => id);

			const entriesToCreate: {
				emotionId: string;
				date: string;
				comment?: string;
				teamId?: string;
				isPrivate?: boolean;
				isAnonymous?: boolean;
			}[] = [];

			if (teamId) {
				const preferAnonymous = allowAnonymous && singleTeamSharing === 'anonymous';
				entriesToCreate.push({
					emotionId: selectedEmotionId,
					date: dateStr,
					comment: comment || undefined,
					teamId,
					isPrivate: !!allowPrivate,
					isAnonymous: preferAnonymous
				});
			} else if (teams && teams.length > 0) {
				if (selectedTargets.personal)
					entriesToCreate.push({
						emotionId: selectedEmotionId,
						date: dateStr,
						comment: comment || undefined,
						isPrivate: !!allowPrivate,
						isAnonymous: false
					});
				for (const tid of teamIdsFromSelection)
					entriesToCreate.push({
						emotionId: selectedEmotionId,
						date: dateStr,
						comment: comment || undefined,
						teamId: tid,
						isPrivate: !!allowPrivate,
						isAnonymous: allowAnonymous && getTeamSharingPreference(tid) === 'anonymous'
					});
			} else {
				entriesToCreate.push({
					emotionId: selectedEmotionId,
					date: dateStr,
					comment: comment || undefined,
					isPrivate: !!allowPrivate,
					isAnonymous: false
				});
			}

			const results = await api.moods.createMoodEntries(entriesToCreate);

			// Save preferences if applicable
			if (updatePreferences && teams && teams.length > 0) {
				const selectedTeamIds = teamIdsFromSelection;
				const hasChanged =
					selectedTargets.personal !== initialTargets.personal ||
					selectedTeamIds.length !== initialTargets.teamIds.length ||
					!selectedTeamIds.every((id) => initialTargets.teamIds.includes(id));
				if (hasChanged)
					await api.saveUserPreferences({
						lastQuickMoodTargets: { personal: selectedTargets.personal, teamIds: selectedTeamIds }
					});
			}

			toast.success('Mood saved');
			if (onSuccess) await onSuccess(results);

			await invalidateAll();

			resetForm();
			return results;
		} catch (err) {
			console.error('Failed to submit mood:', err);
			if (onError) onError(err as Error);
			else toast.error((err as Error)?.message ?? 'Failed to save mood');
			throw err;
		} finally {
			isLoading = false;
		}
	}
</script>

<div class="space-y-4">
	<div>
		<h4 class="mb-3 text-sm font-medium">How are you feeling?</h4>
		<TooltipProvider delayDuration={300} skipDelayDuration={0}>
			<div class="flex flex-wrap justify-center gap-2">
				{#each sortedEmotions as emotion (emotion.id)}
					<Tooltip disableHoverableContent={true}>
						<TooltipTrigger
							class={[
								buttonVariants({
									variant: selectedEmotionId === emotion.id ? 'default' : 'outline',
									size: 'icon'
								}),
								'h-12 w-12',
								'relative border-2 transition-all duration-200 hover:scale-110',
								allowAnonymous && teamId && singleTeamSharing === 'anonymous' && 'border-dashed',
								selectedEmotionId === emotion.id && 'shadow-lg ring-2 ring-ring ring-offset-2'
							]}
							style={selectedEmotionId !== emotion.id
								? `border-color: ${emotion.color}30; background-color: ${emotion.color}10;`
								: ''}
							onclick={() => {
								selectedEmotionId = emotion.id;
								if (!requiresComment && !showAddToCalendar) {
									// If not requiring comment and targets are present we still expect next step
								}
								if (requiresComment && !showComment) showComment = true;
								if (showAddToCalendar && !requiresComment) {
									// Auto-submit in compact mode as soon as emotion selected and comment not required
									handleSubmit();
								}
							}}
							disabled={isLoading}
						>
							<span class="text-2xl">{emotion.emoji}</span>
						</TooltipTrigger>
						<TooltipContent side="top">
							<p class="text-xs">{emotion.name} ({emotion.valence})</p>
						</TooltipContent>
					</Tooltip>
				{/each}
			</div>
		</TooltipProvider>
	</div>

	{#if !showAddToCalendar}
		<div class="space-y-4 border-t pt-4">
			{#if selectedEmotionId}
				<div class="space-y-2">
					<p class="text-xs font-medium text-muted-foreground">Add to:</p>
					<div class="space-y-2 rounded-lg border bg-muted/30 p-3">
						<div class="flex items-center space-x-2">
							<Checkbox
								id="personal"
								bind:checked={selectedTargets.personal}
								disabled={isLoading}
								class="h-4 w-4"
							/>
							<Label for="personal" class="cursor-pointer font-medium">Personal Calendar</Label>
						</div>

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
										{#if allowAnonymous}
											<div
												class="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground"
											>
												<span class="tracking-wide uppercase">
													{teamSharingSelection[team.id] === 'anonymous' ? 'Anon' : 'Public'}
												</span>
												<Switch
													checked={teamSharingSelection[team.id] === 'anonymous'}
													disabled={!selectedTargets.teams[team.id] || isLoading}
													onCheckedChange={(checked) =>
														setTeamSharingPreference(team.id, checked ? 'anonymous' : 'public')}
												/>
											</div>
										{/if}
									</div>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				{#if allowAnonymous && teamId}
					<div class="rounded-lg border bg-muted/30 p-3 text-xs">
						<div class="flex items-center justify-between gap-3">
							<div>
								<p class="font-semibold tracking-wide uppercase">Share anonymously</p>
								<p class="text-muted-foreground">Hide your name for this entry</p>
							</div>
							<Switch
								checked={singleTeamSharing === 'anonymous'}
								onCheckedChange={(checked) => {
									singleTeamSharing = checked ? 'anonymous' : 'public';
									singleTeamDirty = true;
								}}
							/>
						</div>
					</div>
				{/if}

				<div class="space-y-2">
					{#if showComment || requiresComment}
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
								disabled={isLoading}>Cancel</Button
							>
							<Button size="sm" onclick={handleSubmit} disabled={!canSubmit}
								>{isLoading ? 'Adding...' : 'Add Mood'}</Button
							>
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
							<Button size="sm" onclick={handleSubmit} disabled={!canSubmit}
								>{isLoading ? 'Adding...' : 'Add Mood'}</Button
							>
						</div>
					{/if}
				</div>
			{:else}
				<p class="text-center text-sm text-muted-foreground">Select an emotion to continue</p>
			{/if}
		</div>
	{:else}
		<!-- Compact mode: Display comment when showing and Save/Cancel small UI -->
		<div class="border-t pt-2">
			{#if showComment}
				<div class="space-y-2">
					<Textarea
						bind:value={comment}
						placeholder="How are you feeling? Any thoughts to share?"
						class={[
							'min-h-20 resize-none text-sm',
							requireComment && !comment.trim() ? 'border-orange-400' : ''
						]}
						autofocus
					/>
					{#if requireComment && !comment.trim()}
						<p class="flex items-center space-x-2 text-xs font-medium text-orange-600">
							<MessageCircle class="mr-1 inline-block h-3 w-3" />
							Comment is required
						</p>
					{/if}
					<div class="flex justify-end gap-2">
						{#if allowAnonymous && teamId}
							<button
								type="button"
								aria-pressed={singleTeamSharing === 'anonymous'}
								title={singleTeamSharing === 'anonymous'
									? 'Disable anonymous sharing'
									: 'Enable anonymous sharing'}
								class={`flex items-center rounded-full border px-2 py-1 text-xs transition ${
									singleTeamSharing === 'anonymous'
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-muted-foreground/30 bg-muted text-muted-foreground'
								}`}
								disabled={isLoading}
								onclick={() => {
									singleTeamSharing = singleTeamSharing === 'anonymous' ? 'public' : 'anonymous';
									singleTeamDirty = true;
								}}
							>
								<Ghost class="h-3.5 w-3.5" />
							</button>
						{/if}
						<Button
							variant="ghost"
							size="sm"
							onclick={() => {
								showComment = false;
								comment = '';
							}}>Cancel</Button
						>
						<Button size="sm" onclick={handleSubmit} disabled={!canSubmit}
							>{isLoading ? 'Saving...' : 'Save'}</Button
						>
					</div>
				</div>
			{:else}
				<div class="flex items-center">
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
					<div class="ml-auto flex items-center gap-2">
						{#if allowAnonymous && teamId}
							<button
								type="button"
								aria-pressed={singleTeamSharing === 'anonymous'}
								aria-label={singleTeamSharing === 'anonymous'
									? 'Disable anonymous sharing'
									: 'Enable anonymous sharing'}
								title={singleTeamSharing === 'anonymous'
									? 'Disable anonymous sharing'
									: 'Enable anonymous sharing'}
								class={`flex items-center rounded-full border px-2 py-1 text-xs transition ${
									singleTeamSharing === 'anonymous'
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-muted-foreground/30 bg-muted text-muted-foreground'
								}`}
								disabled={isLoading}
								onclick={() => {
									singleTeamSharing = singleTeamSharing === 'anonymous' ? 'public' : 'anonymous';
									singleTeamDirty = true;
								}}
							>
								{#if showComment}
									<MessageCircle class="h-3.5 w-3.5" />
								{:else}
									<Ghost class="h-3.5 w-3.5" />
								{/if}
							</button>
						{/if}
						{#if selectedEmotionId}
							<Button
								size="sm"
								onclick={handleSubmit}
								disabled={isLoading || (requireComment && !showComment)}
							>
								{isLoading ? 'Saving...' : 'Save'}
							</Button>
						{/if}
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
