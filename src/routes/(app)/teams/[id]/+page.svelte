<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import CalendarContainer from '$lib/components/calendar/CalendarContainer.svelte';
	import MoodEntryDialog from '$lib/components/MoodEntryDialog.svelte';
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
		getVisibilityValueText
	} from '$lib/utils';
	import { getWeekDaysFromUTCStart, toDate, toDateString, toYMD } from '$lib/utils/date';
	import { BarChart3, Calendar, ChevronLeft, Settings, UserPlus, Users } from '@lucide/svelte';

	let { data } = $props();

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
		selectedDate = date;
		selectedMood = mood || null;
		showMoodDialog = true;
	}

	async function handleSaveMood(moodData: {
		emotionId: string;
		comment?: string;
		timeOfDay?: string;
		isPrivate?: boolean;
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

<div class="container mx-auto space-y-6 px-4 py-8">
	<!-- Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div class="space-y-1">
			<div class="flex items-center gap-3">
				<Button href="/teams" variant="ghost" size="icon">
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
			<Button href="/teams/{data.team.id}/analytics" variant="outline">
				<BarChart3 class="mr-2 h-4 w-4" />
				Analytics
			</Button>
			{#if data.isAdmin}
				<Button href="/teams/{data.team.id}/members" variant="outline">
					<UserPlus class="mr-2 h-4 w-4" />
					Manage Members
				</Button>
				<Button href="/teams/{data.team.id}/settings" variant="outline">
					<Settings class="mr-2 h-4 w-4" />
					Settings
				</Button>
			{/if}
		</div>
	</div>

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

	<!-- Team Calendar -->
	<CalendarContainer
		teamId={data.team.id}
		{weekStart}
		{weekDays}
		teamMembers={data.team.members}
		emotions={data.emotions}
		entries={data.entries}
		currentUserId={data.currentUserId}
		showWeekends={data.team.showWeekends}
		requireComment={data.team.requireComment}
		defaultView={data.defaultView}
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
					<div class="flex items-center gap-3 rounded-lg border p-3">
						<Avatar>
							<AvatarImage src={member.user.image ?? undefined} alt={member.user.name} />
							<AvatarFallback>{getUserInitials(member.user.name)}</AvatarFallback>
						</Avatar>
						<div class="min-w-0 flex-1">
							<div class="truncate font-medium">{member.user.name}</div>
							<div class="truncate text-sm text-muted-foreground">{member.user.email}</div>
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
	requireComment={data.team.requireComment}
	onSave={handleSaveMood}
	entry={selectedMood
		? {
				id: selectedMood.id,
				emotionId: selectedMood.emotionId,
				comment: selectedMood.comment ?? undefined,
				timeOfDay: selectedMood.timeOfDay ?? undefined,
				isPrivate: selectedMood.isPrivate
			}
		: undefined}
	onUpdate={handleUpdateMood}
	onDelete={handleDeleteMood}
/>
