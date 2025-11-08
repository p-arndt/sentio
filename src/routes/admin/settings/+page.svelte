<script lang="ts">
	import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Switch } from '$lib/components/ui/switch';
	import { Label } from '$lib/components/ui/label';
	import { Button } from '$lib/components/ui/button';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	type Props = {
		data: PageData;
	};
	let { data }: Props = $props();

	let showWeekends = $state(data.settings.showWeekends);
</script>

<div class="space-y-6">
	<div>
		<h3 class="text-lg font-medium">Calendar Settings</h3>
		<p class="text-muted-foreground text-sm">Configure how the calendar displays</p>
	</div>

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

				<div class="mt-6 flex justify-end">
					<Button type="submit">Save Changes</Button>
				</div>
			</form>
		</CardContent>
	</Card>
</div>
