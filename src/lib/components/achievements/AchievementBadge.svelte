<script lang="ts">
	import type { Achievement } from '$lib/types';

	let {
		achievement,
		earnedAt,
		unlocked
	}: {
		achievement: Achievement;
		earnedAt?: string | Date;
		unlocked?: boolean;
	} = $props();
</script>

<div
	class={[
		'relative flex h-36 flex-col justify-between gap-1 rounded-xl p-4 transition-all',
		'border bg-background hover:bg-accent/50',
		unlocked ? 'border-2 border-primary/40' : 'border-border opacity-45'
	]}
>
	{#if unlocked}
		<div class="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-primary/20"></div>
	{/if}

	<div class="flex items-center justify-between">
		<span class="text-sm font-semibold text-foreground">
			{achievement.name}
		</span>

		{#if unlocked}
			<div
				class="text-primary-200 rounded-md bg-primary/15 px-2 py-0.5 text-xs tracking-wide uppercase"
			>
				unlocked
			</div>
		{/if}
	</div>

	<p class="text-sm text-muted-foreground">
		{achievement.description}
	</p>

	<div class="flex w-full justify-end">
		<span class="text-xs text-muted-foreground">
			{earnedAt instanceof Date ? earnedAt.toLocaleDateString() : earnedAt}
		</span>
	</div>
</div>
