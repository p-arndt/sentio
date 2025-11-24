import { getCurrentWindow } from '@tauri-apps/api/window';

/**
 * Minimize the app to system tray (hides the window)
 */
export async function minimizeToTray(): Promise<void> {
	try {
		const window = getCurrentWindow();
		await window.hide();
	} catch (error) {
		console.error('Failed to minimize to tray:', error);
		throw error;
	}
}

/**
 * Show the main window from tray
 */
export async function showFromTray(): Promise<void> {
	try {
		const window = getCurrentWindow();
		await window.show();
		await window.setFocus();
	} catch (error) {
		console.error('Failed to show from tray:', error);
		throw error;
	}
}

