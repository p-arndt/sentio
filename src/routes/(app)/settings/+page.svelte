<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Settings as SettingsIcon, User, ArrowLeft } from '@lucide/svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>Settings - Sentio</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-6 px-4 py-8">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<Button href="/" variant="ghost" size="icon">
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold">Settings</h1>
			<p class="text-muted-foreground">Manage your application settings</p>
		</div>
	</div>

	<!-- Settings Categories -->
	<div class="grid gap-4 md:grid-cols-2">
		<Card class="transition-all hover:shadow-md">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<User class="h-5 w-5" />
					Profile Settings
				</CardTitle>
				<CardDescription>
					Manage your profile, preferences, and personal information
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Button href="/profile" class="w-full">
					Go to Profile
				</Button>
			</CardContent>
		</Card>

		<Card class="transition-all hover:shadow-md">
			<CardHeader>
				<CardTitle class="flex items-center gap-2">
					<SettingsIcon class="h-5 w-5" />
					Application Settings
				</CardTitle>
				<CardDescription>
					Configure app-wide settings and preferences
				</CardDescription>
			</CardHeader>
			<CardContent>
				<p class="text-sm text-muted-foreground">
					Additional settings coming soon...
				</p>
			</CardContent>
		</Card>
	</div>

	<!-- Quick Actions -->
	<Card>
		<CardHeader>
			<CardTitle>Quick Actions</CardTitle>
			<CardDescription>Common tasks and shortcuts</CardDescription>
		</CardHeader>
		<CardContent class="space-y-3">
			<Button href="/profile" variant="outline" class="w-full justify-start">
				Update Profile Information
			</Button>
			<Button href="/personal" variant="outline" class="w-full justify-start">
				View Personal Calendar
			</Button>
			<Button href="/teams" variant="outline" class="w-full justify-start">
				Manage Teams
			</Button>
		</CardContent>
	</Card>
</div>
