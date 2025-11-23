<script lang="ts">
	import { page } from '$app/state';
	import sentiologo from '$lib/assets/logo.png';
	import NavMain from '$lib/components/nav-main.svelte';
	import NavUser from '$lib/components/nav-user.svelte';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import { useSidebar } from '$lib/components/ui/sidebar/index.js';
	import { LayoutDashboard, Heart, Users } from '@lucide/svelte';
	import type { ComponentProps } from 'svelte';

	type LayoutData = {
		user?: {
			name: string;
			email: string;
			image?: string | null;
			isAdmin?: boolean;
		};
		teams?: Array<{
			id: string;
			name: string;
		}>;
		version?: string;
	};

	type Props = {
		data: LayoutData;
		ref?: ComponentProps<typeof Sidebar.Root>['ref'];
		collapsible?: ComponentProps<typeof Sidebar.Root>['collapsible'];
	};

	let { data, ref = $bindable(null), collapsible = 'icon', ...restProps }: Props = $props();

	const sidebar = useSidebar();

	function isActive(href: string) {
		if (href === '/') {
			return page.url.pathname === '/';
		}
		return page.url.pathname.startsWith(href);
	}

	function isTeamPage() {
		return page.url.pathname.startsWith('/teams/');
	}

	const navigation = $derived([
		{
			title: 'Dashboard',
			url: '/',
			icon: LayoutDashboard,
			isActive: isActive('/'),
			items: []
		},
		{
			title: 'Teams',
			url: '/teams',
			icon: Users,
			isActive: isActive('/teams') || isTeamPage(),
			items: []
		},
		{
			title: 'Personal',
			url: '/personal',
			icon: Heart,
			isActive: isActive('/personal'),
			items: []
		}
	]);
</script>

<Sidebar.Root {collapsible} bind:ref {...restProps}>
	<Sidebar.Header>
		<div class="flex items-center {sidebar.open ? 'justify-start' : 'justify-center'} duration-300 transition-all ease-linear gap-4 px-2">
			<img src={sentiologo} alt="Sentio logo" class="max-w-7" />
			<h1 class="text-xl font-bold {sidebar.open ? 'block' : 'hidden'}">Sentio</h1>
		</div>
	</Sidebar.Header>
	<Sidebar.Content>
		<NavMain items={navigation} />
	</Sidebar.Content>
	<Sidebar.Footer>
		{#if data.user}
			<NavUser user={data.user} />
		{/if}
	</Sidebar.Footer>
</Sidebar.Root>
