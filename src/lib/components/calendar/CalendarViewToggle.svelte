<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Calendar, Calendar1, CalendarDays } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	type CalendarViewMode = 'week' | 'month' | 'day';

	type Props = {
		mode: CalendarViewMode;
		onModeChange: (mode: CalendarViewMode) => void;
		className?: string;
	};

	let { mode, onModeChange, className = '' } = $props();

	const viewOptions: { value: CalendarViewMode; label: string; icon: any }[] = [
		{ value: 'day', label: 'Day', icon: Calendar1 },
		{ value: 'week', label: 'Week', icon: Calendar },
		{ value: 'month', label: 'Month', icon: CalendarDays }
	];
</script>

<div class={cn('inline-flex gap-1 rounded-lg border bg-muted p-1', className)}>
	{#each viewOptions as option}
		<Button
			variant={mode === option.value ? 'default' : 'ghost'}
			size="sm"
			onclick={() => onModeChange(option.value)}
			class="gap-2"
			title={`Switch to ${option.label} view`}
		>
			{@const Icon = option.icon}
			<Icon class="h-4 w-4" />
			<span class="hidden sm:inline">{option.label}</span>
		</Button>
	{/each}
</div>
