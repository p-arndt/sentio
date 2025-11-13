<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { AlertCircle, Calendar, Link as LinkIcon, Trash2, RefreshCw } from '@lucide/svelte';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import type { CalendarAccount } from '$lib/server/calendar/types';
	import { env } from '$env/dynamic/public';
	import { page } from '$app/state';

	type Props = {
		userId: string;
	};

	const { userId } = $props();

	let calendarAccounts: CalendarAccount[] = $state([]);
	let isLoading = $state(false);
	let isSyncing = $state(false);
	let syncingAccountId: string | null = $state(null);
	let enableEventNotifications = $state(false);
	let isSavingPreferences = $state(false);
	let error: string | null = $state(page.url.searchParams.get('error') || null);
	let success: string | null = $state(page.url.searchParams.get('success') || null);

	onMount(async () => {
		await loadCalendarAccounts();
		await loadEventNotificationPreference();
	});

	async function loadCalendarAccounts() {
		try {
			const response = await fetch('/api/calendar');
			if (!response.ok) throw new Error('Failed to load calendar accounts');
			const data = (await response.json()) as { accounts: CalendarAccount[] };
			calendarAccounts = data.accounts;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load calendar accounts';
		}
	}

	async function loadEventNotificationPreference() {
		try {
			const response = await fetch('/api/settings');
			if (!response.ok) return;
			const data = (await response.json()) as { preferences?: { settings?: Record<string, unknown> } };
			if (data.preferences?.settings?.enableEventNotifications === true) {
				enableEventNotifications = true;
			}
		} catch (err) {
			console.error('Failed to load event notification preference:', err);
		}
	}

	async function updateEventNotificationPreference(enabled: boolean) {
		try {
			isSavingPreferences = true;
			error = null;

			const response = await fetch('/api/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enableEventNotifications: enabled })
			});

			if (!response.ok) throw new Error('Failed to save preference');

			enableEventNotifications = enabled;
			success = enabled
				? 'Event notifications enabled'
				: 'Event notifications disabled';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save preference';
			// Revert on error
			enableEventNotifications = !enabled;
		} finally {
			isSavingPreferences = false;
		}
	}

	async function disconnectCalendar(accountId: string) {
		if (!confirm('Are you sure you want to disconnect this calendar?')) return;

		try {
			isLoading = true;
			error = null;
			const response = await fetch('/api/calendar', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'disconnect', accountId })
			});

			if (!response.ok) throw new Error('Failed to disconnect calendar');

			calendarAccounts = calendarAccounts.filter((acc) => acc.id !== accountId);
			success = 'Calendar disconnected successfully';
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to disconnect calendar';
		} finally {
			isLoading = false;
		}
	}

	async function syncCalendar(accountId?: string) {
		try {
			isSyncing = true;
			error = null;
			success = null;

			if (accountId) {
				syncingAccountId = accountId;
			}

			const response = await fetch('/api/calendar', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'sync', accountId })
			});

			if (!response.ok) throw new Error('Failed to start sync');

			const data = (await response.json()) as { success: boolean; message: string; jobId: string };
			success = data.message;
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to start sync';
		} finally {
			isSyncing = false;
			syncingAccountId = null;
		}
	}

	function initiateGoogleOAuth() {
		const params = new URLSearchParams({
			client_id: env.PUBLIC_GOOGLE_CLIENT_ID || '',
			redirect_uri: `${window.location.origin}/api/oauth/google/callback`,
			response_type: 'code',
			scope: 'openid email profile https://www.googleapis.com/auth/calendar.readonly',
			access_type: 'offline',
			state: crypto.randomUUID()
		});

		window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
	}

	function initiateMicrosoftOAuth() {
		const params = new URLSearchParams({
			client_id: import.meta.env.VITE_MICROSOFT_CLIENT_ID || '',
			redirect_uri: `${window.location.origin}/api/oauth/microsoft/callback`,
			response_type: 'code',
			scope: 'Calendars.Read offline_access',
			state: crypto.randomUUID()
		});

		window.location.href = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params}`;
	}
</script>

<div class="space-y-6">
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Calendar class="h-5 w-5" />
				Calendar Integration
			</CardTitle>
			<CardDescription>
				Connect your Google Calendar or Outlook to get mood check-ins after your meetings
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			{#if error}
				<Alert variant="destructive">
					<AlertCircle class="h-4 w-4" />
					<AlertDescription>{error}</AlertDescription>
				</Alert>
			{/if}

			{#if success}
				<Alert class="border-green-200 bg-green-50">
					<AlertDescription class="text-green-900">{success}</AlertDescription>
				</Alert>
			{/if}

			<!-- Connected Calendars -->
			{#if calendarAccounts.length > 0}
				<div class="space-y-3">
					<h3 class="font-semibold">Connected Calendars</h3>
					{#each calendarAccounts as account (account.id)}
						<Card class="bg-muted/50">
							<CardContent class="pt-6">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<div class="rounded-lg bg-primary/10 p-2">
											{#if account.provider === 'google'}
												<Calendar class="h-5 w-5 text-blue-600" />
											{:else}
												<Calendar class="h-5 w-5 text-blue-700" />
											{/if}
										</div>
										<div>
											<p class="font-medium">
												{account.provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}
											</p>
											<p class="text-sm text-muted-foreground">{account.email}</p>
											{#if account.lastSyncedAt}
												<p class="text-xs text-muted-foreground">
													Last synced: {new Date(account.lastSyncedAt).toLocaleString()}
												</p>
											{/if}
										</div>
									</div>
									<div class="flex gap-2">
										<button
											onclick={() => syncCalendar(account.id)}
											disabled={isSyncing || syncingAccountId === account.id}
											class="inline-flex items-center gap-2 rounded-md bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20 disabled:opacity-50"
										>
											<RefreshCw class={`h-4 w-4 ${syncingAccountId === account.id ? 'animate-spin' : ''}`} />
											{syncingAccountId === account.id ? 'Syncing...' : 'Sync'}
										</button>
										<button
											onclick={() => disconnectCalendar(account.id)}
											disabled={isLoading}
											class="inline-flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive hover:bg-destructive/20 disabled:opacity-50"
										>
											<Trash2 class="h-4 w-4" />
											Disconnect
										</button>
									</div>
								</div>
							</CardContent>
						</Card>
					{/each}
				</div>
			{/if}

			<!-- Available Providers -->
			<div class="space-y-3">
				<h3 class="font-semibold">Connect New Calendar</h3>
				<div class="grid gap-3 sm:grid-cols-2">
					<!-- Google Calendar -->
					{#if !calendarAccounts.find((a) => a.provider === 'google')}
						<Button
							onclick={initiateGoogleOAuth}
							disabled={isLoading}
							class="w-full"
							variant="outline"
						>
							<LinkIcon class="mr-2 h-4 w-4" />
							Google Calendar
						</Button>
					{/if}

					<!-- Microsoft Outlook -->
					{#if !calendarAccounts.find((a) => a.provider === 'microsoft')}
						<Button
							onclick={initiateMicrosoftOAuth}
							disabled={isLoading}
							class="w-full"
							variant="outline"
						>
							<LinkIcon class="mr-2 h-4 w-4" />
							Microsoft Outlook
						</Button>
					{/if}
				</div>
			</div>

			<!-- Info Section -->
			<div class="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
				<p class="font-semibold">What happens when you connect?</p>
				<ul class="mt-2 list-inside list-disc space-y-1">
					<li>Your calendar events will be synced automatically</li>
					<li>After each meeting ends, you'll get a mood check-in prompt</li>
					<li>We only read your calendar, no events are created</li>
					<li>You can disconnect anytime</li>
				</ul>
			</div>
		</CardContent>
	</Card>

	<!-- Settings Section -->
	<Card>
		<CardHeader>
			<CardTitle>Calendar Sync Settings</CardTitle>
			<CardDescription
				>Manage how your calendar is synced and when you get mood prompts</CardDescription
			>
		</CardHeader>
		<CardContent class="space-y-4">
			<div class="space-y-2">
				<label class="flex items-center gap-3">
					<input type="checkbox" class="rounded" checked disabled />
					<span class="text-sm">Sync calendar events automatically</span>
				</label>
				<p class="ml-6 text-xs text-muted-foreground">
					Events are synced every 15 minutes in the background
				</p>
			</div>

			<div class="space-y-2">
				<label class="flex items-center gap-3">
					<input type="checkbox" class="rounded" checked disabled />
					<span class="text-sm">Show mood prompts after meetings</span>
				</label>
				<p class="ml-6 text-xs text-muted-foreground">
					You'll receive a mood check-in prompt within 10 minutes after a meeting ends
				</p>
			</div>

			<div class="flex items-center justify-between border-t pt-4">
				<div class="space-y-0.5">
					<label for="event-notifications" class="text-sm font-medium">Web Push Notifications</label>
					<p class="text-xs text-muted-foreground">
						Receive notifications when events end (requires push enabled)
					</p>
				</div>
				<Switch
					id="event-notifications"
					checked={enableEventNotifications}
					disabled={isSavingPreferences}
					onCheckedChange={(checked) => updateEventNotificationPreference(checked)}
				/>
			</div>

			<div class="space-y-2">
				<label class="flex items-center gap-3">
					<input type="checkbox" class="rounded" checked disabled />
					<span class="text-sm">Include meeting intensity analysis</span>
				</label>
				<p class="ml-6 text-xs text-muted-foreground">
					Analyze how many meetings you had and suggest reflection time if needed
				</p>
			</div>

			<Button
				onclick={() => syncCalendar()}
				disabled={isSyncing}
				class="w-full"
				variant="outline"
			>
				<RefreshCw class={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
				{isSyncing ? 'Syncing...' : 'Sync Now'}
			</Button>
		</CardContent>
	</Card>
</div>
