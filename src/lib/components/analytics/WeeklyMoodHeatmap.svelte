<script lang="ts">
	import type { MoodEntryWithDetails } from '$lib/types';

	type Props = {
		entries: MoodEntryWithDetails[];
		title?: string;
		description?: string;
	};

	let { entries = [], title = 'Weekly Mood', description = '' } = $props();

	// Build averages for the current calendar week (Monday -> Sunday)
	function toDate(d: string | Date) {
		return typeof d === 'string' ? new Date(d) : d;
	}

	function localDateKey(d: Date) {
		// return YYYY-MM-DD in local timezone
		const y = d.getFullYear();
		const m = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		return `${y}-${m}-${day}`;
	}

	function getMonday(d: Date) {
		const date = new Date(d);
		const day = (date.getDay() + 6) % 7; // shift so Monday=0
		date.setDate(date.getDate() - day);
		date.setHours(0, 0, 0, 0);
		return date;
	}

	const shortDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	const today = new Date();
	const weekStart = getMonday(today);

	const orderedWeekday = Array.from({ length: 7 }).map((_, i) => {
		const d = new Date(weekStart);
		d.setDate(weekStart.getDate() + i);
		const key = localDateKey(d);
		const dayEntries = entries.filter((e) => localDateKey(toDate(e.date)) === key);
		const avg =
			dayEntries.length === 0
				? null
				: dayEntries.reduce((s, x) => s + x.emotion.valence, 0) / dayEntries.length;
		return { day: shortDays[i], avg };
	});

	function colorForValence(v: number | null) {
		if (v === null || typeof v !== 'number' || isNaN(v)) return '#111827'; // dark neutral for no data
		// explicit neutral (0) -> gray
		if (v === 0) return '#374151'; // gray-700
		// smoother scale: interpolate saturation/lightness from near-gray -> saturated color
		if (v > 0) {
			const t = Math.min(1, v / 5); // 0..1
			const sat = 12 + 68 * t; // 12% (near gray) -> 80% (strong)
			const light = 60 - 18 * t; // 60% -> 42%
			return `hsl(120 ${sat}% ${light}%)`;
		} else {
			const t = Math.min(1, Math.abs(v) / 5);
			const sat = 12 + 68 * t;
			const light = 60 - 18 * t;
			return `hsl(0 ${sat}% ${light}%)`;
		}
	}

	function textColorForBackground(hexOrHsl: string) {
		// crude check: if background is dark use white, else black
		// check for '%' to detect hsl, parse lightness
		const m = hexOrHsl.match(/([0-9]{1,3})%\s*\)$/);
		if (m) {
			const light = parseInt(m[1], 10);
			return light < 60 ? '#fff' : '#000';
		}
		return '#000';
	}
</script>

<div class="card border p-4">
	<div class="mb-2">
		<h3 class="text-lg font-semibold">{title}</h3>
		{#if description}
			<p class="text-sm text-muted-foreground">{description}</p>
		{/if}
	</div>

	<div class="grid grid-cols-7 gap-2 text-center">
		{#each orderedWeekday as w}
			{#key w.day}
				<div class="rounded-md p-2" style="background-color: {colorForValence(w.avg ?? null)};">
					<div class="text-sm font-medium">{w.day}</div>
					<div
						class="text-xl font-semibold"
						style="color: {textColorForBackground(colorForValence(w.avg ?? null))}"
					>
						{w.avg == null ? '—' : w.avg.toFixed(1)}
					</div>
					<div class="text-xs">avg</div>
				</div>
			{/key}
		{/each}
	</div>
</div>
