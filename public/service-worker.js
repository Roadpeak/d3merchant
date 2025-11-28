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

            // Handle different notification types with proper routing
            switch(data.type) {
                // Message notifications
                case 'new_message':
                case 'new_customer_message':
                case 'message':
                    // Use conversationId if available
                    if (data.conversationId || data.data?.conversationId) {
                        const convId = data.conversationId || data.data?.conversationId;
                        targetUrl = `/dashboard/chat?conversation=${convId}`;
                    } else {
                        targetUrl = '/dashboard/chat';
                    }
                    break;

                // New follower notification
                case 'new_follower':
                    targetUrl = '/dashboard/socials';
                    break;

                // Review notifications
                case 'new_review':
                    targetUrl = '/dashboard/reviews';
                    break;

                // Booking notifications (merchant side)
                case 'new_booking':
                    // Check if it's a service or offer booking
                    if (data.data?.bookingType === 'offer' || data.offerBookingId) {
                        targetUrl = '/dashboard/offer-bookings';
                    } else {
                        targetUrl = '/dashboard/service-bookings';
                    }
                    // If specific booking ID is provided, go to detail view
                    if (data.data?.bookingId || data.bookingId) {
                        const bookingId = data.data?.bookingId || data.bookingId;
                        targetUrl = `/dashboard/bookings/${bookingId}/view`;
                    }
                    break;

                case 'booking_rescheduled_merchant':
                case 'booking_rescheduled':
                    // Go to specific booking if ID provided
                    if (data.data?.bookingId || data.bookingId) {
                        const bookingId = data.data?.bookingId || data.bookingId;
                        targetUrl = `/dashboard/bookings/${bookingId}/view`;
                    } else if (data.data?.bookingType === 'offer' || data.offerBookingId) {
                        targetUrl = '/dashboard/offer-bookings';
                    } else {
                        targetUrl = '/dashboard/service-bookings';
                    }
                    break;

                case 'booking_cancelled_merchant':
                case 'booking_cancelled':
                    // Go to specific booking if ID provided
                    if (data.data?.bookingId || data.bookingId) {
                        const bookingId = data.data?.bookingId || data.bookingId;
                        targetUrl = `/dashboard/bookings/${bookingId}/view`;
                    } else if (data.data?.bookingType === 'offer' || data.offerBookingId) {
                        targetUrl = '/dashboard/offer-bookings';
                    } else {
                        targetUrl = '/dashboard/service-bookings';
                    }
                    break;

                // Booking confirmations
                case 'booking_confirmed':
                case 'booking_confirmation':
                    if (data.data?.bookingId || data.bookingId) {
                        const bookingId = data.data?.bookingId || data.bookingId;
                        targetUrl = `/dashboard/bookings/${bookingId}/view`;
                    } else {
                        targetUrl = '/dashboard/service-bookings';
                    }
                    break;

                // Service request notifications
                case 'service_request_offer':
                case 'new_service_request':
                    targetUrl = '/dashboard/serviceRequests';
                    break;

                // Default: use provided URL or fallback
                default:
                    // Fix any URLs that point to /chat instead of /dashboard/chat
                    if (targetUrl.startsWith('/chat') && !targetUrl.startsWith('/dashboard/chat')) {
                        targetUrl = `/dashboard${targetUrl}`;
                    }
                    // Fix any URLs that point to /bookings instead of /dashboard/bookings
                    else if (targetUrl.startsWith('/bookings') && !targetUrl.startsWith('/dashboard/bookings')) {
                        targetUrl = `/dashboard${targetUrl}`;
                    }
                    // Fix any URLs that point to /reviews instead of /dashboard/reviews
                    else if (targetUrl.startsWith('/reviews') && !targetUrl.startsWith('/dashboard/reviews')) {
                        targetUrl = `/dashboard${targetUrl}`;
                    }
                    break;
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

            console.log('🔗 Notification type:', data.type);
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
    console.log('👆 Merchant notification clicked');
    console.log('📋 Action:', event.action);
    console.log('📋 Notification data:', event.notification.data);

    event.notification.close();

    // If user clicked dismiss, just close
    if (event.action === 'dismiss') {
        console.log('🔕 User dismissed notification');
        return;
    }

    const notificationData = event.notification.data || {};
    let urlToOpen = '/dashboard';

    // Handle specific actions
    if (event.action === 'view') {
        // Use the URL from notification data
        urlToOpen = notificationData.url || '/dashboard';
    } else if (event.action === 'reply') {
        // For review replies
        urlToOpen = '/dashboard/reviews';
    } else if (event.action === 'confirm') {
        // For booking confirmations
        if (notificationData.bookingId) {
            urlToOpen = `/dashboard/bookings/${notificationData.bookingId}/view`;
        } else {
            urlToOpen = '/dashboard/service-bookings';
        }
    } else if (event.action === 'view_followers') {
        urlToOpen = '/dashboard/socials';
    } else {
        // No specific action clicked, use notification data to determine URL
        urlToOpen = notificationData.url || '/dashboard';
    }

    // Convert to absolute URL
    const absoluteUrl = new URL(urlToOpen, self.location.origin).href;

    console.log('🔗 Opening URL:', absoluteUrl);
    console.log('🔗 Notification type:', notificationData.type);

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
                            console.log('🔄 Navigating to:', absoluteUrl);
                            return client.navigate(absoluteUrl);
                        }
                        return client;
                    });
                }
            }
            // Open new window if not already open
            if (self.clients.openWindow) {
                console.log('✅ Opening new merchant dashboard window at:', absoluteUrl);
                return self.clients.openWindow(absoluteUrl);
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