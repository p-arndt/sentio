<script lang="ts">
	import { page } from '$app/state';
	import { Button } from '$lib/components/ui/button';
	import { Separator } from '$lib/components/ui/separator';
	import { Users, UserCog, Settings, LayoutDashboard, Smile, Mail, Home } from '@lucide/svelte';
	import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';

	type Props = {
		children: import('svelte').Snippet;
		data?: { emailConfigured?: boolean };
	};

	let { children, data }: Props = $props();

	const navItems = [
		{ href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
		{
			href: '/admin/invitations',
			label: 'Invitations',
			icon: Mail,
			disabled: !data?.emailConfigured
		},
		{ href: '/admin/teams', label: 'Teams', icon: Users },
		{ href: '/admin/members', label: 'Members', icon: UserCog },
		{ href: '/admin/emotions', label: 'Emotions', icon: Smile },
		{ href: '/admin/settings', label: 'Settings', icon: Settings }
	];
</script>

<div class="flex min-h-screen">
	<aside class="w-64 border-r bg-muted/40">
		<div class="flex h-16 items-center border-b px-6">
			<h1 class="text-xl font-bold">Admin Panel</h1>
		</div>
		<nav class="flex flex-col gap-1 p-4">
			<Button variant="ghost" class="justify-start" href="/">
				<Home class="mr-2 h-4 w-4" />
				Back to Home
			</Button>
			<Separator class="my-2" />
			{#each navItems as item}
				<Button
					variant={page.url.pathname === item.href ? 'secondary' : 'ghost'}
					class="justify-start"
					href={item.disabled ? undefined : item.href}
					disabled={item.disabled}
					title={item.disabled ? `${item.label} (disabled)` : item.label}
				>
					<item.icon class="mr-2 h-4 w-4" />
					{item.label}
				</Button>
			{/each}
		</nav>
	</aside>

	<main class="flex-1">
		<div class="border-b">
			<div class="flex h-16 items-center px-6">
				<h2 class="text-2xl font-semibold">
					{navItems.find((item) => item.href === page.url.pathname)?.label || 'Admin'}
				</h2>
			</div>
		</div>
		{#if !data?.emailConfigured}
			<div class="p-6">
				<Alert variant="warning">
					<AlertTitle>Emails not configured</AlertTitle>
					<AlertDescription>
						An email provider is not configured. Invitation-related functionality is disabled.
						Please configure SMTP settings in the Admin Settings page.
					</AlertDescription>
				</Alert>
			</div>
		{/if}

		<div class="p-6">
			{@render children()}
		</div>
	</main>
</div>
