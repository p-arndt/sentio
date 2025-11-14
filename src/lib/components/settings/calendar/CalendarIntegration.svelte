<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Card, CardHeader, CardContent, CardDescription, CardTitle } from '$lib/components/ui/card';
    import { Alert, AlertDescription } from '$lib/components/ui/alert';
    import { RefreshCw, Trash2, Calendar, Link as LinkIcon } from '@lucide/svelte';
    import type { CalendarAccount } from '$lib/server/calendar/types';

    type Props = {
        accounts: CalendarAccount[];
        isLoading: boolean;
        isSyncing: boolean;
        syncingAccountId: string | null;
        isSavingPreferences?: boolean;
        pageSuccess: string | null;
        clearPageSuccess: () => void;
        syncCalendar: (accountId?: string) => Promise<void>;
        disconnectCalendar: (accountId: string) => Promise<void>;
        initiateGoogleOAuth: () => void;
        initiateMicrosoftOAuth: () => void;
    };

    let {
        accounts = [],
        isLoading = false,
        isSyncing = false,
        syncingAccountId = null,
        isSavingPreferences = false,
        pageSuccess = null,
        clearPageSuccess,
        syncCalendar,
        disconnectCalendar,
        initiateGoogleOAuth,
        initiateMicrosoftOAuth
    }: Props = $props();
</script>

<Card>
    <CardHeader>
        <CardTitle class="flex items-center gap-2">
            <Calendar class="h-5 w-5" />
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

        <!-- Connected calendars list -->
        {#if accounts.length > 0}
            <div class="space-y-3">
                <h3 class="font-semibold">Connected Calendars</h3>
                {#each accounts as account (account.id)}
                    <div class="flex items-center justify-between rounded-lg border p-4 hover:bg-muted/30 transition-colors">
                        <div class="flex items-center gap-3 flex-1">
                            <div class="rounded-lg bg-primary/10 p-2">
                                {#if account.provider === 'google'}
                                    <Calendar class="h-5 w-5 text-blue-600" />
                                {:else}
                                    <Calendar class="h-5 w-5 text-blue-700" />
                                {/if}
                            </div>
                            <div class="min-w-0 flex-1">
                                <p class="font-medium">{account.provider === 'google' ? 'Google Calendar' : 'Microsoft Outlook'}</p>
                                <p class="text-sm text-muted-foreground truncate">{account.email}</p>
                                {#if account.lastSyncedAt}
                                    <p class="text-xs text-muted-foreground">Last synced: {new Date(account.lastSyncedAt).toLocaleString()}</p>
                                {/if}
                            </div>
                        </div>
                        <div class="flex gap-2 ml-4">
                            <Button onclick={() => syncCalendar(account.id)} disabled={isSyncing || syncingAccountId === account.id} size="sm" variant="outline">
                                <RefreshCw class={`h-4 w-4 ${syncingAccountId === account.id ? 'animate-spin' : ''}`} />
                            </Button>
                            <Button onclick={() => disconnectCalendar(account.id)} disabled={isLoading} size="sm" variant="ghost">
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                {/each}
            </div>
        {/if}

        <!-- Connect new providers -->
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
