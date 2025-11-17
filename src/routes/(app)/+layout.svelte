<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import sentiologo from '$lib/assets/logo.png';
	import { authClient } from '$lib/auth/client';
	import DarkModeToggle from '$lib/components/common/dark-mode-toggle.svelte';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import Version from '$lib/components/Version.svelte';
	import { getUserInitials } from '$lib/utils/user';
	import { Heart, LayoutDashboard, LogOut, Settings, User, Users } from '@lucide/svelte';
	import '../../app.css';
	import type { LayoutData } from './$types';

	type Props = {
		data: LayoutData;
		children: any;
	};

	let { data, children }: Props = $props();

	const navigation = [
		{ name: 'Dashboard', href: '/', icon: LayoutDashboard },
		{ name: 'Teams', href: '/teams', icon: Users },
		{ name: 'Personal', href: '/personal', icon: Heart }
	];

	function isActive(href: string) {
		if (href === '/') {
			return page.url.pathname === '/';
		}
		return page.url.pathname.startsWith(href);
	}

	async function onLogout() {
		try {
			await authClient.signOut();
			await goto('/login');
		} catch (error) {
			console.error('Logout failed:', error);
		}
	}
</script>

<div class="flex min-h-screen flex-col">
	<!-- Top Navigation Bar -->
	<header class="border-b bg-card">
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<!-- Logo and Title -->
			<div class="flex items-center gap-1">
				<img src={sentiologo} alt="Senoti logo" class="h-10 w-10" />
				<div>
					<h1 class="text-xl font-bold">Sentio</h1>
				</div>
			</div>

			<!-- Navigation Links -->
			<nav class="hidden items-center gap-1 md:flex">
				{#each navigation as item}
					<Button
						variant={isActive(item.href) ? 'default' : 'ghost'}
						href={item.href}
						class="gap-2"
					>
						<item.icon class="h-4 w-4" />
						{item.name}
					</Button>
				{/each}
			</nav>

			<!-- Right Side Actions -->
			<div class="flex items-center gap-2">
				<DarkModeToggle />

				{#if data.user}
					<DropdownMenu>
						<DropdownMenuTrigger>
							<Avatar>
								<AvatarImage src={data.user.image ?? undefined} alt={data.user.name} />
								<AvatarFallback>{getUserInitials(data.user.name)}</AvatarFallback>
							</Avatar>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" class="w-56">
							<DropdownMenuLabel>
								<div class="flex flex-col space-y-1">
									<p class="text-sm font-medium">{data.user.name}</p>
									<p class="text-xs text-muted-foreground">{data.user.email}</p>
									{#if data.user.isAdmin}
										<span
											class="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-xs font-medium text-primary-foreground"
										>
											Admin
										</span>
									{/if}
								</div>
							</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<a href="/profile" class="flex w-full items-center">
									<User class="mr-2 h-4 w-4" />
									Profile
								</a>
							</DropdownMenuItem>
							<DropdownMenuItem>
								<a href="/settings" class="flex w-full items-center">
									<Settings class="mr-2 h-4 w-4" />
									Settings
								</a>
							</DropdownMenuItem>
							{#if data.user.isAdmin}
								<DropdownMenuSeparator />
								<DropdownMenuItem>
									<a href="/admin" class="flex w-full items-center">
										<LayoutDashboard class="mr-2 h-4 w-4" />
										Admin Panel
									</a>
								</DropdownMenuItem>
							{/if}
							<DropdownMenuSeparator />
							<DropdownMenuItem>
								<button onclick={onLogout} class="flex w-full items-center">
									<LogOut class="mr-2 h-4 w-4" />
									Log out
								</button>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				{:else}
					<Button href="/login" variant="default">Sign In</Button>
				{/if}
			</div>
		</div>
	</header>

	<!-- Mobile Navigation -->
	<nav class="border-b bg-card md:hidden">
		<div class="container mx-auto flex items-center justify-around px-2 py-2">
			{#each navigation as item}
				<Button
					variant={isActive(item.href) ? 'default' : 'ghost'}
					href={item.href}
					size="sm"
					class="h-auto flex-col gap-1 py-2"
				>
					<item.icon class="h-4 w-4" />
					<span class="text-xs">{item.name}</span>
				</Button>
			{/each}
		</div>
	</nav>

	<!-- Main Content -->
	<main class="flex-1 bg-background">
		{@render children()}
	</main>

	<!-- Footer -->
	<footer class="border-t bg-card py-6">
		<div
			class="container mx-auto flex items-center justify-between px-4 text-sm text-muted-foreground"
		>
			<p>© 2025 Sentio. Track your team's well-being with care.</p>
			<div class="ml-4">
				<Version version={data.version} />
			</div>
		</div>
	</footer>
</div>
