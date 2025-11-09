<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Separator } from '$lib/components/ui/separator';
	import { User, Bell, Palette, Calendar, Heart, Save } from '@lucide/svelte';
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let name = $state(data.user?.name || '');
	let timezone = $state(data.user?.timezone || 'UTC');
	let theme = $state(data.preferences?.theme || 'system');
	let defaultView = $state(data.preferences?.defaultView || 'week');
	let enableNotifications = $state(data.preferences?.enableNotifications ?? true);
	let personalMode = $state(data.user?.personalMode ?? false);

	function getUserInitials(userName: string) {
		return userName
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.slice(0, 2);
	}

	const timezones = [
		'UTC',
		'America/New_York',
		'America/Chicago',
		'America/Denver',
		'America/Los_Angeles',
		'Europe/London',
		'Europe/Paris',
		'Europe/Berlin',
		'Asia/Tokyo',
		'Asia/Shanghai',
		'Australia/Sydney'
	];
</script>

<div class="container mx-auto max-w-4xl space-y-6 px-4 py-8">
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold">Profile Settings</h1>
		<p class="text-muted-foreground">Manage your account settings and preferences</p>
	</div>

	{#if form?.success}
		<div
			class="rounded-lg border border-green-500 bg-green-50 p-4 text-green-900 dark:bg-green-950 dark:text-green-100"
		>
			{form.message}
		</div>
	{/if}

	{#if form?.error}
		<div
			class="rounded-lg border border-red-500 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100"
		>
			{form.error}
		</div>
	{/if}

	<!-- Profile Information -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<User class="h-5 w-5" />
				Profile Information
			</CardTitle>
			<CardDescription>Update your personal information</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/updateProfile" use:enhance class="space-y-6">
				<div class="flex flex-col items-center gap-4 md:flex-row">
					<Avatar class="h-24 w-24">
						<AvatarImage src={data.user?.image ?? undefined} alt={name} />
						<AvatarFallback class="text-2xl">{getUserInitials(name)}</AvatarFallback>
					</Avatar>
					<div class="flex-1 space-y-1 text-center md:text-left">
						<h3 class="text-lg font-semibold">{data.user?.name}</h3>
						<p class="text-sm text-muted-foreground">{data.user?.email}</p>
					</div>
				</div>

				<Separator />

				<div class="grid gap-4 md:grid-cols-2">
					<div class="space-y-2">
						<Label for="name">Full Name</Label>
						<Input id="name" name="name" bind:value={name} required />
					</div>

					<div class="space-y-2">
						<Label for="timezone">Timezone</Label>
						<Select type="single" name="timezone" bind:value={timezone}>
							<SelectTrigger>
								{timezone ? timezone : 'Select timezone'}
							</SelectTrigger>
							<SelectContent>
								{#each timezones as tz}
									<SelectItem value={tz}>{tz}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					</div>
				</div>

				<div class="flex justify-end">
					<Button type="submit">
						<Save class="mr-2 h-4 w-4" />
						Save Profile
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>

	<!-- Appearance -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Palette class="h-5 w-5" />
				Appearance
			</CardTitle>
			<CardDescription>Customize how the app looks</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/updatePreferences" use:enhance class="space-y-6">
				<div class="space-y-2">
					<Label for="theme">Theme</Label>
					<Select name="theme" type="single" bind:value={theme}>
						<SelectTrigger>
							{theme ? theme : 'Select theme'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="light">Light</SelectItem>
							<SelectItem value="dark">Dark</SelectItem>
							<SelectItem value="system">System</SelectItem>
						</SelectContent>
					</Select>
					<p class="text-xs text-muted-foreground">Choose your preferred color theme</p>
				</div>

				<input type="hidden" name="defaultView" value={defaultView} />
				<input type="hidden" name="enableNotifications" value={enableNotifications} />

				<div class="flex justify-end">
					<Button type="submit">
						<Save class="mr-2 h-4 w-4" />
						Save Appearance
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>

	<!-- Calendar Preferences -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Calendar class="h-5 w-5" />
				Calendar Preferences
			</CardTitle>
			<CardDescription>Customize your calendar view</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/updatePreferences" use:enhance class="space-y-6">
				<div class="space-y-2">
					<Label for="defaultView">Default View</Label>
					<Select name="defaultView" type="single" bind:value={defaultView}>
						<SelectTrigger>
							{defaultView ? defaultView : 'Select default view'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="day">Day View</SelectItem>
							<SelectItem value="week">Week View</SelectItem>
							<SelectItem value="month">Month View</SelectItem>
						</SelectContent>
					</Select>
					<p class="text-xs text-muted-foreground">
						Your preferred calendar view when opening the app
					</p>
				</div>

				<input type="hidden" name="theme" value={theme} />
				<input type="hidden" name="enableNotifications" value={enableNotifications} />

				<div class="flex justify-end">
					<Button type="submit">
						<Save class="mr-2 h-4 w-4" />
						Save Preferences
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>

	<!-- Notifications -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Bell class="h-5 w-5" />
				Notifications
			</CardTitle>
			<CardDescription>Manage your notification preferences</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/updatePreferences" use:enhance class="space-y-6">
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label>Enable Notifications</Label>
						<p class="text-sm text-muted-foreground">Receive reminders to log your daily mood</p>
					</div>
					<Switch name="enableNotifications" bind:checked={enableNotifications} />
				</div>

				<input type="hidden" name="theme" value={theme} />
				<input type="hidden" name="defaultView" value={defaultView} />

				<div class="flex justify-end">
					<Button type="submit">
						<Save class="mr-2 h-4 w-4" />
						Save Notifications
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>

	<!-- Personal Mode -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<Heart class="h-5 w-5" />
				Personal Mode
			</CardTitle>
			<CardDescription>Use the calendar for personal mood tracking</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/togglePersonalMode" use:enhance class="space-y-6">
				<div class="flex items-center justify-between">
					<div class="space-y-0.5">
						<Label>Enable Personal Mode</Label>
						<p class="text-sm text-muted-foreground">Track your moods privately without teams</p>
					</div>
					<Switch name="enabled" bind:checked={personalMode} />
					<!-- onchange={(e) => {
							personalMode = e.currentTarget.checked;
							e.currentTarget.form?.requestSubmit();
						}} -->
				</div>
			</form>
		</CardContent>
	</Card>
</div>
