<script lang="ts">
	import CalendarSettings from '$lib/components/settings/calendar/CalendarSettings.svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Switch } from '$lib/components/ui/switch';
	import { SETTINGS_SECTIONS, getSettingLabel } from '$lib/settings/settings.js';
	import { ArrowLeft, Check } from '@lucide/svelte';
	import RemindersManager from '$lib/components/RemindersManager.svelte';
	import NotificationSettings from '$lib/components/NotificationSettings.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Create a reactive state object for all settings with proper typing
const settings: Record<string, string | boolean> = $state({
	name: data.user?.name || '',
	timezone: data.user?.timezone || 'UTC',
	theme: (data.preferences?.settings?.theme as string) || 'system',
	defaultView: (data.preferences?.settings?.defaultView as string) || 'week',
	teamSharingDefault: (data.preferences?.settings?.teamSharingDefault as string) || 'public',
	enableNotifications: (data.preferences?.settings?.enableNotifications as boolean) ?? true,
	personalMode: (data.user?.personalMode as boolean) ?? false,
	startPage: (data.preferences?.settings?.startPage as string) || '/'
});

	let saveStatus = $state<'idle' | 'success' | 'error'>('idle');
	let saveTimeout: ReturnType<typeof setTimeout> | undefined;

	function showSaveSuccess() {
		saveStatus = 'success';
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			saveStatus = 'idle';
		}, 2000);
	}

	function showSaveError() {
		saveStatus = 'error';
		clearTimeout(saveTimeout);
		saveTimeout = setTimeout(() => {
			saveStatus = 'idle';
		}, 3000);
	}

	async function submitSettings() {
		try {
			const response = await fetch('/api/settings', {
				method: 'POST',
				body: JSON.stringify($state.snapshot(settings))
			});

			const result = await response.json();
			if (result.success && result.preferences?.settings) {
				showSaveSuccess();
			} else {
				showSaveError();
			}
		} catch (error) {
			console.error('Failed to save settings:', error);
			showSaveError();
		}
	}

	// Format start page label with team names
	function formatStartPageWithTeams(path: string): string {
		const labels: Record<string, string> = {
			'/': 'Dashboard',
			'/personal': 'Personal',
			'/teams': 'Teams List'
		};

		if (labels[path]) return labels[path];

		// Check if it's a team path and get team name
		if (path.startsWith('/teams/')) {
			const teamId = path.replace('/teams/', '');
			const team = data.teams?.find((t) => t.id === teamId);
			return team ? `Team: ${team.name}` : path;
		}

		return path;
	}
</script>

<svelte:head>
	<title>Settings - Sentio</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-6 px-4 py-8">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<Button href="/" variant="ghost" size="icon">
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold">Settings</h1>
			<p class="text-muted-foreground">Manage your account and application settings</p>
		</div>
	</div>

	<!-- Status Messages -->
	{#if saveStatus === 'success'}
		<div
			class="flex items-center gap-2 rounded-lg border border-green-500 bg-green-50 p-4 text-green-900 dark:bg-green-950 dark:text-green-100"
		>
			<Check class="h-4 w-4" />
			Settings saved successfully
		</div>
	{:else if saveStatus === 'error'}
		<div
			class="rounded-lg border border-red-500 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100"
		>
			Failed to save settings. Please try again.
		</div>
	{/if}

	<!-- Dynamic Settings Sections -->
	<div class="space-y-6">
		{#each SETTINGS_SECTIONS as section (section.id)}
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<section.icon class="h-5 w-5" />
						{section.title}
					</CardTitle>
					<CardDescription>{section.description}</CardDescription>
				</CardHeader>
				<CardContent>
					<div class="space-y-6">
						{#each section.fields as field (field.id)}
							{#if field.type === 'select'}
								<div class="space-y-2">
									<Label for={field.id}>{field.label}</Label>
									<Select
										name={field.id}
										type="single"
										value={String(settings[field.id]) || String(field.defaultValue)}
										onValueChange={(value) => {
											settings[field.id] = value;
											submitSettings();
										}}
									>
										<SelectTrigger>
											{field.id === 'startPage'
												? formatStartPageWithTeams(String(settings[field.id]))
												: getSettingLabel(field.id, String(settings[field.id]))}
										</SelectTrigger>
										<SelectContent>
											{#if field.options}
												{#each field.options as option (option.value)}
													<SelectItem value={option.value}>{option.label}</SelectItem>
												{/each}
											{/if}
											{#if field.id === 'startPage' && data.teams}
												{#each data.teams as team (team.id)}
													<SelectItem value={`/teams/${team.id}`}>Team: {team.name}</SelectItem>
												{/each}
											{/if}
										</SelectContent>
									</Select>
									<p class="mt-1 text-xs text-muted-foreground">{field.description}</p>
								</div>
							{:else if field.type === 'toggle'}
								<div class="flex items-center justify-between">
									<div class="space-y-0.5">
										<Label>{field.label}</Label>
										<p class="text-sm text-muted-foreground">{field.description}</p>
									</div>
									<Switch
										name={field.id === 'personalMode' ? 'enabled' : field.id}
										checked={Boolean(settings[field.id])}
										onCheckedChange={(checked) => {
											settings[field.id] = checked;
											submitSettings();
										}}
									/>
								</div>
							{/if}
						{/each}
					</div>
				</CardContent>
			</Card>
		{/each}

		<NotificationSettings
			vapidPublicKey={data.vapidPublicKey}
			currentUser={data.user}
			initialIsSubscribed={data.hasPushSubscription}
		/>

		<RemindersManager reminders={data.reminders} />

		<CalendarSettings
			userId={data.user.id}
			calendarAccounts={data.calendarAccounts}
			enableEventNotifications={data.enableEventNotifications}
		/>
	</div>
</div>
