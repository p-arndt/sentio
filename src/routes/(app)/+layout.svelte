<script lang="ts">
	import DarkModeToggle from '$lib/components/common/dark-mode-toggle.svelte';
	import AppSidebar from '$lib/components/app-sidebar.svelte';
	import { Separator } from '$lib/components/ui/separator/index.js';
	import * as Sidebar from '$lib/components/ui/sidebar/index.js';
	import Version from '$lib/components/Version.svelte';
	import '../../app.css';
	import type { LayoutData } from './$types';

	type Props = {
		data: LayoutData;
		children: any;
	};

	let { data, children }: Props = $props();
</script>

<Sidebar.Provider>
	<AppSidebar {data} />
	<Sidebar.Inset>
		<header
			class="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
		>
			<div class="flex items-center gap-2 px-4">
				<Sidebar.Trigger class="-ml-1" />
				<Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
				<div class="flex flex-1 items-center justify-end">
					<DarkModeToggle />
				</div>
			</div>
		</header>

		<div class="flex flex-1 flex-col">
			<main class="flex-1 overflow-y-auto">
				{@render children()}
			</main>

			<footer class="border-t bg-card px-6 py-2">
				<div
					class="container mx-auto flex items-center justify-between text-sm text-muted-foreground"
				>
					<p>© 2025 Sentio. Track your team's well-being with care.</p>
					<Version version={data.version} />
				</div>
			</footer>
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
