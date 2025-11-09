<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import {
		DropdownMenu,
		DropdownMenuContent,
		DropdownMenuItem,
		DropdownMenuLabel,
		DropdownMenuSeparator,
		DropdownMenuTrigger
	} from '$lib/components/ui/dropdown-menu';
	import DarkModeToggle from '$lib/components/common/dark-mode-toggle.svelte';
	import { Calendar, Users, Settings, User, LogOut, LayoutDashboard, Heart } from '@lucide/svelte';
	import { getUserInitials } from '$lib/utils/user';
	import type { LayoutData } from './$types';
	import '../../app.css';

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
</script>

<div class="flex min-h-screen flex-col">
	<!-- Top Navigation Bar -->
	<header class="border-b bg-card">
		<div class="container mx-auto flex h-16 items-center justify-between px-4">
			<!-- Logo and Title -->
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-primary p-2">
					<Calendar class="h-6 w-6 text-primary-foreground" />
				</div>
				<div>
					<h1 class="text-lg font-bold">Sentio</h1>
					<p class="text-xs text-muted-foreground">Track your Mood</p>
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
								<a href="/api/auth/signout" class="flex w-full items-center">
									<LogOut class="mr-2 h-4 w-4" />
									Log out
								</a>
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
		<div class="container mx-auto px-4 text-center text-sm text-muted-foreground">
			<p>© 2025 Sentio. Track your team's well-being with care.</p>
		</div>
	</footer>
</div>
