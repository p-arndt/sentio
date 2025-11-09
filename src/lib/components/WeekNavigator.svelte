<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { toDate } from '$lib/utils/date';
	import { goto } from '$app/navigation';

	type Props = {
		weekStart: string | Date; // ISO string or Date
		paramName?: string; // query param name (default 'weekStart')
		basePath: string; // route base path e.g. '/personal' or `/teams/${teamId}`
		showToday?: boolean;
		onChange?: (newWeekStart: Date) => void; // optional hook
	};

	let {
		weekStart,
		paramName = 'weekStart',
		basePath,
		showToday = true,
		onChange
	}: Props = $props();

	function toMonday(d: Date): Date {
		const day = d.getUTCDay();
		const diff = day === 0 ? -6 : 1 - day; // Sunday -> back 6
		const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff, 0, 0, 0, 0));
		return monday;
	}

	function formatRange(start: Date): string {
		const end = new Date(start);
		end.setUTCDate(start.getUTCDate() + 6);
		const fmt = (x: Date) => x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		return `${fmt(start)} - ${fmt(end)}`;
	}

	function ymd(d: Date): string {
		return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
	}

	let monday = $derived(toMonday(toDate(weekStart) || new Date()));
	let label = $derived(formatRange(monday));

	async function navigate(deltaWeeks: number) {
		const newMonday = new Date(monday);
		newMonday.setUTCDate(monday.getUTCDate() + deltaWeeks * 7);
		const param = ymd(newMonday);
		if (onChange) onChange(newMonday);
		await goto(`${basePath}?${paramName}=${param}`);
	}

	async function goToday() {
		if (onChange) onChange(new Date());
		await goto(basePath);
	}
</script>

<div class="flex items-center gap-2 rounded-lg border bg-card px-3 py-2">
	<Button variant="ghost" size="icon" onclick={() => navigate(-1)} class="h-8 w-8">
		<ChevronLeft class="h-4 w-4" />
	</Button>
	<span class="min-w-[140px] text-center text-sm font-semibold">{label}</span>
	<Button variant="ghost" size="icon" onclick={() => navigate(1)} class="h-8 w-8">
		<ChevronRight class="h-4 w-4" />
	</Button>
	{#if showToday}
		<Button variant="outline" size="sm" class="ml-2" onclick={goToday}>Today</Button>
	{/if}
</div>
