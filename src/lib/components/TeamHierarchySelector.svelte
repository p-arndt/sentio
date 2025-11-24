<script lang="ts">
	import * as Select from '$lib/components/ui/select';
	import type { TeamWithHierarchy } from '$lib/types';

	let {
		value = $bindable(),
		tree,
		currentTeamId,
		placeholder = 'Select parent team'
	} = $props<{
		value?: string | null;
		tree: TeamWithHierarchy[];
		currentTeamId?: string;
		placeholder?: string;
	}>();

	type FlattenedOption = {
		id: string;
		name: string;
		depth: number;
		disabled: boolean;
	};

	function flatten(nodes: TeamWithHierarchy[], depth: number, parentIsInvalid: boolean): FlattenedOption[] {
		let result: FlattenedOption[] = [];
		for (const node of nodes) {
			const isCurrent = node.id === currentTeamId;
			const isInvalid = parentIsInvalid || isCurrent;

			result.push({
				id: node.id,
				name: node.name,
				depth,
				disabled: isInvalid
			});

			if (node.children) {
				result = [...result, ...flatten(node.children, depth + 1, isInvalid)];
			}
		}
		return result;
	}

	let options = $derived(flatten(tree, 0, false));
	
	// Handle selected label
	let selectedLabel = $derived.by(() => {
		if (!value) return "No Parent (Root)";
		const found = options.find(o => o.id === value);
		return found ? found.name : placeholder;
	});
</script>

<div class="flex flex-col gap-1.5">
	<input type="hidden" name="parentId" value={value || ''} />
	<Select.Root type="single" bind:value={value}>
		<Select.Trigger>
			{selectedLabel}
		</Select.Trigger>
		<Select.Content>
			<Select.Item value="" label="No Parent (Root)">
				<span class="font-medium text-muted-foreground">No Parent (Root)</span>
			</Select.Item>
			{#each options as option}
				<Select.Item value={option.id} label={option.name} disabled={option.disabled}>
					<div class="flex items-center">
						<!-- Indentation using spacers -->
						{#if option.depth > 0}
							<div style="width: {option.depth * 1.5}rem"></div>
							<span class="text-muted-foreground mr-2">└</span>
						{/if}
						<span>{option.name}</span>
					</div>
				</Select.Item>
			{/each}
		</Select.Content>
	</Select.Root>
	<p class="text-[0.8rem] text-muted-foreground">
		Select a parent team to nest this team under.
	</p>
</div>

