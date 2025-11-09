<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
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
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Calendar Settings</h3>
		<p class="text-muted-foreground text-sm">Configure how the calendar displays</p>
	</div>

	{#if form?.success}
		<div class="rounded-lg border border-green-500 bg-green-50 p-4 text-green-900 dark:bg-green-950 dark:text-green-100">
			Settings saved successfully!
		</div>
	{/if}

	{#if form?.error}
		<div class="rounded-lg border border-red-500 bg-red-50 p-4 text-red-900 dark:bg-red-950 dark:text-red-100">
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
						<p class="text-muted-foreground text-sm">
							Display Saturday and Sunday in the calendar
						</p>
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
							<Input
								id="smtp-host"
								name="smtpHost"
								type="text"
								placeholder="smtp.gmail.com"
								bind:value={smtpHost}
								required
							/>
						</div>
						<div class="space-y-2">
							<Label for="smtp-port" class="text-sm font-medium">SMTP Port</Label>
							<Input
								id="smtp-port"
								name="smtpPort"
								type="number"
								placeholder="587"
								bind:value={smtpPort}
								required
							/>
						</div>
					</div>

					<div class="space-y-2">
						<Label for="smtp-username" class="text-sm font-medium">SMTP Username</Label>
						<Input
							id="smtp-username"
							name="smtpUsername"
							type="text"
							placeholder="your-email@gmail.com"
							bind:value={smtpUsername}
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="smtp-password" class="text-sm font-medium">SMTP Password</Label>
						<Input
							id="smtp-password"
							name="smtpPassword"
							type="password"
							placeholder="Your SMTP password"
							bind:value={smtpPassword}
							required
						/>
					</div>

					<div class="space-y-2">
						<Label for="smtp-from-email" class="text-sm font-medium">From Email Address</Label>
						<Input
							id="smtp-from-email"
							name="smtpFromEmail"
							type="email"
							placeholder="noreply@yourdomain.com"
							bind:value={smtpFromEmail}
							required
						/>
					</div>
				</div>

				<div class="mt-6 flex justify-end">
					<Button type="submit">Save Email Settings</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
