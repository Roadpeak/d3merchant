// public/service-worker.js
console.log('🔧 Merchant Dashboard Service Worker loaded');

const CACHE_VERSION = 'v1';
const CACHE_NAME = `merchant-dashboard-cache-${CACHE_VERSION}`;

// Install event - activate immediately
self.addEventListener('install', (event) => {
    console.log('✅ Merchant Service Worker installing...');
    self.skipWaiting();
});

// Activate event - take control immediately and clean old caches
self.addEventListener('activate', (event) => {
    console.log('✅ Merchant Service Worker activating...');

    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(cacheName => cacheName !== CACHE_NAME)
                    .map(cacheName => caches.delete(cacheName))
            );
        }).then(() => self.clients.claim())
    );
});

// Listen for push notifications from backend
self.addEventListener('push', (event) => {
    console.log('📬 Merchant push notification received');

    let notificationData = {
        title: 'Merchant Dashboard',
        body: 'You have a new notification',
        icon: '/logo192.png',
        badge: '/logo192.png',
        tag: 'merchant-notification',
        url: '/dashboard'
    };

    // Parse notification data from backend
    if (event.data) {
        try {
            const data = event.data.json();
            console.log('📦 Push data:', data);

            // Determine the correct URL based on notification type
            let targetUrl = data.url || data.actionUrl || '/dashboard';

            // Handle chat/message notifications specially
            if (data.type === 'new_message' || data.type === 'new_customer_message') {
                // Use conversationId if available
                if (data.conversationId || data.data?.conversationId) {
                    const convId = data.conversationId || data.data?.conversationId;
                    targetUrl = `/dashboard/chat?conversation=${convId}`;
                } else {
                    // Default to chat page without specific conversation
                    targetUrl = '/dashboard/chat';
                }
            }
            // Fix any URLs that point to /chat instead of /dashboard/chat
            else if (targetUrl.startsWith('/chat') && !targetUrl.startsWith('/dashboard/chat')) {
                targetUrl = `/dashboard${targetUrl}`;
            }

            notificationData = {
                title: data.title || 'New Notification',
                body: data.body || data.message || 'You have a new notification',
                icon: data.icon || '/logo192.png',
                badge: data.badge || '/logo192.png',
                tag: data.tag || 'merchant-notification',
                url: targetUrl,
                data: data,
                image: data.image,
                requireInteraction: data.requireInteraction || false
            };

            console.log('🔗 Notification will open URL:', targetUrl);
        } catch (error) {
            console.error('❌ Error parsing push data:', error);
        }
    }

    const options = {
        body: notificationData.body,
        icon: notificationData.icon,
        badge: notificationData.badge,
        tag: notificationData.tag,
        image: notificationData.image,
        requireInteraction: notificationData.requireInteraction,
        vibrate: [200, 100, 200],
        data: notificationData,
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/icons/view.png'
            },
            {
                action: 'dismiss',
                title: 'Dismiss',
                icon: '/icons/dismiss.png'
            }
        ]
    };

    event.waitUntil(
        self.registration.showNotification(notificationData.title, options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Merchant notification clicked, action:', event.action);

    event.notification.close();

    // If user clicked dismiss, just close
    if (event.action === 'dismiss') {
        return;
    }

    // Get the URL to open
    const urlToOpen = new URL(
        event.notification.data?.url || '/dashboard',
        self.location.origin
    ).href;

    console.log('🔗 Opening URL:', urlToOpen);

    // Open or focus the app
    event.waitUntil(
        self.clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((clientList) => {
            // Check if dashboard is already open
            for (const client of clientList) {
                if (client.url.startsWith(self.location.origin) && 'focus' in client) {
                    console.log('✅ Focusing existing merchant dashboard window');
                    return client.focus().then(client => {
                        // Try to navigate to the notification URL
                        if ('navigate' in client) {
                            return client.navigate(urlToOpen);
                        }
                        return client;
                    });
                }
            }
            // Open new window if not already open
            if (self.clients.openWindow) {
                console.log('✅ Opening new merchant dashboard window');
                return self.clients.openWindow(urlToOpen);
            }
        })
    );
});

// Optional: Track notification closes for analytics
self.addEventListener('notificationclose', (event) => {
    console.log('🔕 Merchant notification closed');
});

// Handle messages from the client
self.addEventListener('message', (event) => {
    console.log('📨 Message received from merchant client:', event.data);

    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

console.log('✅ Merchant Service Worker script executed successfully');