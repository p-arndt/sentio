import { invoke } from '@tauri-apps/api/core';
import { emit } from '@tauri-apps/api/event';

export interface NotificationOptions {
	title: string;
	message: string;
	avatar?: string;
	autoHide?: boolean;
	duration?: number;
	showMoods?: boolean; // Show quick mood selection buttons
}

/**
 * Show a Teams-style custom popup notification
 */
export async function showNotificationPopup(options: NotificationOptions): Promise<void> {
	try {
		// Calculate dimensions based on whether moods are shown
		const width = 380;
		const height = options.showMoods ? 240 : 120;

		// Emit event with notification data
		await emit('show-notification', {
			title: options.title,
			message: options.message,
			avatar: options.avatar,
			autoHide: options.autoHide ?? true,
			showMoods: options.showMoods ?? false
		});

		// Small delay to ensure event is processed
		await new Promise((resolve) => setTimeout(resolve, 100));

		// Position and resize the window
		await invoke('position_notification', {
			width,
			height
		});

		// Show the window
		await invoke('show_notification');
	} catch (error) {
		console.error('Failed to show notification popup:', error);
		throw error;
	}
}

/**
 * Hide the notification popup
 */
export async function hideNotificationPopup(): Promise<void> {
	try {
		await invoke('hide_notification');
	} catch (error) {
		console.error('Failed to hide notification popup:', error);
		throw error;
	}
}

/**
 * Position the notification window at bottom-right
 */
export async function positionNotificationPopup(): Promise<void> {
	try {
		await invoke('position_notification');
	} catch (error) {
		console.error('Failed to position notification popup:', error);
		throw error;
	}
}

