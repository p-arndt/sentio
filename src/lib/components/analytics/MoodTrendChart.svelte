<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Chart from '$lib/components/ui/chart';
	import type { MoodEntryWithDetails } from '$lib/types';
	import { scaleUtc, scaleLinear } from 'd3-scale';
	import { curveNatural } from 'd3-shape';
	import { LineChart } from 'layerchart';

	type Props = {
		entries: MoodEntryWithDetails[];
		title?: string;
		description?: string;
	};

	let { entries, title = 'Mood Trend', description = 'Average daily mood score' }: Props = $props();

	const chartData = $derived.by(() => {
		// Get current month's start and end
		const now = new Date();
		const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
		const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

		const dailyMap = new Map<string, number[]>();

		// Aggregate entries by day
		entries
			.filter((entry) => {
				const entryDate = new Date(entry.date);
				return entryDate >= monthStart && entryDate <= monthEnd;
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

		// Fill in all days in the current month
		const result = [];
		const currentDate = new Date(monthStart);
		while (currentDate <= monthEnd) {
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
	} satisfies Chart.ChartConfig;
</script>

<Card.Root>
	<Card.Header>
		<Card.Title>{title}</Card.Title>
		<Card.Description>{description}</Card.Description>
	</Card.Header>
	<Card.Content>
		{#if chartData.length > 0}
			<Chart.Container config={chartConfig} class="h-[300px] w-full">
				<LineChart
					points={{ r: 4 }}
					data={chartData}
					x="date"
					y="score"
					xScale={scaleUtc()}
					yScale={scaleLinear()}
					axis="x"
					yDomain={[-5, 5]}
					series={[
						{
							key: 'score',
							label: chartConfig.score.label,
							color: chartConfig.score.color
						}
					]}
					props={{
						xAxis: {
							ticks: 6,
							format: (v: Date) => v.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
						},
						yAxis: {
							format: (d) => d.toFixed(1)
						}
					}}
				>
					{#snippet tooltip()}
						<Chart.Tooltip hideLabel />
					{/snippet}
				</LineChart>
			</Chart.Container>
		{:else}
			<div class="flex flex-col items-center justify-center py-12 text-center">
				<div class="mb-2 text-4xl">📈</div>
				<p class="text-muted-foreground">Not enough data for trend analysis</p>
			</div>
		{/if}
	</Card.Content>
</Card.Root>
