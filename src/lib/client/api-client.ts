import { getApiBaseUrl } from './config';

/**
 * Wrapper for fetch that automatically prepends the backend URL in Tauri
 */
export async function apiFetch(
	input: RequestInfo | URL,
	init?: RequestInit
): Promise<Response> {
	const baseUrl = await getApiBaseUrl();
	
	// If input is a string and starts with /, prepend baseUrl
	if (typeof input === 'string' && input.startsWith('/')) {
		const url = baseUrl ? `${baseUrl}${input}` : input;
		return fetch(url, init);
	}
	
	// Otherwise, use as-is
	return fetch(input, init);
}

