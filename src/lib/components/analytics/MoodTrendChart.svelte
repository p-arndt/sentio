<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { MoodEntryWithDetails } from '$lib/types';
	import ChartJS from 'chart.js/auto';
	import { onDestroy, onMount } from 'svelte';

	type Props = {
		entries: MoodEntryWithDetails[];
		title?: string;
		description?: string;
	};

	let { entries, title = 'Mood Trend', description = 'Average daily mood score' }: Props = $props();

	const chartData = $derived.by(() => {
		// Last 30 days (including today)
		const now = new Date();
		const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		startDate.setDate(startDate.getDate() - 29); // 30 days window

		const dailyMap = new Map<string, number[]>();

		// Aggregate entries by day
		entries
			.filter((entry) => {
				const entryDate = new Date(entry.date);
				return entryDate >= startDate && entryDate <= now;
			})
			.forEach((entry) => {
				const entryDate = new Date(entry.date);
				const year = entryDate.getFullYear();
				const month = entryDate.getMonth();
				const day = entryDate.getDate();
				const dateKey = `${year}-${month}-${day}`;

				if (!dailyMap.has(dateKey)) {
					dailyMap.set(dateKey, []);
				}
				dailyMap.get(dateKey)!.push(entry.emotion.valence);
			});

		// Fill in all days in the 30 days window
		const result = [];
		const currentDate = new Date(startDate);
		while (currentDate <= now) {
			const year = currentDate.getFullYear();
			const month = currentDate.getMonth();
			const day = currentDate.getDate();
			const dateKey = `${year}-${month}-${day}`;

			const valences = dailyMap.get(dateKey);
			result.push({
				date: new Date(year, month, day),
				score: valences ? valences.reduce((a, b) => a + b, 0) / valences.length : 0
			});

			currentDate.setDate(currentDate.getDate() + 1);
		}

		return result;
	});

	const chartConfig = {
		score: {
			label: 'Mood Score',
			color: 'var(--chart-1)'
		}
	};

	let canvas: HTMLCanvasElement | null = $state(null as HTMLCanvasElement | null);
	let chartInstance: ChartJS | null = null;

	function formatDateLabel(d: Date) {
		return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	onMount(async () => {
		if (!canvas) return;
		// Type checking for chart.js might fail in dev without installation; ignore until installed
		// @ts-ignore
		const module = await import('chart.js');
		// Register all the default components
		if (module.registerables) ChartJS.register(...module.registerables);

		// Resolve color variable for canvas drawing
		const cssColor = getComputedStyle(document.documentElement)
			.getPropertyValue('--chart-3')
			?.trim();

		const labels = chartData.map((d) => formatDateLabel(d.date));
		const data = chartData.map((d) => d.score);

		chartInstance = new ChartJS(canvas, {
			type: 'line',
			data: {
				labels,
				datasets: [
					{
						label: chartConfig.score.label,
						data,
						borderColor: cssColor,
						backgroundColor: cssColor,
						tension: 0.35,
						pointRadius: 3,
						pointHoverRadius: 6
					}
				]
			},
			options: {
				responsive: true,
				maintainAspectRatio: false,
				
				plugins: {
					legend: { display: true },
					tooltip: {
						callbacks: {
							label: function (context: any) {
								return `${context.parsed.y.toFixed(2)}`;
							}
						}
					}
				},
				scales: {
					x: {
						ticks: { maxTicksLimit: 15 }
					},
					y: {
						min: -6,
						max: 6,
						ticks: {
							stepSize: 1,
							callback: (v: any) => (v as number).toFixed(1)
						}
					}
				}
			}
		});
	});

	onDestroy(() => {
		if (chartInstance) chartInstance.destroy();
	});

	$effect(() => {
		if (!chartInstance) return;
		const labels = chartData.map((d) => formatDateLabel(d.date));
		const data = chartData.map((d) => d.score);
		chartInstance.data.labels = labels;
		chartInstance.data.datasets[0].data = data;
		chartInstance.update();
	});
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{title}</Card.Title>
		<Card.Description>{description}</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if chartData.length > 0}
			<div class="h-[300px] w-full">
				<canvas bind:this={canvas} class="h-full w-full"></canvas>
			</div>
		{:else}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<div class="mb-2 text-4xl">📈</div>
				<p class="text-muted-foreground">Not enough data for trend analysis</p>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
