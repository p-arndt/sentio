/**
 * Service Worker and Push Notification utilities
 * Handles service worker registration, notification permissions, and push subscriptions
 */

export interface NotificationOptions {
	title: string;
	body: string;
	icon?: string;
	badge?: string;
	tag?: string;
}

/**
 * Check if the browser supports notifications and service workers
 */
export function supportsNotifications(): boolean {
	return (
		typeof window !== 'undefined' &&
		'serviceWorker' in navigator &&
		'Notification' in window &&
		'PushManager' in window
	);
}

/**
 * Request notification permission from user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
	if (!supportsNotifications()) {
		throw new Error('Notifications not supported in this browser');
	}

	if (Notification.permission === 'granted') {
		return 'granted';
	}

	if (Notification.permission !== 'denied') {
		const permission = await Notification.requestPermission();
		return permission;
	}

	return Notification.permission;
}

/**
 * Register the service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration> {
	if (!('serviceWorker' in navigator)) {
		throw new Error('Service Workers not supported in this browser');
	}

	try {
		const registration = await navigator.serviceWorker.register('/sw.js');
		return registration;
	} catch (error) {
		console.error('[App] Service Worker registration failed:', error);
		throw error;
	}
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPushNotifications(
	vapidPublicKey: string
): Promise<PushSubscription> {
	if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
		throw new Error('Push notifications not supported');
	}

	try {
		// Get the service worker registration
		const registration = await navigator.serviceWorker.ready;

		// Convert VAPID key from base64
		const subscriptionOptions: PushSubscriptionOptionsInit = {
			userVisibleOnly: true,
			applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource
		};

		// Subscribe to push notifications
		const subscription = await registration.pushManager.subscribe(subscriptionOptions);

		console.log('[App] Push subscription created:', subscription);

		// Send subscription to backend
		await sendSubscriptionToBackend(subscription);

		return subscription;
	} catch (error) {
		console.error('[App] Push subscription failed:', error);
		throw error;
	}
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPushNotifications(): Promise<boolean> {
	if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
		throw new Error('Push notifications not supported');
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		const subscription = await registration.pushManager.getSubscription();

		if (subscription) {
			// Notify backend of unsubscription
			await fetch('/api/push/subscribe', {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ endpoint: subscription.endpoint })
			});

			// Unsubscribe from push manager
			await subscription.unsubscribe();
			return true;
		}

		return false;
	} catch (error) {
		console.error('[App] Unsubscribe failed:', error);
		throw error;
	}
}

/**
 * Get current push subscription
 */
export async function getPushSubscription(): Promise<PushSubscription | null> {
	if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
		return null;
	}

	try {
		const registration = await navigator.serviceWorker.ready;
		return await registration.pushManager.getSubscription();
	} catch (error) {
		console.error('[App] Failed to get push subscription:', error);
		return null;
	}
}

/**
 * Send subscription to backend
 */
export async function sendSubscriptionToBackend(subscription: PushSubscription): Promise<Response> {
	const response = await fetch('/api/push/subscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(subscription.toJSON())
	});

	if (!response.ok) {
		throw new Error(`Failed to send subscription to backend: ${response.statusText}`);
	}

	return response;
}

/**
 * Initialize notifications and service worker
 * Call this on app initialization
 */
export async function initializeNotifications(): Promise<{
	hasPermission: boolean;
	isSubscribed: boolean;
	registration?: ServiceWorkerRegistration;
	subscription?: PushSubscription | null;
}> {
	const result: {
		hasPermission: boolean;
		isSubscribed: boolean;
		registration?: ServiceWorkerRegistration;
		subscription?: PushSubscription | null;
	} = {
		hasPermission: false,
		isSubscribed: false
	};

	if (!supportsNotifications()) {
		console.warn('[App] Notifications not supported');
		return result;
	}

	try {
		// Check permission
		result.hasPermission = Notification.permission === 'granted';

		// Register service worker
		try {
			result.registration = await registerServiceWorker();
		} catch (error) {
			console.warn('[App] Service Worker registration failed:', error);
		}

		// Check if subscribed
		const subscription = await getPushSubscription();
		result.isSubscribed = !!subscription;
		result.subscription = subscription;
	} catch (error) {
		console.error('[App] Notification initialization failed:', error);
	}

	return result;
}

/**
 * Convert VAPID public key from base64 to Uint8Array
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);

	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}

	return outputArray as unknown as Uint8Array;
}

/**
 * Show a local notification (for testing)
 */
export async function showLocalNotification(
	title: string,
	options: NotificationOptions
): Promise<void> {
	if (!supportsNotifications()) {
		throw new Error('Notifications not supported');
	}

	if (Notification.permission !== 'granted') {
		throw new Error('Notification permission not granted');
	}

	const registration = await navigator.serviceWorker.ready;
	await registration.showNotification(title, {
		body: options.body,
		icon: options.icon || '/favicon.png',
		// badge: options.badge || '/badge-72.png',
		tag: options.tag || 'notification'
	});
}
