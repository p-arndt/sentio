<script lang="ts">
	import { invalidateAll } from '$app/navigation';
	import { api } from '$lib/client/api';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Switch } from '$lib/components/ui/switch';
	import type { MoodReminder } from '$lib/types';
	import { formatReminderDays, getNextReminderTrigger, utcToLocal, localToUTC } from '$lib/utils/timezone';
	import { Clock, Edit2, Plus, Trash2 } from '@lucide/svelte';
	import { toast } from 'svelte-sonner';

	let { reminders = [] }: { reminders: MoodReminder[] } = $props();

	let editingId = $state<string | null>(null);
	let dialogOpen = $state(false);
	let submitting = $state(false);

	let formData = $state({
		title: '',
		message: '',
		time: '09:00',
		daysOfWeek: '0,1,2,3,4,5,6'
	});

	let selectedDays = $state<number[]>([0, 1, 2, 3, 4, 5, 6]);

	function handleDayToggle(day: number) {
		if (selectedDays.includes(day)) {
			selectedDays = selectedDays.filter((d) => d !== day);
		} else {
			selectedDays = [...selectedDays, day].sort();
		}
		formData.daysOfWeek = selectedDays.join(',');
	}

	function openForm(reminder?: MoodReminder) {
		if (reminder) {
			editingId = reminder.id;
			formData = {
				title: reminder.title,
				message: reminder.message,
				time: utcToLocal(reminder.time),
				daysOfWeek: reminder.daysOfWeek
			};
			selectedDays = reminder.daysOfWeek.split(',').map(Number);
		} else {
			resetForm();
		}
		dialogOpen = true;
	}

	function resetForm() {
		editingId = null;
		formData = {
			title: '',
			message: '',
			time: '09:00',
			daysOfWeek: '0,1,2,3,4,5,6'
		};
		selectedDays = [0, 1, 2, 3, 4, 5, 6];
	}

	function closeDialog() {
		dialogOpen = false;
		setTimeout(() => {
			resetForm();
		}, 300);
	}

	function getNextTriggerTime(reminder: MoodReminder): string {
		const nextTrigger = getNextReminderTrigger(reminder);
		if (!nextTrigger) {
			return 'No upcoming triggers';
		}

		const dayName = nextTrigger.toLocaleDateString('en-US', { weekday: 'short' });
		const time = nextTrigger.toLocaleTimeString('en-US', {
			hour: '2-digit',
			minute: '2-digit'
		});

		return `${dayName} at ${time}`;
	}

	async function handleToggleActive(reminder: MoodReminder) {
		try {
			await api.reminders.update(reminder.id, { isActive: !reminder.isActive });
			await invalidateAll();
			toast.success(reminder.isActive ? 'Reminder disabled' : 'Reminder enabled');
		} catch (error) {
			toast.error('Failed to update reminder');
			console.error(error);
		}
	}

	async function handleDelete(id: string) {
		if (!confirm('Delete this reminder?')) return;

		try {
			await api.reminders.delete(id);
			await invalidateAll();
			toast.success('Reminder deleted');
		} catch (error) {
			toast.error('Failed to delete reminder');
			console.error(error);
		}
	}

	async function handleSubmit() {
		if (!formData.time) {
			toast.error('Please select a time');
			return;
		}

		if (selectedDays.length === 0) {
			toast.error('Please select at least one day');
			return;
		}

		// Title and message are optional. Provide a sensible default message if empty.
		const payload = {
			...formData,
			// Convert the user-entered local time to UTC before sending to the server
			time: localToUTC(formData.time),
			daysOfWeek: selectedDays.join(','),
			title: formData.title,
			message: formData.message
		};

		submitting = true;

		try {
			if (editingId) {
				await api.reminders.update(editingId, payload);
				toast.success('Reminder updated');
			} else {
				await api.reminders.create(payload);
				toast.success('Reminder created');
			}

			await invalidateAll();
			closeDialog();
		} catch (error) {
			toast.error(error instanceof Error ? error.message : 'Failed to save reminder');
			console.error(error);
		} finally {
			submitting = false;
		}
	}
</script>

<div class="space-y-6">
	<Card>
		<CardHeader>
			<div class="flex items-center justify-between">
				<div>
					<CardTitle>Mood Reminders</CardTitle>
					<CardDescription>
						Set up reminders to help you track your mood throughout the day
					</CardDescription>
				</div>
				<Button onclick={() => openForm()} class="gap-2">
					<Plus class="h-4 w-4" />
					New Reminder
				</Button>
			</div>
		</CardHeader>
		<CardContent>
			{#if reminders.length === 0}
				<div class="py-8 text-center text-sm text-muted-foreground">
					No reminders yet. Create one to get started!
				</div>
			{:else}
				<div class="space-y-3">
					{#each reminders as reminder (reminder.id)}
						<div class="flex items-center gap-4 rounded-lg border p-4">
							<button
								type="button"
								onclick={() => handleToggleActive(reminder)}
								class="cursor-pointer"
							>
								<Switch checked={reminder.isActive} class="mt-0" />
							</button>

							<div class="flex-1">
								<div class="flex items-center gap-2">
									<h3 class="font-semibold">{reminder.title}</h3>
									{#if !reminder.isActive}
										<Badge variant="secondary">Disabled</Badge>
									{/if}
								</div>

								<p class="text-sm text-muted-foreground">{reminder.message}</p>
								<div class="mt-2 flex flex-wrap gap-4 text-xs text-muted-foreground">
									<div class="flex items-center gap-1">
										<Clock class="h-3 w-3" />
										<span>{utcToLocal(reminder.time)}</span>
									</div>
									<span>{formatReminderDays(reminder.daysOfWeek)}</span>
									<span class="text-green-600">{getNextTriggerTime(reminder)}</span>
								</div>
							</div>

							<div class="flex gap-2">
								<Button
									variant="ghost"
									size="sm"
									onclick={() => openForm(reminder)}
									class="h-8 w-8 p-0"
								>
									<Edit2 class="h-4 w-4" />
								</Button>
								<Button
									variant="ghost"
									size="sm"
									onclick={() => handleDelete(reminder.id)}
									class="h-8 w-8 p-0 text-destructive hover:text-destructive"
								>
									<Trash2 class="h-4 w-4" />
								</Button>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</CardContent>
	</Card>
</div>

<Dialog bind:open={dialogOpen}>
	<DialogContent class="max-w-md">
		<DialogHeader>
			<DialogTitle>{editingId ? 'Edit Reminder' : 'Create New Reminder'}</DialogTitle>
			<DialogDescription>
				Set up a reminder to help you track your mood throughout the day
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4">
			<div class="space-y-2">
				<Label for="title">Title</Label>
				<Input
					id="title"
					name="title"
					bind:value={formData.title}
					placeholder="e.g., Morning Check-in"
				/>
			</div>

			<div class="space-y-2">
				<Label for="message">Message</Label>
				<Input
					id="message"
					name="message"
					bind:value={formData.message}
					placeholder="e.g., How are you feeling today?"
				/>
			</div>

			<div class="space-y-2">
				<Label for="time">Time *</Label>
				<Input id="time" name="time" type="time" bind:value={formData.time} required />
			</div>

			<div class="space-y-2">
				<Label>Days of Week *</Label>
				<div class="grid grid-cols-7 gap-2">
					{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as day, i}
						<div class="flex flex-col items-center">
							<label class="flex cursor-pointer items-center gap-2">
								<Checkbox checked={selectedDays.includes(i)} onchange={() => handleDayToggle(i)} />
							</label>
							<span class="mt-1 text-xs text-muted-foreground">{day}</span>
						</div>
					{/each}
				</div>
			</div>
		</div>

		<DialogFooter>
			<Button type="button" variant="outline" onclick={closeDialog}>Cancel</Button>
			<Button type="button" onclick={handleSubmit} disabled={submitting}>
				{#if submitting}
					Saving...
				{:else}
					{editingId ? 'Update' : 'Create'} Reminder
				{/if}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
