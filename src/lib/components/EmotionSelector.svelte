<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { cn } from '$lib/utils';
	import type { EmotionWithIcon } from '$lib/data/emotions';

	type Props = {
		emotions: EmotionWithIcon[];
		selectedEmotion?: EmotionWithIcon;
		onSelect: (emotion: EmotionWithIcon) => void;
		size?: 'sm' | 'md' | 'lg';
		className?: string;
		showLabels?: boolean;
	};

	let { 
		emotions, 
		selectedEmotion, 
		onSelect, 
		size = 'md', 
		className,
		showLabels = false 
	} = $props();

	const sizeClasses: Record<typeof size, string> = {
		sm: 'w-8 h-8 md:w-9 md:h-9',
		md: 'w-10 h-10 md:w-11 md:h-11',
		lg: 'w-12 h-12 md:w-14 md:h-14'
	};

	const iconSizes: Record<typeof size, number> = {
		sm: 16,
		md: 20,
		lg: 24
	};
</script>

<div class={cn('flex gap-2 md:gap-3 flex-wrap', className)}>
	{#each emotions as emotion}
		<div class="flex flex-col items-center gap-1 md:gap-1.5">
			<Button
				variant={selectedEmotion?.id === emotion.id ? 'default' : 'outline'}
				size="icon"
				class={cn(
					sizeClasses[size],
					'hover:scale-110 transition-all duration-200 relative border-2',
					selectedEmotion?.id === emotion.id && 'ring-2 ring-ring ring-offset-2 shadow-lg border-primary bg-primary hover:bg-primary/90'
				)}
				style={selectedEmotion?.id !== emotion.id 
					? `border-color: ${emotion.color}30;` 
					: ''}
				onclick={() => onSelect(emotion)}
				title={emotion.name}
			>
				{@const Icon = emotion.icon}
				<Icon 
					size={iconSizes[size]}
					class={selectedEmotion?.id === emotion.id ? 'text-primary-foreground' : ''}
					style={selectedEmotion?.id !== emotion.id ? `color: ${emotion.color}` : ''}
				/>
			</Button>
			{#if showLabels}
				<span class="text-[10px] md:text-xs text-muted-foreground font-medium leading-tight">{emotion.name}</span>
			{/if}
		</div>
	{/each}
</div>