<script lang="ts">
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	type Props = {
		data: PageData;
		form?: { success?: boolean; error?: string } | null;
	};
	let { data, form = null }: Props = $props();

	let showWeekends = $state(data.settings.showWeekends);
	let smtpHost = $state(data.settings.smtpHost || '');
	let smtpPort = $state(data.settings.smtpPort || '587');
	let smtpUsername = $state(data.settings.smtpUsername || '');
	let smtpPassword = $state(data.settings.smtpPassword || '');
	let smtpFromEmail = $state(data.settings.smtpFromEmail || '');
	let smtpFromEnv = data.settings.smtpFromEnv || {
		host: false,
		port: false,
		username: false,
		password: false,
		fromEmail: false
	};

	let isFromEnv = $derived(
		smtpFromEnv.host ||
			smtpFromEnv.port ||
			smtpFromEnv.username ||
			smtpFromEnv.password ||
			smtpFromEnv.fromEmail
	);
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Calendar Settings</h3>
		<p class="text-sm text-muted-foreground">Configure how the calendar displays</p>
	</div>

	{#if form?.success}
		<div
			class="rounded-lg border border-green-500 bg-green-50 p-4 text-green-900 dark:bg-green-950 dark:text-green-100"
		>
			Settings saved successfully!
		</div>
	{/if}

	{#if form?.error}
		<div
			class="rounded-lg border border-red-500 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100"
		>
			{form.error}
		</div>
	{/if}

	<Card>
		<CardHeader>
			<CardTitle>Display Options</CardTitle>
			<CardDescription>Customize what days are shown in the calendar</CardDescription>
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				action="?/updateSettings"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
					};
				}}
			>
				<div class="flex items-center justify-between rounded-lg border p-4">
					<div class="space-y-0.5">
						<Label for="show-weekends" class="text-base">Show Weekend Days</Label>
						<p class="text-sm text-muted-foreground">Display Saturday and Sunday in the calendar</p>
					</div>
					<Switch id="show-weekends" name="showWeekends" bind:checked={showWeekends} />
				</div>

				<input type="hidden" name="showWeekends" value={showWeekends ? 'true' : 'false'} />

				<div class="mt-6 flex justify-end">
					<Button type="submit">Save Changes</Button>
				</div>
			</form>
		</CardContent>
	</Card>

	<Card>
		<CardHeader>
			<CardTitle>Email Settings</CardTitle>
			<CardDescription>Configure SMTP settings for sending invitation emails</CardDescription>
			{#if smtpFromEnv.host || smtpFromEnv.port || smtpFromEnv.username || smtpFromEnv.password || smtpFromEnv.fromEmail}
				<div
					class="mt-2 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800"
				>
					Using SMTP values from environment variables. Submitting this form will persist values to
					the database and override the env defaults.
				</div>
			{/if}
		</CardHeader>
		<CardContent>
			<form
				method="POST"
				action="?/updateEmailSettings"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
					};
				}}
			>
				<div class="space-y-4">
					<div class="grid grid-cols-2 gap-4">
						<div class="space-y-2">
							<Label for="smtp-host" class="text-sm font-medium">SMTP Host</Label>

							<div class="flex items-center gap-2">
								<Input
									id="smtp-host"
									name="smtpHost"
									type="text"
									placeholder="smtp.gmail.com"
									bind:value={smtpHost}
									required
								/>
								{#if smtpFromEnv.host}
									<span class="text-xs text-muted-foreground">(from ENV)</span>
								{/if}
							</div>
						</div>
						<div class="space-y-2">
							<Label for="smtp-port" class="text-sm font-medium">SMTP Port</Label>

							<div class="flex items-center gap-2">
								<Input
									id="smtp-port"
									name="smtpPort"
									type="number"
									placeholder="587"
									bind:value={smtpPort}
									required
								/>
								{#if smtpFromEnv.port}
									<span class="text-xs text-muted-foreground">(from ENV)</span>
								{/if}
							</div>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="smtp-username" class="text-sm font-medium">SMTP Username</Label>
						<div class="flex items-center gap-2">
							<Input
								id="smtp-username"
								name="smtpUsername"
								type="text"
								placeholder="your-email@gmail.com"
								bind:value={smtpUsername}
								required
							/>
							{#if smtpFromEnv.username}
								<span class="text-xs text-muted-foreground">(from ENV)</span>
							{/if}
						</div>
					</div>

					<div class="space-y-2">
						<Label for="smtp-password" class="text-sm font-medium">SMTP Password</Label>
						<div class="flex items-center gap-2">
							<Input
								id="smtp-password"
								name="smtpPassword"
								type="password"
								placeholder="Your SMTP password"
								bind:value={smtpPassword}
								required
							/>
							{#if smtpFromEnv.password}
								<span class="text-xs text-muted-foreground">(from ENV)</span>
							{/if}
						</div>
					</div>

					<div class="space-y-2">
						<Label for="smtp-from-email" class="text-sm font-medium">From Address</Label>
						<div class="flex items-center gap-2">
							<Input
								id="smtp-from-email"
								name="smtpFromEmail"
								type="text"
								placeholder="Sentio <noreply@yourdomain.com>"
								bind:value={smtpFromEmail}
								required
							/>
							{#if smtpFromEnv.fromEmail}
								<span class="text-xs text-muted-foreground">(from ENV)</span>
							{/if}
						</div>
						<p class="mt-1 text-xs text-muted-foreground">
							Optional display name is supported. Example: <code
								>Sentio &lt;noreply@yourdomain.com&gt;</code
							>
						</p>
					</div>
				</div>

				<div class="mt-6 flex justify-end">
					<div class="flex flex-col items-end gap-1">
						<Button type="submit">Save Email Settings</Button>
						{#if isFromEnv}
							<span class="text-xs text-muted-foreground"
								>On saving given values will be persisted and override ENV values</span
							>
						{/if}
					</div>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
