<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { Badge } from '$lib/components/ui/badge';
	import { Alert, AlertDescription } from '$lib/components/ui/alert';
	import { AlertCircle, Check, AlertTriangle } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';
	import {
		supportsNotifications,
		requestNotificationPermission,
		initializeNotifications,
		subscribeToPushNotifications,
		unsubscribeFromPushNotifications,
		getPushSubscription
	} from '$lib/client/notifications';

	type Props = {
		vapidPublicKey: string | null;
	};
	let { vapidPublicKey }: Props = $props();

	let hasNotificationSupport = $state(false);
	let notificationPermission = $state<NotificationPermission>('default');
	let isSubscribed = $state(false);
	let isInitializing = $state(true);
	let isToggling = $state(false);

	onMount(async () => {
		hasNotificationSupport = supportsNotifications();
		notificationPermission = Notification.permission;

		if (hasNotificationSupport) {
			try {
				const result = await initializeNotifications();
				isSubscribed = result.isSubscribed;
			} catch (error) {
				console.error('Failed to initialize notifications:', error);
			}
		}

		isInitializing = false;
	});

	async function handleSubscribe() {
		if (!hasNotificationSupport) {
			toast.error('Notifications are not supported in your browser');
			return;
		}

		if (!vapidPublicKey) {
			toast.error('VAPID public key is not configured');
			return;
		}

		isToggling = true;

		try {
			// Request permission if not granted
			if (notificationPermission !== 'granted') {
				const permission = await requestNotificationPermission();
				notificationPermission = permission;

				if (permission !== 'granted') {
					toast.error('Notification permission denied');
					isToggling = false;
					return;
				}
			}

			// Subscribe to push notifications
			await subscribeToPushNotifications(vapidPublicKey);
			isSubscribed = true;
			toast.success('Notifications enabled! You will receive mood reminders.');
		} catch (error) {
			console.error('Failed to enable notifications:', error);
			toast.error(
				error instanceof Error ? error.message : 'Failed to enable notifications'
			);
		} finally {
			isToggling = false;
		}
	}

	async function handleUnsubscribe() {
		isToggling = true;

		try {
			await unsubscribeFromPushNotifications();
			isSubscribed = false;
			toast.success('Notifications disabled');
		} catch (error) {
			console.error('Failed to disable notifications:', error);
			toast.error('Failed to disable notifications');
		} finally {
			isToggling = false;
		}
	}

	async function handleTestNotification() {
		try {
			const subscription = await getPushSubscription();

			if (!subscription) {
				toast.error('Please enable notifications first');
				return;
			}

			// Call backend to send test notification
			const response = await fetch('/api/push/send', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					title: 'Test Notification',
					body: 'This is a test notification from your mood tracker!',
					icon: '/favicon.png',
					badge: '/badge-72.png',
					data: {
						url: '/'
					}
				})
			});

			if (response.ok) {
				toast.success('Test notification sent!');
			} else {
				toast.error('Failed to send test notification');
			}
		} catch (error) {
			console.error('Error sending test notification:', error);
			toast.error('Failed to send test notification');
		}
	}
</script>

<div class="space-y-6">
	{#if !hasNotificationSupport}
		<Alert variant="destructive">
			<AlertCircle class="h-4 w-4" />
			<AlertDescription>
				Your browser does not support notifications. Please use a modern browser like Chrome,
				Firefox, Edge, or Safari.
			</AlertDescription>
		</Alert>
	{/if}

	<Card>
		<CardHeader>
			<CardTitle>Notification Settings</CardTitle>
			<CardDescription>
				Enable push notifications to receive mood reminders throughout the day
			</CardDescription>
		</CardHeader>
		<CardContent class="space-y-6">
			{#if isInitializing}
				<div class="text-center text-sm text-muted-foreground py-8">Loading settings...</div>
			{:else}
				<!-- Permission Status -->
				<div class="space-y-2">
					<h3 class="font-semibold">Permission Status</h3>
					<div class="flex items-center gap-2">
						{#if notificationPermission === 'granted'}
							<Badge class="bg-green-600 hover:bg-green-700">
								<Check class="h-3 w-3 mr-1" />
								Granted
							</Badge>
							<span class="text-sm text-muted-foreground">
								You have allowed notifications
							</span>
						{:else if notificationPermission === 'denied'}
							<Badge variant="destructive">
								<AlertTriangle class="h-3 w-3 mr-1" />
								Denied
							</Badge>
							<span class="text-sm text-muted-foreground">
								You have denied notifications. Change browser settings to allow them.
							</span>
						{:else}
							<Badge variant="secondary">Prompt</Badge>
							<span class="text-sm text-muted-foreground">
								Click enable to request permission
							</span>
						{/if}
					</div>
				</div>

				<!-- Subscription Status -->
				<div class="space-y-3">
					<h3 class="font-semibold">Subscription Status</h3>
					<div class="flex items-center justify-between p-4 border rounded-lg">
						<div>
							<p class="font-medium">Push Notifications</p>
							<p class="text-sm text-muted-foreground">
								{isSubscribed
									? 'Active on this device'
									: 'Not active on this device'}
							</p>
						</div>
						<Switch
							checked={isSubscribed}
							disabled={isToggling || !hasNotificationSupport}
                            onCheckedChange={(e) => {
								if (e) {
									handleSubscribe();
								} else {
									handleUnsubscribe();
								}
							}}
						/>
					</div>
				</div>

				<!-- Test Notification -->
				{#if isSubscribed}
					<div class="space-y-3">
						<h3 class="font-semibold">Test Notification</h3>
						<p class="text-sm text-muted-foreground">
							Send yourself a test notification to verify everything is working
						</p>
						<Button
							onclick={handleTestNotification}
							variant="outline"
							disabled={isToggling}
						>
							Send Test Notification
						</Button>
					</div>
				{/if}

				<!-- Information -->
				<Alert>
					<AlertCircle class="h-4 w-4" />
					<AlertDescription>
						<p class="font-semibold mb-2">About Notifications</p>
						<ul class="text-sm space-y-1 ml-2 list-disc">
							<li>Notifications will be sent even if the app is closed</li>
							<li>Make sure your device's notification settings allow this app</li>
							<li>Push notifications require an active internet connection</li>
							<li>You can manage this permission in your browser settings</li>
						</ul>
					</AlertDescription>
				</Alert>
			{/if}
		</CardContent>
	</Card>
</div>
