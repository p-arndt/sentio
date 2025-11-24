import { invoke } from '@tauri-apps/api/core';

/**
 * Check if we're running in Tauri
 */
function isTauri(): boolean {
	return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

/**
 * Get the configured backend URL from Tauri config
 */
export async function getBackendUrl(): Promise<string | null> {
	if (!isTauri()) {
		return null;
	}

	try {
		const url = await invoke<string | null>('get_backend_url');
		return url;
	} catch (error) {
		console.error('Failed to get backend URL:', error);
		return null;
	}
}

/**
 * Set the backend URL in Tauri config
 */
export async function setBackendUrl(url: string): Promise<void> {
	if (!isTauri()) {
		throw new Error('setBackendUrl is only available in Tauri');
	}

	try {
		await invoke('set_backend_url', { url });
	} catch (error) {
		console.error('Failed to set backend URL:', error);
		throw error;
	}
}

/**
 * Get the base URL for API calls
 * Returns the configured backend URL if available, otherwise falls back to relative paths
 */
export async function getApiBaseUrl(): Promise<string> {
	// Check if we're in Tauri
	if (isTauri()) {
		const backendUrl = await getBackendUrl();
		if (backendUrl) {
			// Ensure URL doesn't end with a slash
			return backendUrl.replace(/\/$/, '');
		}
	}
	// For web/SvelteKit, use relative paths
	return '';
}

/**
 * Check if backend URL is configured
 */
export async function isBackendConfigured(): Promise<boolean> {
	if (isTauri()) {
		const url = await getBackendUrl();
		return url !== null && url.trim() !== '';
	}
	// For web, assume it's configured (using relative paths)
	return true;
}

