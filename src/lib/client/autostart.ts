import { enable, disable, isEnabled } from '@tauri-apps/plugin-autostart';

/**
 * Enable autostart for the application
 */
export async function enableAutostart(): Promise<void> {
	try {
		await enable();
	} catch (error) {
		console.error('Failed to enable autostart:', error);
		throw error;
	}
}

/**
 * Disable autostart for the application
 */
export async function disableAutostart(): Promise<void> {
	try {
		await disable();
	} catch (error) {
		console.error('Failed to disable autostart:', error);
		throw error;
	}
}

/**
 * Check if autostart is enabled
 */
export async function checkAutostartEnabled(): Promise<boolean> {
	try {
		return await isEnabled();
	} catch (error) {
		console.error('Failed to check autostart status:', error);
		return false;
	}
}

