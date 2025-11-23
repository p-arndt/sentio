<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import * as Collapsible from '$lib/components/ui/collapsible/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	let {
		items
	}: {
		items: {
			title: string;
			url: string;
			icon?: any;
			isActive?: boolean;
			items?: {
				title: string;
				url: string;
			}[];
			hasSubItems?: boolean;
		}[];
	} = $props();

	async function handleClick(url: string, e?: MouseEvent) {
		// If clicking on the chevron, don't navigate
		if (e && (e.target as HTMLElement).closest('svg')) {
			return;
		}
		await goto(url);
	}
</script>

<Sidebar.Group>
	<Sidebar.GroupLabel>Navigation</Sidebar.GroupLabel>
	<Sidebar.Menu>
		{#each items as item (item.title)}
			{#if (item.items && item.items.length > 0) || item.hasSubItems}
				<Collapsible.Root open={item.isActive || false} class="group/collapsible">
					{#snippet child({ props })}
						<Sidebar.MenuItem {...props}>
							<Collapsible.Trigger>
								{#snippet child({ props })}
									<a href={item.url} {...props}>
										<Sidebar.MenuButton
											{...props}
											tooltipContent={item.title}
											isActive={item.isActive}
											onclick={(e) => handleClick(item.url, e)}
										>
											{#if item.icon}
												<item.icon />
											{/if}
											<span class="flex-1">{item.title}</span>
											<Button
												variant="ghost"
												size="icon"
												onclick={(e) => handleClick(item.url, e)}
												class="z-50"
											>
												<ChevronRightIcon
													class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
												/>
											</Button>
										</Sidebar.MenuButton>
									</a>
								{/snippet}
							</Collapsible.Trigger>
							<Collapsible.Content>
								<Sidebar.MenuSub>
									{#each item.items ?? [] as subItem (subItem.title)}
										<Sidebar.MenuSubItem>
											<Sidebar.MenuSubButton isActive={page.url.pathname === subItem.url}>
												{#snippet child({ props })}
													<a href={subItem.url} {...props}>
														<span>{subItem.title}</span>
													</a>
												{/snippet}
											</Sidebar.MenuSubButton>
										</Sidebar.MenuSubItem>
									{/each}
								</Sidebar.MenuSub>
							</Collapsible.Content>
						</Sidebar.MenuItem>
					{/snippet}
				</Collapsible.Root>
			{:else}
				<Sidebar.MenuItem>
					<Sidebar.MenuButton
						tooltipContent={item.title}
						isActive={item.isActive}
						onclick={() => handleClick(item.url)}
					>
						{#if item.icon}
							<item.icon />
						{/if}
						<span>{item.title}</span>
					</Sidebar.MenuButton>
				</Sidebar.MenuItem>
			{/if}
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
