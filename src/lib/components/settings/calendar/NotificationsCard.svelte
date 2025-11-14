<script lang="ts">
	import {
		Card,
		CardHeader,
		CardContent,
		CardTitle,
		CardDescription
	} from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { Button } from '$lib/components/ui/button';

	type Props = {
		enableEventNotifications: boolean;
		isSavingPreferences: boolean;
		pushSubscribed: boolean;
		updateEventNotificationPreference: (enabled: boolean) => Promise<void>;
		scrollToNotificationSettings: () => void;
	};

	let {
		enableEventNotifications = false,
		isSavingPreferences = false,
		pushSubscribed = $bindable(false),
		updateEventNotificationPreference,
		scrollToNotificationSettings
	}: Props = $props();
</script>

<Card>
	<CardHeader>
		<CardTitle class="text-lg">Event Notifications</CardTitle>
		<CardDescription>Get notified when your meetings end</CardDescription>
	</CardHeader>
	<CardContent class="space-y-4">
		{#if pushSubscribed}
			<div class="flex items-center justify-between rounded-lg border bg-muted/10 p-3">
				<div class="space-y-1">
					<label for="event-notifications" class="text-sm font-medium"
						>Enable push notifications</label
					>
					<p class="text-xs text-muted-foreground">
						Receive browser notifications when your meetings end
					</p>
				</div>
				<Switch
					id="event-notifications"
					checked={enableEventNotifications}
					disabled={isSavingPreferences}
					onCheckedChange={(checked) => updateEventNotificationPreference(checked)}
				/>
			</div>
		{:else}
			<div
				class="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted/30"
			>
				<div class="space-y-1">
					<p class="text-sm font-medium">Enable push notifications</p>
					<p class="text-xs text-muted-foreground">
						Subscribe to push notifications to receive meeting end alerts
					</p>
				</div>
				<Button
					onclick={() => {
						scrollToNotificationSettings();
					}}
				>
					Enable
				</Button>
			</div>
		{/if}
	</CardContent>
</Card>
