<script lang="ts">
	import { goto } from '$app/navigation';
	import * as Avatar from '$lib/components/ui/avatar/index.js';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { getUserInitials } from '$lib/utils/user';
	import { authClient } from '$lib/auth/client';
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';
	import { LayoutDashboard, LogOut, Settings, User } from '@lucide/svelte';

	let {
		user
	}: {
		user: {
			name: string;
			email: string;
			image?: string | null;
			isAdmin?: boolean;
		};
	} = $props();

	const sidebar = useSidebar();

	async function onLogout() {
		try {
			await authClient.signOut();
			await goto('/login');
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger class="flex w-full items-center space-x-2  hover:bg-sidebar-accent!">
				<Avatar.Root class="size-8 rounded-full">
					<Avatar.Image src={user.image ?? undefined} alt={user.name} />
					<Avatar.Fallback class="rounded-full">{getUserInitials(user.name)}</Avatar.Fallback>
				</Avatar.Root>
				<div class="grid flex-1 text-left text-sm leading-tight">
					<span class="truncate font-medium">{user.name}</span>
					<span class="truncate text-xs">{user.email}</span>
				</div>
				<ChevronsUpDownIcon class="ml-auto size-4" />
			</DropdownMenu.Trigger>
			<DropdownMenu.Content
				class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<DropdownMenu.Label class="p-0 font-normal">
					<div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
						<Avatar.Root class="size-8 rounded-full">
							<Avatar.Image src={user.image ?? undefined} alt={user.name} />
							<Avatar.Fallback class="rounded-full">{getUserInitials(user.name)}</Avatar.Fallback>
						</Avatar.Root>
						<div class="grid flex-1 text-left text-sm leading-tight">
							<span class="truncate font-medium">{user.name}</span>
							<span class="truncate text-xs">{user.email}</span>
						</div>
					</div>
				</DropdownMenu.Label>
				<DropdownMenu.Separator />
				<DropdownMenu.Group>
					<DropdownMenu.Item onclick={() => goto('/profile')}>
						<User />
						Profile
					</DropdownMenu.Item>
					<DropdownMenu.Item onclick={() => goto('/settings')}>
						<Settings />
						Settings
					</DropdownMenu.Item>
					{#if user.isAdmin}
						<DropdownMenu.Item onclick={() => goto('/admin')}>
							<LayoutDashboard />
							Admin Panel
						</DropdownMenu.Item>
					{/if}
				</DropdownMenu.Group>
				<DropdownMenu.Separator />
				<DropdownMenu.Item onclick={onLogout}>
					<LogOut />
					Log out
				</DropdownMenu.Item>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
