<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import CalendarContainer from '$lib/components/calendar/CalendarContainer.svelte';
	import MoodEntryDialog from '$lib/components/MoodEntryDialog.svelte';
	import ShareMoodSetting from '$lib/components/settings/sharing/ShareMoodSetting.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import type { MoodEntryWithDetails } from '$lib/types';
	import {
		getUserInitials,
		getVisibilityDescription,
		getVisibilityIcon,
		getVisibilityValueText,
		isAnonymousUser
	} from '$lib/utils';
	import { getWeekDaysFromUTCStart, toDate, toDateString, toYMD } from '$lib/utils/date';
	import { BarChart3, Calendar, ChevronLeft, Settings, UserPlus, Users, Network } from '@lucide/svelte';
	import { fly, fade } from 'svelte/transition';
	import TeamBreadcrumbs from '$lib/components/TeamBreadcrumbs.svelte';

	let { data } = $props();

	let teamSharingPreference = $state(data.teamSharingPreference);
	let teamSharingSaving = $state(false);
	let teamSharingError = $state<string | null>(null);
	let calendarMembers = $derived.by(() => {
		const combined = [...data.team.members, ...(data.anonymousMembers ?? [])];
		return combined.sort((a, b) => {
			const aAnon = isAnonymousUser(a.userId);
			const bAnon = isAnonymousUser(b.userId);
			if (aAnon && !bAnon) return 1;
			if (!aAnon && bAnon) return -1;
			return a.user.name.localeCompare(b.user.name);
		});
	});

	let weekStart = $derived(toDate(data.weekStart) || new Date());
	let weekDays = $derived(getWeekDaysFromUTCStart(weekStart));

	let showMoodDialog = $state(false);
	let selectedDate = $state(new Date());
	let selectedMood: MoodEntryWithDetails | null = $state(null);
	let isSubmitting = $state(false);

	async function handleWeekChange(direction: 'prev' | 'next') {
		const base = weekStart;
		const delta = direction === 'prev' ? -7 : 7;
		const newWeekStart = new Date(base);
		newWeekStart.setUTCDate(base.getUTCDate() + delta);
		const ymd = toYMD(newWeekStart);
		await goto(`/teams/${data.team.id}?weekStart=${ymd}`);
	}

	function openMoodDialog(date: Date, mood?: MoodEntryWithDetails) {
		// Prevent mood logging on container teams
		if (data.team.isContainer) {
			return;
		}
		selectedDate = date;
		selectedMood = mood || null;
		showMoodDialog = true;
	}

	async function handleSaveMood(moodData: {
		emotionId: string;
		comment?: string;
		timeOfDay?: string;
		isPrivate?: boolean;
		isAnonymous?: boolean;
	}) {
		if (isSubmitting) return;

		isSubmitting = true;
		try {
			const response = await fetch('/api/mood-entries', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					...moodData,
					// Send local date string to avoid TZ drift
					date: toDateString(selectedDate),
					teamId: data.team.id
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Failed to save mood entry:', errorData);
				throw new Error(errorData.error || 'Failed to save mood entry');
			}

			await invalidateAll();
			showMoodDialog = false;
		} catch (error) {
			console.error('Error saving mood:', error);
			throw error;
		} finally {
			isSubmitting = false;
		}
	}

	async function handleUpdateMood(
		id: string,
		moodData: {
			emotionId: string;
			comment?: string;
			timeOfDay?: string;
			isPrivate?: boolean;
			isAnonymous?: boolean;
		}
	) {
		if (isSubmitting) return;
		isSubmitting = true;
		try {
			const response = await fetch(`/api/mood-entries/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(moodData)
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Failed to update mood entry:', errorData);
				throw new Error(errorData.error || 'Failed to update mood entry');
			}

			await invalidateAll();
			showMoodDialog = false;
			selectedMood = null;
		} catch (error) {
			console.error('Error updating mood:', error);
			throw error;
		} finally {
			isSubmitting = false;
		}
	}

	async function handleDeleteMood(id: string) {
		if (isSubmitting) return;
		isSubmitting = true;
		try {
			const response = await fetch(`/api/mood-entries/${id}`, { method: 'DELETE' });
			if (!response.ok) {
				const errorData = await response.json();
				console.error('Failed to delete mood entry:', errorData);
				throw new Error(errorData.error || 'Failed to delete mood entry');
			}
			await invalidateAll();
			showMoodDialog = false;
			selectedMood = null;
		} catch (error) {
			console.error('Error deleting mood:', error);
			throw error;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>{data.team.name} - Team Dashboard - Sentio</title>
</svelte:head>

<div class="container mx-auto space-y-6 px-4 py-8" in:fade={{ duration: 300 }}>
	<TeamBreadcrumbs ancestors={data.ancestors} currentTeam={data.team} />

	<!-- Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="space-y-1">
			<div class="flex items-center gap-3">
				<Button href="/teams" variant="ghost" size="icon" class="rounded-full hover:bg-muted">
					<ChevronLeft class="h-4 w-4" />
				</Button>
				<div>
					<h1 class="text-3xl font-bold">{data.team.name}</h1>
					{#if data.team.description}
						<p class="text-muted-foreground">{data.team.description}</p>
					{/if}
				</div>
			</div>
		</div>

		<div class="flex gap-2">
			<Button
				href="/teams/{data.team.id}/analytics"
				variant="outline"
				class="transition-all hover:border-primary hover:text-primary"
			>
				<BarChart3 class="mr-2 h-4 w-4" />
				Analytics
			</Button>
			{#if data.isAdmin}
				<Button
					href="/teams/{data.team.id}/members"
					variant="outline"
					class="transition-all hover:bg-muted"
				>
					<UserPlus class="mr-2 h-4 w-4" />
					Manage Members
				</Button>
				<Button
					href="/teams/{data.team.id}/settings"
					variant="outline"
					class="transition-all hover:bg-muted"
				>
					<Settings class="mr-2 h-4 w-4" />
					Settings
				</Button>
			{/if}
		</div>
	</div>

	<!-- Subteams -->
	{#if data.children && data.children.length > 0}
		<Card>
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<Network class="h-5 w-5" />
					Subteams
				</CardTitle>
				<CardDescription>Teams nested under {data.team.name}</CardDescription>
			</CardHeader>
			<CardContent>
				<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{#each data.children as child}
						<a
							href="/teams/{child.id}"
							class="group flex flex-col gap-1 rounded-lg border p-4 transition-all hover:border-primary/50 hover:bg-muted/30 hover:shadow-sm"
						>
							<div class="font-medium group-hover:text-primary">{child.name}</div>
							{#if child.description}
								<div class="line-clamp-1 text-sm text-muted-foreground">{child.description}</div>
							{/if}
						</a>
					{/each}
				</div>
			</CardContent>
		</Card>
	{/if}

	<!-- Team Info -->
	<div class="grid gap-4 md:grid-cols-3">
		<StatCard
			title="Members"
			value={data.team.memberCount}
			subtitle="Active team members"
			icon={Users}
		/>
		<StatCard
			title="Visibility"
			value={getVisibilityValueText(data.team.visibility)}
			subtitle={getVisibilityDescription(data.team.visibility)}
			icon={getVisibilityIcon(data.team.visibility)}
		/>
		<StatCard
			title="This Week"
			value={data.entries.length}
			subtitle="Mood entries logged"
			icon={Calendar}
		/>
	</div>

	<!-- Personal Sharing Preference -->
	<Card>
		<CardHeader class="pb-3">
			<CardTitle class="text-base">Your sharing preference</CardTitle>
			<CardDescription>Choose how your mood entries appear to this team by default</CardDescription>
		</CardHeader>
		<CardContent class="space-y-2">
			<ShareMoodSetting
				teamId={data.team.id}
				teamSharingPreference={data.teamSharingPreference}
				teamSharingOverrides={data.teamSharingOverrides}
			/>
		</CardContent>
	</Card>

	<!-- Team Calendar -->
	<CalendarContainer
		teamId={data.team.id}
		{weekStart}
		{weekDays}
		teamMembers={calendarMembers}
		emotions={data.emotions}
		entries={data.entries}
		currentUserId={data.currentUserId}
		showWeekends={data.team.showWeekends}
		requireComment={data.team.requireComment}
		defaultView={data.defaultView}
		{teamSharingPreference}
		isContainer={data.team.isContainer}
		childTeams={data.childTeamsData}
		onWeekChange={handleWeekChange}
		onEdit={(date, entry, userId) => openMoodDialog(date, entry)}
		{isSubmitting}
	/>

	<!-- Team Members -->
	<Card>
		<CardHeader>
			<CardTitle>Team Members</CardTitle>
			<CardDescription>
				{data.team.memberCount}
				{data.team.memberCount === 1 ? 'member' : 'members'}
			</CardDescription>
		</CardHeader>
		<CardContent>
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
				{#each data.team.members as member (member.userId)}
					<div
						class="flex items-center gap-3 rounded-lg border p-3 transition-all hover:bg-muted/30 hover:shadow-sm"
					>
						<Avatar>
							<AvatarImage src={member.user.image ?? undefined} alt={member.user.name} />
							<AvatarFallback>{getUserInitials(member.user.name)}</AvatarFallback>
						</Avatar>
						<div class="min-w-0 flex-1">
							<div class="truncate font-medium">{member.user.name}</div>
							<div class="truncate text-sm text-muted-foreground">
								{member.user.email || 'Hidden email'}
							</div>
						</div>
						{#if member.role === 'admin'}
							<Badge variant="secondary">Admin</Badge>
						{/if}
					</div>
				{/each}
			</div>
		</CardContent>
	</Card>
</div>

<!-- Mood Entry Dialog -->
<MoodEntryDialog
	bind:open={showMoodDialog}
	emotions={data.emotions}
	teamId={data.team.id}
	{selectedDate}
	allowPrivate={false}
	allowAnonymous={true}
	defaultAnonymous={teamSharingPreference === 'anonymous'}
	requireComment={data.team.requireComment}
	onSave={handleSaveMood}
	entry={selectedMood
		? {
				id: selectedMood.id,
				emotionId: selectedMood.emotionId,
				comment: selectedMood.comment ?? undefined,
				timeOfDay: selectedMood.timeOfDay ?? undefined,
				isPrivate: selectedMood.isPrivate,
				isAnonymous: selectedMood.isAnonymous
			}
		: undefined}
	onUpdate={handleUpdateMood}
	onDelete={handleDeleteMood}
/>
