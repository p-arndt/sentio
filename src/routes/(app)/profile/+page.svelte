<script lang="ts">
	import { enhance } from '$app/forms';
	import AchievementGrid from '$lib/components/achievements/AchievementGrid.svelte';
	import { Avatar, AvatarFallback, AvatarImage } from '$lib/components/ui/avatar';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { Separator } from '$lib/components/ui/separator';
	import { getUserInitials } from '$lib/utils/user';
	import { Check, Save, Trophy, User } from '@lucide/svelte';
	import { fly, blur } from 'svelte/transition';

	let { data, form } = $props();

	let name = $state(data.user?.name || '');
	let timezone = $state(data.user?.timezone || 'UTC');
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

<svelte:head>
	<title>Profile Settings - Sentio</title>
</svelte:head>

<div class="container mx-auto max-w-5xl space-y-8 px-4 py-8" in:blur>
	<!-- Header -->
	<div>
		<h1 class="text-3xl font-bold">Profile Settings</h1>
		<p class="text-muted-foreground">Manage your account settings and preferences</p>
	</div>

	{#if form?.success}
		<div
			in:fly={{ y: -10, duration: 300 }}
			class="flex items-center gap-2 rounded-lg border border-green-500 bg-green-50 p-4 text-green-900 dark:bg-green-950 dark:text-green-100"
		>
			<Check class="h-4 w-4" />
			{form.message}
		</div>
	{/if}

	{#if form?.error}
		<div
			in:fly={{ y: -10, duration: 300 }}
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

	<!-- Badges -->

	<Card>
		<CardHeader>
			<CardTitle class="inline-flex items-center gap-2">
				<Trophy class="h-5 w-5 text-yellow-500" />
				Achievements
			</CardTitle>
			<CardDescription>Your earned achievements</CardDescription>
		</CardHeader>
		<CardContent>
			<AchievementGrid
				achievements={data.allAchievements}
				userAchievements={data.userAchievements}
			/>
		</CardContent>
	</Card>
</div>
