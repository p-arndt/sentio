/**
 * Service Worker for handling push notifications
 * This worker runs in the background and can receive push notifications
 * even when the app is closed or inactive
 */

// Install event
addEventListener('install', () => {
	self.skipWaiting();
});

// Activate event
addEventListener('activate', (event) => {
	event.waitUntil(self.clients.claim());
});

// Push event - receive push notifications
addEventListener('push', (event) => {
	let data = {
		title: 'Mood Reminder',
		body: 'Time to log your mood!'
	};

	try {
		if (event.data) {
			data = event.data.json();
		}
	} catch (error) {
		console.error('[Service Worker] Error parsing push data:', error);
		if (event.data) {
			data.body = event.data.text();
		}
	}

	const notificationData = {
		url: data.data?.url || '/'
	};

	if (data.data) {
		Object.assign(notificationData, data.data);
	}

	const options = {
		body: data.body,
		icon: data.icon || '/favicon.png',
		// badge: data.badge || '/badge-72.png',
		tag: data.tag || 'mood-reminder',
		requireInteraction: false,
		data: notificationData
	};

	event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click event
addEventListener('notificationclick', (event) => {
	event.notification.close();

	const notificationData = event.notification.data || {};
	const urlToOpen = notificationData.url || '/';

	event.waitUntil(
		(async () => {
			const windowClients = await self.clients.matchAll({
				type: 'window',
				includeUncontrolled: true
			});

			for (let i = 0; i < windowClients.length; i++) {
				const client = windowClients[i];
				if (client.url === urlToOpen && 'focus' in client) {
					return client.focus();
				}
			}

			if (self.clients.openWindow) {
				return self.clients.openWindow(urlToOpen);
			}
		})()
	);
});

// Notification close event
addEventListener('notificationclose', () => {
});

