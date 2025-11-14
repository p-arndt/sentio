<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '$lib/components/ui/card';
    import { Link as LinkIcon } from '@lucide/svelte';
    import { Alert, AlertDescription } from '$lib/components/ui/alert';
    import type { CalendarAccount } from '$lib/server/calendar/types';

    type Props = {
        accounts: CalendarAccount[];
        isLoading: boolean;
        initiateGoogleOAuth: () => void;
        initiateMicrosoftOAuth: () => void;
        pageSuccess: string | null;
        clearPageSuccess: () => void;
    };

    let { accounts = [], isLoading = false, initiateGoogleOAuth, initiateMicrosoftOAuth, pageSuccess = null, clearPageSuccess }: Props = $props();
</script>

<Card>
    <CardHeader>
        <CardTitle class="flex items-center gap-2">
            <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 7h18M3 12h18M3 17h18" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"/></svg>
            Calendar Integration
        </CardTitle>
        <CardDescription>Connect your Google Calendar or Outlook to get mood check-ins after your meetings</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
        {#if pageSuccess}
            <Alert variant="success">
                <AlertDescription>{pageSuccess}</AlertDescription>
                <button onclick={clearPageSuccess} class="ml-2 text-success-foreground hover:opacity-80" aria-label="Close success">
                    <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
                </button>
            </Alert>
        {/if}

        {#if accounts.length === 0}
            <div class="rounded-lg bg-blue-50 p-4 text-sm text-blue-900">
                <p class="font-semibold">What happens when you connect?</p>
                <ul class="mt-2 list-inside list-disc space-y-1">
                    <li>Your calendar events will be synced automatically</li>
                    <li>After each meeting ends, you'll get a mood check-in prompt</li>
                    <li>We only read your calendar, no events are created</li>
                    <li>You can disconnect anytime</li>
                </ul>
            </div>
        {/if}

        <div class="grid gap-3 sm:grid-cols-2">
            {#if !accounts.find((a) => a.provider === 'google')}
                <Button onclick={initiateGoogleOAuth} disabled={isLoading} class="w-full" variant="outline">
                    <LinkIcon class="mr-2 h-4 w-4" />
                    Google Calendar
                </Button>
            {/if}

            {#if !accounts.find((a) => a.provider === 'microsoft')}
                <Button onclick={initiateMicrosoftOAuth} disabled={isLoading} class="w-full" variant="outline">
                    <LinkIcon class="mr-2 h-4 w-4" />
                    Microsoft Outlook
                </Button>
            {/if}
        </div>
    </CardContent>
</Card>
