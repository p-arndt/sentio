<script lang="ts">
	import type { TeamWithHierarchy } from '$lib/types';
	import { Users, ChevronRight, ChevronDown } from '@lucide/svelte';
	import { slide } from 'svelte/transition';

	let { tree } = $props<{ tree: TeamWithHierarchy[] }>();

	let expanded = $state<Record<string, boolean>>({});

	function toggle(id: string) {
		expanded[id] = !expanded[id];
	}
	
	// Auto-expand all by default? No, keep it clean.
</script>

{#snippet teamNode(node: TeamWithHierarchy, depth: number)}
	<div class="flex flex-col">
		<div 
			class="flex items-center gap-2 py-1.5 hover:bg-accent/50 rounded-md pr-2 transition-colors text-sm" 
			style="padding-left: {depth * 1.5 + 0.5}rem"
		>
			{#if node.children && node.children.length > 0}
				<button onclick={() => toggle(node.id)} class="p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground">
					{#if expanded[node.id]}
						<ChevronDown class="w-4 h-4" />
					{:else}
						<ChevronRight class="w-4 h-4" />
					{/if}
				</button>
			{:else}
				<div class="w-5"></div> <!-- Spacer -->
			{/if}
			
			<a href="/teams/{node.id}" class="flex items-center gap-2 flex-1 text-foreground/90 hover:text-primary">
				<Users class="w-4 h-4 text-muted-foreground" />
				<span class="font-medium">{node.name}</span>
			</a>
		</div>

		{#if node.children && node.children.length > 0 && expanded[node.id]}
			<div transition:slide={{ duration: 200 }}>
				{#each node.children as child}
					{@render teamNode(child, depth + 1)}
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

<div class="rounded-lg border bg-card text-card-foreground shadow-sm">
	<div class="p-6 pt-6">
		<h3 class="font-semibold leading-none tracking-tight mb-4">Organization Structure</h3>
		<div class="space-y-1">
			{#each tree as root}
				{@render teamNode(root, 0)}
			{/each}
		</div>
	</div>
</div>

