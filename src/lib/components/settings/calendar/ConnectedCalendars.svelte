<script lang="ts">
    import { Button } from '$lib/components/ui/button';
    import { Card, CardContent } from '$lib/components/ui/card';
    import { RefreshCw, Trash2, Calendar } from '@lucide/svelte';
    import type { CalendarAccount } from '$lib/server/calendar/types';

    type Props = {
        accounts: CalendarAccount[];
        isSyncing: boolean;
        syncingAccountId: string | null;
        isLoading: boolean;
        syncCalendar: (accountId?: string) => Promise<void>;
        disconnectCalendar: (accountId: string) => Promise<void>;
    };

    let { accounts = [], isSyncing = false, syncingAccountId = null, isLoading = false, syncCalendar, disconnectCalendar }: Props = $props();
</script>

{#if accounts.length > 0}
    <Card>
        <CardContent class="space-y-3">
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
        </CardContent>
    </Card>
{/if}
