<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '$lib/components/ui/card';
    import { Alert, AlertDescription } from '$lib/components/ui/alert';
    import { RefreshCw } from '@lucide/svelte';

    type Props = {
        isSyncing: boolean;
        syncSuccess: string | null;
        syncError: string | null;
        syncCalendar: (accountId?: string) => Promise<void>;
    };

    let { isSyncing = false, syncSuccess = null, syncError = null, syncCalendar }: Props = $props();
</script>

<Card>
    <CardHeader>
        <CardTitle class="text-lg">Automatic Sync</CardTitle>
        <CardDescription>Your calendar is automatically synced in the background</CardDescription>
    </CardHeader>
    <CardContent class="space-y-3">
        {#if syncError}
            <Alert variant="destructive">
                <AlertDescription>{syncError}</AlertDescription>
            </Alert>
        {/if}

        {#if syncSuccess}
            <Alert variant="success">
                <AlertDescription>{syncSuccess}</AlertDescription>
            </Alert>
        {/if}

        <div class="space-y-2 rounded-lg bg-muted/30 p-3">
            <p class="font-medium text-sm">How it works</p>
            <ul class="text-xs text-muted-foreground space-y-1.5">
                <li class="flex items-start gap-2"><span class="text-green-600 font-bold shrink-0 mt-0.5">✓</span><span>Calendar events sync automatically every 15 minutes</span></li>
                <li class="flex items-start gap-2"><span class="text-green-600 font-bold shrink-0 mt-0.5">✓</span><span>After each meeting ends, a mood check-in prompt will appear</span></li>
                <li class="flex items-start gap-2"><span class="text-green-600 font-bold shrink-0 mt-0.5">✓</span><span>We only read your calendar—no events are created or modified</span></li>
            </ul>
        </div>

        <Button onclick={() => syncCalendar()} disabled={isSyncing} class="w-full" variant="outline">
            <RefreshCw class={`mr-2 h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync Now'}
        </Button>
    </CardContent>
</Card>
