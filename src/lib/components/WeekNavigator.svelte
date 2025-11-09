<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft, ChevronRight } from '@lucide/svelte';
	import { toDate, getMondayUTC, formatDateRange, toYMD, addWeeks } from '$lib/utils/date';
	import { goto } from '$app/navigation';

	type Props = {
		weekStart: string | Date;
		paramName?: string;
		basePath: string;
		showToday?: boolean;
		onChange?: (newWeekStart: Date) => void;
	};

	let {
		weekStart,
		paramName = 'weekStart',
		basePath,
		showToday = true,
		onChange
	}: Props = $props();

	let monday = $derived(getMondayUTC(toDate(weekStart) || new Date()));
	let label = $derived.by(() => {
		const end = new Date(monday);
		end.setUTCDate(monday.getUTCDate() + 6);
		return formatDateRange(monday, end);
	});

	async function navigate(deltaWeeks: number) {
		const newMonday = addWeeks(monday, deltaWeeks);
		const param = toYMD(newMonday);
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
