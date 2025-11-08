<script lang="ts">
	import NikoNikoCalendar from '$lib/components/NikoNikoCalendar.svelte';
	import type { EmotionWithIcon } from '$lib/data/emotions';
	import { mapEmotionsWithIcons } from '$lib/utils/emotion-icons';
	import { getNextWeek, getPreviousWeek, getWeekStart } from '$lib/utils/date';
	import type { PageData } from './$types';
	import type { WeekData } from '$lib/types';
	import { invalidateAll } from '$app/navigation';

	type Props = {
		data: PageData;
	};
	let { data }: Props = $props();

	let currentWeekStart = $state(getWeekStart(new Date()));
	let selectedEmotionFilter = $state<EmotionWithIcon | undefined>(undefined);

	// Map database emotions to EmotionWithIcon with Lucide icons
	const emotionsWithIcons = mapEmotionsWithIcons(data.emotions);
	const emotionsMap = new Map(emotionsWithIcons.map((e) => [e.id, e]));

	// Generate week days from current week start
	function generateWeekDays(weekStart: Date, includeWeekends: boolean): Date[] {
		const days: Date[] = [];
		for (let i = 0; i < 7; i++) {
			const day = new Date(weekStart);
			day.setDate(weekStart.getDate() + i);

			// Skip Saturday (6) and Sunday (0) if weekends are disabled
			if (!includeWeekends && (day.getDay() === 0 || day.getDay() === 6)) {
				continue;
			}

			days.push(day);
		}
		return days;
	}

	// Build week data from server data
	let weekData: WeekData = $derived.by(() => {
		const teamMembers = data.members.map((member) => {
			const memberEntries = data.entries
				.filter((e) => e.userId === member.id)
				.map((entry) => {
					const emotionWithIcon = emotionsMap.get(entry.emotionId) || emotionsWithIcons[0];

					return {
						id: entry.id,
						userId: entry.userId,
						emotionId: entry.emotionId,
						date: new Date(entry.date),
						emotion: emotionWithIcon,
						comment: entry.comment || undefined,
						createdAt: new Date(entry.createdAt),
						updatedAt: new Date(entry.updatedAt)
					};
				});

			return {
				id: member.id,
				name: member.name,
				entries: memberEntries
			};
		});

		return {
			weekDays: generateWeekDays(currentWeekStart, data.showWeekends),
			teamMembers
		};
	});

	async function handleEmotionSelect(emotion: EmotionWithIcon, date: Date, memberId: string) {
		// Only allow editing own entries
		if (memberId !== data.currentUserId) {
			console.error("Cannot edit another user's mood");
			return;
		}

		const dbEmotion = data.emotions.find(
			(e) => e.name.toLowerCase() === emotion.name.toLowerCase()
		);
		if (!dbEmotion) {
			console.error('Emotion not found in database');
			return;
		}

		try {
			const response = await fetch('/api/mood-entries', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					emotionId: dbEmotion.id,
					date: date.toISOString()
				})
			});

			const result = await response.json();
			if (response.ok) {
				window.location.reload();
			} else {
				console.error('Failed to save emotion:', result);
				alert('Failed to save mood: ' + (result.error || 'Unknown error'));
			}
		} catch (error) {
			console.error('Failed to save emotion:', error);
			alert('Failed to save mood. Please try again.');
		}
	}

	async function handleCommentSave(comment: string, date: Date, memberId: string) {
		// Only allow editing own entries
		if (memberId !== data.currentUserId) {
			console.error("Cannot edit another user's comment");
			return;
		}

		const entry = data.entries.find(
			(e) => e.userId === memberId && new Date(e.date).toDateString() === date.toDateString()
		);

		// If no entry exists, we need to create one with just a comment - use first emotion as default
		const emotionId = entry ? entry.emotionId : data.emotions[0]?.id;

		if (!emotionId) return;

		try {
			const response = await fetch('/api/mood-entries', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					emotionId,
					date: date.toISOString(),
					comment
				})
			});

			if (response.ok) {
				invalidateAll();
			}
		} catch (error) {
			console.error('Failed to save comment:', error);
		}
	}

	function handleEmotionFilterChange(emotion?: EmotionWithIcon) {
		selectedEmotionFilter = emotion;
	}

	function handleWeekChange(direction: 'prev' | 'next') {
		if (direction === 'prev') {
			currentWeekStart = getPreviousWeek(currentWeekStart);
		} else {
			currentWeekStart = getNextWeek(currentWeekStart);
		}
	}
</script>

<svelte:head>
	<title>Niko-Niko Calendar</title>
	<meta name="description" content="Team mood tracking calendar" />
</svelte:head>

<div class="container mx-auto px-3 py-4 md:px-6 md:py-10">
	<NikoNikoCalendar
		{weekData}
		emotions={emotionsWithIcons}
		currentUserId={data.currentUserId}
		selectedEmotion={selectedEmotionFilter}
		onEmotionSelect={handleEmotionSelect}
		onCommentSave={handleCommentSave}
		onEmotionFilterChange={handleEmotionFilterChange}
		onWeekChange={handleWeekChange}
	/>
</div>
