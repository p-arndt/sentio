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
	import { Textarea } from '$lib/components/ui/textarea';
	import { Switch } from '$lib/components/ui/switch';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import {
		AlertDialog,
		AlertDialogAction,
		AlertDialogCancel,
		AlertDialogContent,
		AlertDialogDescription,
		AlertDialogFooter,
		AlertDialogHeader,
		AlertDialogTitle,
		AlertDialogTrigger
	} from '$lib/components/ui/alert-dialog';
	import TeamHierarchySelector from '$lib/components/TeamHierarchySelector.svelte';
	import { ChevronLeft, Save, Trash2, Settings as SettingsIcon } from '@lucide/svelte';
	import { enhance } from '$app/forms';
	import { fly, fade } from 'svelte/transition';

	let { data, form } = $props();

	let name = $state(data.team.name);
	let description = $state(data.team.description || '');
	let parentId = $state(data.team.parentId || null);
	let visibility = $state(data.team.visibility || 'members_only');
	let isContainer = $state(data.team.isContainer ?? false);
	let allowMultipleMoodsPerDay = $state(data.team.allowMultipleMoodsPerDay ?? true);
	let requireComment = $state(data.team.requireComment ?? false);
	let showWeekends = $state(data.team.showWeekends ?? true);
</script>

<svelte:head>
	<title>Team Settings - {data.team.name} - Sentio</title>
</svelte:head>

<div class="container mx-auto max-w-4xl space-y-6 px-4 py-8" in:fade={{ duration: 300 }}>
	<!-- Header -->
	<div class="flex items-center gap-3">
		<Button href="/teams/{data.team.id}" variant="ghost" size="icon">
			<ChevronLeft class="h-4 w-4" />
		</Button>
		<div>
			<h1 class="text-3xl font-bold">Team Settings</h1>
			<p class="text-muted-foreground">{data.team.name}</p>
		</div>
	</div>

	{#if form?.success}
		<div
			in:fly={{ y: -10, duration: 300 }}
			class="rounded-lg border border-green-500 bg-green-50 p-4 text-green-900 dark:bg-green-950 dark:text-green-100"
		>
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

	<!-- General Settings -->
	<Card>
		<CardHeader>
			<CardTitle class="flex items-center gap-2">
				<SettingsIcon class="h-5 w-5" />
				General Settings
			</CardTitle>
			<CardDescription>Manage team information and basic settings</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/updateSettings" use:enhance class="space-y-6">
				<div class="space-y-2">
					<Label for="name">Team Name</Label>
					<Input
						id="name"
						name="name"
						bind:value={name}
						required
						class="transition-all focus:ring-2 focus:ring-primary/20"
					/>
				</div>

					<div class="space-y-2">
						<Label for="description">Description</Label>
						<Textarea
							id="description"
							name="description"
							bind:value={description}
							placeholder="Describe your team..."
							rows={3}
							class="resize-none transition-all focus:ring-2 focus:ring-primary/20"
						/>
					</div>

					<div class="space-y-2">
						<Label>Parent Team</Label>
						<TeamHierarchySelector
							bind:value={parentId}
							tree={data.teamTrees}
							currentTeamId={data.team.id}
							placeholder="Select parent team (optional)"
						/>
					</div>

					<div class="space-y-2">
						<Label for="visibility">Visibility</Label>
						<Select name="visibility" type="single" bind:value={visibility}>
							<SelectTrigger class="transition-all focus:ring-2 focus:ring-primary/20">
								{visibility ? visibility : 'Select visibility'}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="public">Public - Anyone can view</SelectItem>
								<SelectItem value="members_only">Members Only - Only team members can view</SelectItem
								>
								<SelectItem value="private">Private - Hidden from others</SelectItem>
							</SelectContent>
						</Select>
						<p class="text-xs text-muted-foreground">Control who can see this team's calendar</p>
					</div>

					<div class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30">
						<div class="space-y-0.5">
							<Label>Container Team</Label>
							<p class="text-sm text-muted-foreground">
								This team acts as a container for sub-teams. Direct mood logging will be disabled.
							</p>
						</div>
						<Switch bind:checked={isContainer} />
					</div>
					<input type="hidden" name="isContainer" value={isContainer ? 'true' : 'false'} />

					<div class="flex justify-end">
					<Button type="submit" class="transition-all active:scale-95">
						<Save class="mr-2 h-4 w-4" />
						Save General Settings
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>

	<!-- Calendar Settings -->
	<Card>
		<CardHeader>
			<CardTitle>Calendar Settings</CardTitle>
			<CardDescription>Configure how the calendar works for this team</CardDescription>
		</CardHeader>
		<CardContent>
			<form method="POST" action="?/updateSettings" use:enhance class="space-y-6">
				<input type="hidden" name="name" value={name} />
				<input type="hidden" name="description" value={description} />
				<input type="hidden" name="visibility" value={visibility} />
				<input type="hidden" name="parentId" value={parentId || ''} />
				<input type="hidden" name="isContainer" value={isContainer ? 'true' : 'false'} />

				<div
					class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30"
				>
					<div class="space-y-0.5">
						<Label>Container Team</Label>
						<p class="text-sm text-muted-foreground">
							Container teams only contain sub-teams and cannot have direct mood entries
						</p>
					</div>
					<Switch bind:checked={isContainer} />
				</div>

				<div
					class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30"
				>
					<div class="space-y-0.5">
						<Label>Allow Multiple Moods Per Day</Label>
						<p class="text-sm text-muted-foreground">
							Let members log multiple mood entries in a single day
						</p>
					</div>
					<Switch bind:checked={allowMultipleMoodsPerDay} />
				</div>
				<input
					type="hidden"
					name="allowMultipleMoodsPerDay"
					value={allowMultipleMoodsPerDay ? 'true' : 'false'}
				/>

				<div
					class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30"
				>
					<div class="space-y-0.5">
						<Label>Require Comment</Label>
						<p class="text-sm text-muted-foreground">Make comments mandatory when logging moods</p>
					</div>
					<Switch bind:checked={requireComment} />
				</div>
				<input type="hidden" name="requireComment" value={requireComment ? 'true' : 'false'} />

				<div
					class="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-muted/30"
				>
					<div class="space-y-0.5">
						<Label>Show Weekends</Label>
						<p class="text-sm text-muted-foreground">Display Saturday and Sunday in the calendar</p>
					</div>
					<Switch bind:checked={showWeekends} />
				</div>
				<input type="hidden" name="showWeekends" value={showWeekends ? 'true' : 'false'} />
				<div class="flex justify-end">
					<Button type="submit" class="transition-all active:scale-95">
						<Save class="mr-2 h-4 w-4" />
						Save Calendar Settings
					</Button>
				</div>
			</form>
		</CardContent>
	</Card>

	<!-- Danger Zone -->
	<Card class="border-destructive">
		<CardHeader>
			<CardTitle class="text-destructive">Danger Zone</CardTitle>
			<CardDescription>Irreversible actions for this team</CardDescription>
		</CardHeader>
		<CardContent>
			<div
				class="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4"
			>
				<div class="space-y-1">
					<p class="font-medium text-destructive">Delete this team</p>
					<p class="text-sm text-muted-foreground">
						Once you delete a team, there is no going back. Please be certain.
					</p>
				</div>
				<AlertDialog>
					<AlertDialogTrigger>
						<Button variant="destructive">
							<Trash2 class="mr-2 h-4 w-4" />
							Delete Team
						</Button>
					</AlertDialogTrigger>
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
							<AlertDialogDescription>
								This action cannot be undone. This will permanently delete the team
								<strong>{data.team.name}</strong> and all associated mood entries.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter>
							<AlertDialogCancel>Cancel</AlertDialogCancel>
							<form method="POST" action="?/deleteTeam" use:enhance>
								<AlertDialogAction type="submit" class="bg-destructive">
									Delete Team
								</AlertDialogAction>
							</form>
						</AlertDialogFooter>
					</AlertDialogContent>
				</AlertDialog>
			</div>
		</CardContent>
	</Card>
</div>
