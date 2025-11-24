<script lang="ts">
	import * as Breadcrumb from '$lib/components/ui/breadcrumb';
	import type { Team } from '$lib/types';

	let { ancestors = [], currentTeam } = $props<{
		ancestors: Team[];
		currentTeam?: Team;
	}>();
</script>

<Breadcrumb.Root>
	<Breadcrumb.List>
		<Breadcrumb.Item>
			<Breadcrumb.Link href="/teams">Teams</Breadcrumb.Link>
		</Breadcrumb.Item>
		<Breadcrumb.Separator />
		{#each ancestors as team}
			<Breadcrumb.Item>
				<Breadcrumb.Link href="/teams/{team.id}">{team.name}</Breadcrumb.Link>
			</Breadcrumb.Item>
			<Breadcrumb.Separator />
		{/each}
		{#if currentTeam}
			<Breadcrumb.Item>
				<Breadcrumb.Page>{currentTeam.name}</Breadcrumb.Page>
			</Breadcrumb.Item>
		{/if}
	</Breadcrumb.List>
</Breadcrumb.Root>

