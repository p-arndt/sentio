<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogTrigger
	} from '$lib/components/ui/dialog';
	import { Textarea } from '$lib/components/ui/textarea';
	import { MessageCircle } from '@lucide/svelte';

	type Props = {
		comment?: string;
		onSave: (comment: string) => void;
	};

	let { comment = '', onSave } = $props();
	let localComment = $state(comment);
	let isOpen = $state(false);

	$effect(() => {
		localComment = comment || '';
	});

	function handleSave() {
		onSave(localComment);
		isOpen = false;
	}
</script>

<Dialog bind:open={isOpen}>
	<DialogTrigger>
		<div class="flex space-x-2">
			<MessageCircle class="mr-2 h-4 w-4" />
		<span>{comment ? 'Edit comment' : 'Add comment'}</span>
		</div>
	</DialogTrigger>
	<DialogContent class="sm:max-w-md">
		<DialogHeader>
			<DialogTitle>
				{comment ? 'Edit' : 'Add'} Comment
			</DialogTitle>
		</DialogHeader>
		<div class="space-y-4">
			<Textarea
				bind:value={localComment}
				placeholder="How are you feeling today? Any specific thoughts or experiences you'd like to share?"
				class="min-h-32 resize-none"
				autofocus
			/>
			<div class="flex justify-end gap-2">
				<Button variant="outline" onclick={() => (isOpen = false)}>Cancel</Button>
				<Button onclick={handleSave}>Save</Button>
			</div>
		</div>
	</DialogContent>
</Dialog>
