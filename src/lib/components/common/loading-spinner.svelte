<script lang="ts">
	let {
		size = 32,
		color = 'text-primary',
		thickness = 'border-4',
		ariaLabel = 'Loading...'
	}: {
		size?: number;
		color?: string;
		thickness?: string;
		ariaLabel?: string;
	} = $props();
</script>

<span
	class="inline-block animate-spin rounded-full border-solid border-current border-t-transparent {thickness} {color}"
	style="width: {size}px; height: {size}px;"
	role="status"
	aria-label={ariaLabel}
></span>
