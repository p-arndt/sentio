<script lang="ts">
	import CalendarSettings from '$lib/components/settings/calendar/CalendarSettings.svelte';
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
	import { Check } from '@lucide/svelte';
	import RemindersManager from '$lib/components/RemindersManager.svelte';
	import NotificationSettings from '$lib/components/NotificationSettings.svelte';
	import { Tabs, TabsContent, TabsList, TabsTrigger } from '$lib/components/ui/tabs';
	import { Button } from '$lib/components/ui/button';
	import { showNotificationPopup } from '$lib/client/notification-popup';
	import { Bell } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import {
		enableAutostart,
		disableAutostart,
		checkAutostartEnabled
	} from '$lib/client/autostart';
	import type { PageData } from './$types';
	import { blur } from 'svelte/transition';

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
	
	// Autostart state (Tauri only)
	let autostartEnabled = $state(false);
	let isCheckingAutostart = $state(true);
	let isTauri = $state(false);
	
	onMount(async () => {
		// Check if we're in Tauri
		if (typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window) {
			isTauri = true;
			try {
				autostartEnabled = await checkAutostartEnabled();
			} catch (error) {
				console.error('Failed to check autostart status:', error);
			} finally {
				isCheckingAutostart = false;
			}
		} else {
			isCheckingAutostart = false;
		}
	});

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

	async function testNotificationPopup() {
		try {
			await showNotificationPopup({
				title: 'Mood Reminder',
				message: 'How are you feeling right now?',
				autoHide: false,
				showMoods: true
			});
		} catch (error) {
			console.error('Failed to show notification:', error);
		}
	}
	
	async function toggleAutostart(enabled: boolean) {
		try {
			if (enabled) {
				await enableAutostart();
				autostartEnabled = true;
			} else {
				await disableAutostart();
				autostartEnabled = false;
			}
		} catch (error) {
			console.error('Failed to toggle autostart:', error);
		}
	}
</script>

<svelte:head>
	<title>Settings - Sentio</title>
</svelte:head>

<div class="container mx-auto max-w-5xl px-4 py-6" in:blur>
	<!-- Header -->
	<div class="mb-6">
		<h1 class="text-3xl font-bold mb-2">Settings</h1>
		<p class="text-muted-foreground">Manage your account and preferences</p>
	</div>

	<!-- Status Messages -->
	{#if saveStatus === 'success'}
		<div class="mb-6 flex items-center gap-2 rounded-lg border border-green-500/50 bg-green-50 p-4 text-green-900 dark:bg-green-950 dark:text-green-100">
			<Check class="h-4 w-4" />
			Settings saved successfully
		</div>
	{:else if saveStatus === 'error'}
		<div class="mb-6 rounded-lg border border-red-500/50 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100">
			Failed to save settings. Please try again.
		</div>
	{/if}

	<!-- Settings Tabs -->
	<Tabs value="general" class="w-full">
		<TabsList class="grid w-full grid-cols-4 mb-6">
			<TabsTrigger value="general">General</TabsTrigger>
			<TabsTrigger value="notifications">Notifications</TabsTrigger>
			<TabsTrigger value="reminders">Reminders</TabsTrigger>
			<TabsTrigger value="calendar">Calendar</TabsTrigger>
		</TabsList>

		<!-- General Settings -->
		<TabsContent value="general" class="space-y-6">
			<!-- Autostart Setting (Tauri only) -->
			{#if isTauri}
				<Card>
					<CardHeader>
						<CardTitle>Startup</CardTitle>
						<CardDescription>Configure how Sentio starts with your system</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="flex items-center justify-between rounded-lg border p-4">
							<div class="space-y-0.5">
								<Label>Start with system</Label>
								<p class="text-sm text-muted-foreground">
									Automatically launch Sentio when your computer starts
								</p>
							</div>
							{#if isCheckingAutostart}
								<div class="text-sm text-muted-foreground">Checking...</div>
							{:else}
								<Switch
									checked={autostartEnabled}
									onCheckedChange={(checked) => toggleAutostart(checked)}
								/>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/if}
			
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
														<SelectItem value={option.value}>
															<option.icon class="mr-2 inline-block h-4 w-4" />
															{option.label}
														</SelectItem>
													{/each}
												{/if}
												{#if field.id === 'startPage' && data.teams}
													{#each data.teams as team (team.id)}
														<SelectItem value={`/teams/${team.id}`}>Team: {team.name}</SelectItem>
													{/each}
												{/if}
											</SelectContent>
										</Select>
										<p class="text-xs text-muted-foreground">{field.description}</p>
									</div>
								{:else if field.type === 'toggle'}
									<div class="flex items-center justify-between rounded-lg border p-4">
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
		</TabsContent>

		<!-- Notifications -->
		<TabsContent value="notifications" class="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle>Push Notifications</CardTitle>
					<CardDescription>Configure browser push notifications</CardDescription>
				</CardHeader>
				<CardContent>
					<NotificationSettings
						vapidPublicKey={data.vapidPublicKey}
						currentUser={data.user}
						initialIsSubscribed={data.hasPushSubscription}
					/>
				</CardContent>
			</Card>

			<!-- Test Notification Popup (Tauri only) -->
			{#if typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window}
				<Card>
					<CardHeader>
						<CardTitle>Custom Popup Notifications</CardTitle>
						<CardDescription>
							Test the Teams-style custom popup notification system (Tauri only)
						</CardDescription>
					</CardHeader>
					<CardContent>
						<Button onclick={testNotificationPopup} class="w-full sm:w-auto">
							<Bell class="mr-2 h-4 w-4" />
							Test Notification Popup
						</Button>
						<p class="mt-2 text-sm text-muted-foreground">
							Click to show a test notification popup in the bottom-right corner
						</p>
					</CardContent>
				</Card>
			{/if}
		</TabsContent>

		<!-- Reminders -->
		<TabsContent value="reminders">
			<Card>
				<RemindersManager reminders={data.reminders} />
			</Card>
		</TabsContent>

		<!-- Calendar -->
		<TabsContent value="calendar">
			<Card>
				<CalendarSettings
					userId={data.user.id}
					calendarAccounts={data.calendarAccounts}
					enableEventNotifications={data.enableEventNotifications}
				/>
			</Card>
		</TabsContent>
	</Tabs>
</div>
