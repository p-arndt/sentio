import adapterNode from '@sveltejs/adapter-node';
import adapterStatic from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// Use static adapter for Tauri builds, node adapter for regular builds
const isTauri = process.env.TAURI_PLATFORM !== undefined;

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: isTauri
			? adapterStatic({
					pages: 'build/client',
					assets: 'build/client',
					fallback: 'index.html',
					precompress: false,
					strict: true
				})
			: adapterNode()
	}
};

export default config;
