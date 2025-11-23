<script lang="ts">
	import { goto } from '$app/navigation';
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
	import { Switch } from '$lib/components/ui/switch';
	import { Textarea } from '$lib/components/ui/textarea';
	import { ArrowLeft, Save, Users } from '@lucide/svelte';
	import { fly, fade } from 'svelte/transition';

	let { data } = $props();

	let name = $state('');
	let description = $state('');
	let visibility = $state<'public' | 'team' | 'private'>('team');
	let allowMultipleMoodsPerDay = $state(true);
	let requireComment = $state(false);
	let showWeekends = $state(true);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();

		if (!name.trim()) {
			error = 'Team name is required';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			const response = await fetch('/api/teams', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					name: name.trim(),
					description: description.trim() || undefined,
					visibility,
					allowMultipleMoodsPerDay,
					requireComment,
					showWeekends
				})
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || 'Failed to create team');
			}

			const result = await response.json();

			if (!result.success || !result.data) {
				throw new Error(result.error || 'Failed to create team');
			}

			await goto(`/teams/${result.data.id}`);
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to create team';
		} finally {
			isSubmitting = false;
		}
	}
</script>

<svelte:head>
	<title>Create New Team - Sentio</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-6 px-4 py-8">
	<!-- Header -->
	<div class="flex items-center gap-3">
		<Button href="/teams" variant="ghost" size="icon">
			<ArrowLeft class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold">Create New Team</h1>
			<p class="text-muted-foreground">Set up a team to track moods together</p>
		</div>
	</div>

	{#if error}
		<div
			class="rounded-lg border border-red-500 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100"
		>
			{error}
		</div>
	{/if}

	<form onsubmit={handleSubmit}>
		<!-- Basic Information -->
		<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						<div class="rounded-lg bg-primary/10 p-2 text-primary">
							<Users class="h-5 w-5" />
						</div>
						Team Information
					</CardTitle>
					<CardDescription>Basic details about your team</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="space-y-2">
						<Label for="name">Team Name *</Label>
						<Input
							id="name"
							bind:value={name}
							placeholder="e.g., Development Team, Marketing Squad"
							required
							class="transition-all focus:ring-2 focus:ring-primary/20"
						/>
					</div>

					<div class="space-y-2">
						<Label for="description">Description</Label>
						<Textarea
							id="description"
							bind:value={description}
							placeholder="Describe the purpose of this team..."
							rows={3}
							class="resize-none transition-all focus:ring-2 focus:ring-primary/20"
						/>
					</div>

					<div class="space-y-2">
						<Label for="visibility">Visibility</Label>
						<Select type="single" bind:value={visibility}>
							<SelectTrigger class="transition-all focus:ring-2 focus:ring-primary/20">
								{visibility ? visibility : 'Select visibility'}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="public">Public - Anyone can view this team</SelectItem>
								<SelectItem value="team">Team Only - Only team members can view</SelectItem>
								<SelectItem value="private">Private - Hidden from others</SelectItem>
							</SelectContent>
						</Select>
						<p class="text-xs text-muted-foreground">Control who can see this team's calendar</p>
					</div>
				</CardContent>
			</Card>

		<!-- Calendar Settings -->
		<Card class="mt-6">
				<CardHeader>
					<CardTitle>Calendar Settings</CardTitle>
					<CardDescription>Configure how the calendar works for this team</CardDescription>
				</CardHeader>
				<CardContent class="space-y-6">
					<div class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30">
						<div class="space-y-0.5">
							<Label>Allow Multiple Moods Per Day</Label>
							<p class="text-sm text-muted-foreground">
								Let members log multiple mood entries in a single day
							</p>
						</div>
						<Switch bind:checked={allowMultipleMoodsPerDay} />
					</div>

					<div class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30">
						<div class="space-y-0.5">
							<Label>Require Comment</Label>
							<p class="text-sm text-muted-foreground">Make comments mandatory when logging moods</p>
						</div>
						<Switch bind:checked={requireComment} />
					</div>

					<div class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30">
						<div class="space-y-0.5">
							<Label>Show Weekends</Label>
							<p class="text-sm text-muted-foreground">Display Saturday and Sunday in the calendar</p>
						</div>
						<Switch bind:checked={showWeekends} />
					</div>
				</CardContent>
			</Card>

		<!-- Actions -->
		<div class="mt-6 flex justify-end gap-3">
			<Button type="button" variant="outline" onclick={() => goto('/teams')}>Cancel</Button>
			<Button type="submit" disabled={isSubmitting}>
				<Save class="mr-2 h-4 w-4" />
				{isSubmitting ? 'Creating...' : 'Create Team'}
			</Button>
		</div>
	</form>
</div>
