<script lang="ts">
	import { page } from '$app/state';
	import { env } from '$env/dynamic/public';
	import { getPushSubscription, supportsNotifications } from '$lib/client/notifications';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import type { CalendarAccount } from '$lib/server/calendar/types';
	import { AlertCircle } from '@lucide/svelte';
	import { onMount } from 'svelte';
	import CalendarIntegration from '$lib/components/settings/calendar/CalendarIntegration.svelte';
	import SyncSettings from '$lib/components/settings/calendar/SyncSettings.svelte';
	import NotificationsCard from '$lib/components/settings/calendar/NotificationsCard.svelte';

	type Props = {
		userId: string;
		calendarAccounts: CalendarAccount[];
		enableEventNotifications: boolean;
	};

	let {
		userId,
		calendarAccounts: initialCalendarAccounts,
		enableEventNotifications: initialEnableEventNotifications
	}: Props = $props();

	let calendarAccounts: CalendarAccount[] = $state(initialCalendarAccounts ?? []);
	let isLoading = $state(false);
	let isSyncing = $state(false);
	let syncingAccountId: string | null = $state(null);
	let enableEventNotifications = $state(initialEnableEventNotifications ?? false);
	let isSavingPreferences = $state(false);
	let pageError: string | null = $state(page.url.searchParams.get('error') || null);
	let pageSuccess: string | null = $state(page.url.searchParams.get('success') || null);
	let syncError: string | null = $state(null);
	let syncSuccess: string | null = $state(null);
	let pushSupported = $state(false);
	let pushSubscribed = $state(false);
	let notificationPermission = $state<NotificationPermission>('default');
	let isCheckingPushStatus = $state(false);

	onMount(async () => {
		await loadPushStatus();

		// Auto-dismiss success message after 5 seconds
		if (pageSuccess) {
			setTimeout(() => {
				pageSuccess = null;
			}, 3000);
		}
	});

	async function loadPushStatus() {
		if (typeof window === 'undefined') return;

		isCheckingPushStatus = true;
		try {
			pushSupported = supportsNotifications();
			if (!pushSupported) {
				pushSubscribed = false;
				return;
			}

			if (typeof Notification !== 'undefined') {
				notificationPermission = Notification.permission;
			}

			const subscription = await getPushSubscription();
			console.log(subscription);
			pushSubscribed = Boolean(subscription);
			console.log(subscription, pushSubscribed);
		} catch (err) {
			console.error('Failed to determine push status:', err);
			pushSubscribed = false;
		} finally {
			isCheckingPushStatus = false;
		}
	}

	function scrollToNotificationSettings() {
		if (typeof document === 'undefined') return;

		const section = document.getElementById('notification-settings');
		if (!section) return;

		section.scrollIntoView({ behavior: 'smooth', block: 'center' });
	}

	async function updateEventNotificationPreference(enabled: boolean) {
		try {
			isSavingPreferences = true;
			pageError = null;

			const response = await fetch('/api/settings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enableEventNotifications: enabled })
			});

			if (!response.ok) throw new Error('Failed to save preference');

			enableEventNotifications = enabled;
			pageSuccess = enabled ? 'Event notifications enabled' : 'Event notifications disabled';
		} catch (err) {
			pageError = err instanceof Error ? err.message : 'Failed to save preference';
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
			pageError = null;
			const response = await fetch('/api/calendar', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ action: 'disconnect', accountId })
			});

			if (!response.ok) throw new Error('Failed to disconnect calendar');

			calendarAccounts = calendarAccounts.filter((acc) => acc.id !== accountId);
			pageSuccess = 'Calendar disconnected successfully';
		} catch (err) {
			pageError = err instanceof Error ? err.message : 'Failed to disconnect calendar';
		} finally {
			isLoading = false;
		}
	}

	async function syncCalendar(accountId?: string) {
		try {
			isSyncing = true;
			syncError = null;
			syncSuccess = null;

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
			syncSuccess = data.message;

			setTimeout(() => {
				syncSuccess = null;
			}, 5000);
		} catch (err) {
			syncError = err instanceof Error ? err.message : 'Failed to start sync';
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
	{#if pageError}
		<Alert variant="destructive" class="animate-in duration-300 slide-in-from-top-2">
			<AlertCircle class="h-4 w-4" />
			<AlertDescription>{pageError}</AlertDescription>
			<button
				onclick={() => (pageError = null)}
				class="absolute top-4 right-4 text-destructive hover:opacity-70"
				aria-label="Close alert"
			>
				<svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M6 18L18 6M6 6l12 12"
					/>
				</svg>
			</button>
		</Alert>
	{/if}

	<!-- Calendar integration (connected + connect UI combined) -->
	<CalendarIntegration
		accounts={calendarAccounts}
		{isLoading}
		{isSyncing}
		{syncingAccountId}
		{pageSuccess}
		clearPageSuccess={() => (pageSuccess = null)}
		{syncCalendar}
		{disconnectCalendar}
		{initiateGoogleOAuth}
		{initiateMicrosoftOAuth}
	/>

	<!-- Sync + Notifications (refactored into smaller components) -->
	<SyncSettings {isSyncing} {syncSuccess} {syncError} {syncCalendar} />

	<NotificationsCard
		{enableEventNotifications}
		{isSavingPreferences}
		bind:pushSubscribed
		{updateEventNotificationPreference}
		{scrollToNotificationSettings}
	/>
</div>
