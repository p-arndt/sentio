<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { ChevronLeft } from '@lucide/svelte';

	type Props = {
		title: string;
		description: string;
		backHref: string;
	};

	let { title, description, backHref } = $props();
</script>

<div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
	<div class="flex items-center gap-3">
		<Button href={backHref} variant="ghost" size="icon">
			<ChevronLeft class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold">{title}</h1>
			<p class="text-muted-foreground">{description}</p>
		</div>
	</div>
</div>
