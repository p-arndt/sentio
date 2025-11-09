<script lang="ts">
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	type Props = {
		name: string;
		image?: string | null;
		isAdmin?: boolean;
	};
	let { name, image = null, isAdmin = false }: Props = $props();

	function initials(n: string) {
		return n.split(' ').map((x) => x[0]).join('').toUpperCase().slice(0, 2);
	}
</script>

<div class="flex items-center gap-2">
	<Avatar class="h-8 w-8">
		<AvatarImage src={image ?? undefined} alt={name} />
		<AvatarFallback>{initials(name)}</AvatarFallback>
	</Avatar>
	<div class="min-w-0 flex-1">
		<div class="truncate text-sm font-medium">{name}</div>
		{#if isAdmin}
			<div class="text-[10px] text-muted-foreground">Admin</div>
		{/if}
	</div>
</div>
