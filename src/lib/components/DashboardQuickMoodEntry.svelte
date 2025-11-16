<script lang="ts">
	import MoodEntryForm from '$lib/components/MoodEntryForm.svelte';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import type { Emotion, Team, UserPreferences } from '$lib/types';
	import { Heart } from '@lucide/svelte';

	type Props = {
		emotions: Emotion[];
		teams: Team[];
		preferences?: UserPreferences | null;
	};

	let { emotions, teams, preferences }: Props = $props();

	// Load last used targets from preferences, or use defaults
	let lastTargets = $derived(preferences?.settings?.lastQuickMoodTargets);
	let initialPersonal = $derived(lastTargets?.personal ?? true);
	let initialTeamIds = $derived(lastTargets?.teamIds ?? []);

	// Initialize teams state with last used selections
	const initialTeams: Record<string, boolean> = {};
	teams.forEach((team) => {
		initialTeams[team.id] = initialTeamIds.includes(team.id);
	});
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
		<MoodEntryForm
			{emotions}
			{teams}
			initialTargets={{ personal: initialPersonal, teamIds: initialTeamIds }}
		/>
	</CardContent>
</Card>
