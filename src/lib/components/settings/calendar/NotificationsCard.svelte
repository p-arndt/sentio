<script lang="ts">
    import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '$lib/components/ui/card';
    import { Switch } from '$lib/components/ui/switch';
    import { Button } from '$lib/components/ui/button';

    type Props = {
        enableEventNotifications: boolean;
        isSavingPreferences: boolean;
        pushSupported: boolean;
        pushSubscribed: boolean;
        notificationPermission: NotificationPermission;
        isCheckingPushStatus: boolean;
        updateEventNotificationPreference: (enabled: boolean) => Promise<void>;
        scrollToNotificationSettings: () => void;
    };

    let { enableEventNotifications = false, isSavingPreferences = false, pushSupported = false, pushSubscribed = false, notificationPermission = 'default', isCheckingPushStatus = false, updateEventNotificationPreference, scrollToNotificationSettings }: Props = $props();
</script>

<Card>
    <CardHeader>
        <CardTitle class="text-lg">Event Notifications</CardTitle>
        <CardDescription>Get notified when your meetings end</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
        <div class="flex items-center justify-between p-3 rounded-lg border bg-muted/10">
            <div class="space-y-1">
                <label for="event-notifications" class="text-sm font-medium">Enable push notifications</label>
                <p class="text-xs text-muted-foreground">Receive browser notifications when your meetings end</p>
            </div>
            <Switch id="event-notifications" checked={enableEventNotifications} disabled={isSavingPreferences} onCheckedChange={(checked) => updateEventNotificationPreference(checked)} />
        </div>

        {#if enableEventNotifications}
            {#if pushSupported}
                <div class="rounded-lg border bg-muted/30 p-3 text-xs space-y-2">
                    <div class="flex items-center justify-between">
                        <span class="font-semibold text-muted-foreground uppercase tracking-wide text-[0.75rem]">Browser Push Status</span>
                        <span class="inline-flex items-center gap-1.5 rounded-full bg-background px-2.5 py-1 text-[0.65rem] font-medium">
                            {#if isCheckingPushStatus}
                                <span class="inline-block w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse"></span>
                                Checking
                            {:else if pushSubscribed}
                                <span class="inline-block w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                                Active
                            {:else if notificationPermission === 'denied'}
                                <span class="inline-block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
                                Blocked
                            {:else}
                                <span class="inline-block w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                                Inactive
                            {/if}
                        </span>
                    </div>
                    <p class="text-muted-foreground leading-relaxed">
                        {#if isCheckingPushStatus}
                            Checking your browser push status...
                        {:else if pushSubscribed}
                            Browser push notifications are active. You'll get alerts when meetings end.
                        {:else if notificationPermission === 'denied'}
                            Notifications are blocked in your browser. Enable them in your browser settings to receive alerts.
                        {:else}
                            Click "Enable in Browser" below to start receiving push notifications.
                        {/if}
                    </p>

                    {#if !pushSubscribed && notificationPermission !== 'denied'}
                        <Button size="sm" variant="outline" class="w-full mt-2" onclick={scrollToNotificationSettings}>Enable in Browser</Button>
                    {/if}
                </div>
            {:else}
                <div class="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-xs text-yellow-900 space-y-2">
                    <p class="font-semibold">Browser not supported</p>
                    <p>Your browser doesn't support push notifications. Use Chrome, Firefox, Edge, or Safari instead.</p>
                </div>
            {/if}
        {:else}
            <div class="rounded-lg bg-muted/30 p-3 text-xs text-muted-foreground">Push notifications are disabled. Enable them above to receive event alerts.</div>
        {/if}
    </CardContent>
</Card>
