<script lang="ts">
	import { goto, invalidateAll } from '$app/navigation';
	import MoodEntryDialog from '$lib/components/MoodEntryDialog.svelte';
	import MoodWeekRow from '$lib/components/MoodWeekRow.svelte';
	import StatCard from '$lib/components/StatCard.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import WeekNavigator from '$lib/components/WeekNavigator.svelte';
	import type { MoodEntryWithDetails } from '$lib/types';
	import { formatDate, formatMonthYear, getWeekDays, toDate, toDateString } from '$lib/utils/date';
	import { BarChart3, Heart, Plus } from '@lucide/svelte';

	let { data } = $props();

	let weekStart = $derived(toDate(data.weekStart) || new Date());
	let weekDays = $derived(getWeekDays(weekStart));

	let showMoodDialog = $state(false);
	let selectedDate = $state(new Date());
	let selectedMood = $state<MoodEntryWithDetails | undefined>(undefined);
	let isSubmitting = $state(false);

	function getMoodForDate(date: Date): MoodEntryWithDetails[] {
		const dateStr = toDateString(date);
		if (!dateStr) return [];

		return data.moodEntries.filter((entry: MoodEntryWithDetails) => {
			const entryDateStr = toDateString(entry.date);
			return entryDateStr === dateStr;
		});
	}

	function getEmotionById(id: string) {
		return data.emotions.find((e) => e.id === id);
	}

	let totalEntries = $derived(data.moodEntries.length);
	let uniqueDays = $derived(
		new Set(
			data.moodEntries
				.map((e: MoodEntryWithDetails) => toDateString(e.date))
				.filter((d): d is string => d !== null)
		).size
	);
	let entriesWithComments = $derived(
		data.moodEntries.filter((e: MoodEntryWithDetails) => e.comment)
	);

	function openMoodDialog(date?: Date, mood?: MoodEntryWithDetails) {
		selectedDate = date || new Date();
		selectedMood = mood;
		showMoodDialog = true;
	}

	async function handleQuickMood(emotionId: string, date: Date, userId: string, comment?: string) {
		if (isSubmitting) return;

		isSubmitting = true;
		try {
			const response = await fetch('/api/mood-entries', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					emotionId,
					// Send local date string to avoid timezone drift
					date: toDateString(date),
					teamId: null,
					...(comment && { comment })
				})
			});

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Failed to save mood entry:', errorData);
				throw new Error(errorData.error || 'Failed to save mood entry');
			}

			await invalidateAll();
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
			selectedMood = undefined;
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
			selectedMood = undefined;
		} catch (error) {
			console.error('Error deleting mood:', error);
			throw error;
		} finally {
			isSubmitting = false;
		}
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
					// Send local date string to avoid timezone drift
					date: toDateString(selectedDate),
					teamId: null
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
</script>

<svelte:head>
	<title>Personal Calendar - Sentio</title>
</svelte:head>

<div class="container mx-auto max-w-6xl space-y-6 px-4 py-8">
	<!-- Header -->
	<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
		<div>
			<h1 class="flex items-center gap-2 text-3xl font-bold">
				<Heart class="h-8 w-8" />
				Personal Calendar
			</h1>
			<p class="text-muted-foreground">Track your personal mood journey</p>
		</div>
		<div class="flex gap-2">
			<Button href="/personal/analytics" variant="outline">
				<BarChart3 class="mr-2 h-4 w-4" />
				Analytics
			</Button>
			<Button onclick={() => openMoodDialog()}>
				<Plus class="mr-2 h-4 w-4" />
				Add Mood Entry
			</Button>
		</div>
	</div>

	<!-- Stats -->
	<div class="grid gap-4 md:grid-cols-3">
		<StatCard
			title="This Week"
			value={`${totalEntries}${totalEntries === 1 ? ' entry' : ' entries'}`}
		/>
		<StatCard title="Days Logged" value={`${uniqueDays} / 7`} />
		<StatCard title="Streak" value="Coming soon" />
	</div>

	<!-- Week Navigation -->
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<CardTitle>{formatMonthYear(weekStart)}</CardTitle>
				<WeekNavigator weekStart={data.weekStart} basePath={'/personal'} />
			</div>
		</CardHeader>
		<CardContent>
			<MoodWeekRow
				days={weekDays}
				emotions={data.emotions}
				entries={data.moodEntries}
				onQuickAdd={handleQuickMood}
				onEdit={(date, entry) => openMoodDialog(date, entry)}
				{isSubmitting}
				allowAdd={true}
				allowEdit={true}
				showDayHeader={true}
				userId={data.user.id}
			/>
		</CardContent>
	</Card>

	<!-- Recent Entries with Comments -->
	{#if entriesWithComments.length > 0}
		<Card>
			<CardHeader>
				<CardTitle>Recent Notes</CardTitle>
			</CardHeader>
			<CardContent class="space-y-4">
				{#each entriesWithComments.slice(0, 5) as entry}
					{@const emotion = getEmotionById(entry.emotionId)}
					{@const entryDate = toDate(entry.date)}
					<div class="flex gap-3 rounded-lg border p-3">
						{#if emotion && entryDate}
							<div class="text-3xl">{emotion.emoji}</div>
							<div class="flex-1">
								<div class="flex items-center gap-2">
									<span class="font-medium">{emotion.name}</span>
									<span class="text-sm text-muted-foreground">
										{formatDate(entryDate, {
											weekday: 'short',
											month: 'short',
											day: 'numeric'
										})}
									</span>
									{#if entry.timeOfDay}
										<Badge variant="outline">{entry.timeOfDay}</Badge>
									{/if}
								</div>
								<p class="mt-1 text-sm text-muted-foreground">{entry.comment}</p>
							</div>
						{/if}
					</div>
				{/each}
			</CardContent>
		</Card>
	{/if}
</div>

<!-- Mood Entry Dialog -->
<MoodEntryDialog
	bind:open={showMoodDialog}
	emotions={data.emotions}
	{selectedDate}
	requireComment={false}
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
