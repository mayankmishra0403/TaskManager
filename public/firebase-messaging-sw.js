// Appwrite + Firebase messaging service worker
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Firebase configuration for FCM token generation
const firebaseConfig = {
  apiKey: "AIzaSyBo7zGhLWr9VgDCNdsvKzNdQ0OsOpL5DpA",
  authDomain: "taskm-1b403.firebaseapp.com",
  projectId: "taskm-1b403", 
  storageBucket: "taskm-1b403.firebasestorage.app",
  messagingSenderId: "76433987959",
  appId: "1:76433987959:web:e88ea1597aafff9baca972"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background messages from Appwrite via FCM
messaging.onBackgroundMessage(function(payload) {
  console.log('[SW] Received background message from Appwrite:', payload);
  
  // Appwrite sends data in different formats, handle both
  const title = payload.data?.title || payload.notification?.title || 'Task Manager';
  const body = payload.data?.body || payload.notification?.body || 'You have a new notification';
  const icon = payload.data?.icon || payload.notification?.icon || '/icon-192x192.png';
  
  const notificationOptions = {
    body: body,
    icon: icon,
    badge: '/icon-192x192.png',
    tag: payload.data?.tag || 'appwrite-notification',
    requireInteraction: true,
    data: {
      ...payload.data,
      url: payload.data?.url || '/',
      type: payload.data?.type || 'general'
    },
    actions: [
      {
        action: 'open',
        title: 'Open App'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ]
  };

  // Notify any open windows to refresh their notification list
  clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
    clientList.forEach(function(client) {
      client.postMessage({
        type: 'NOTIFICATION_RECEIVED',
        action: 'background',
        data: payload.data
      });
    });
  });

  self.registration.showNotification(title, notificationOptions);
});

// Handle direct push events (when Appwrite sends direct push)
self.addEventListener('push', function(event) {
  if (!event.data) {
    return;
  }

  try {
    const payload = event.data.json();
    console.log('[SW] Direct push received:', payload);
    
    const title = payload.title || 'Task Manager';
    const options = {
      body: payload.body || 'You have a new notification',
      icon: payload.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: payload.tag || 'appwrite-push',
      requireInteraction: true,
      data: payload.data || {}
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[SW] Error handling push:', error);
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', function(event) {
  console.log('[SW] Notification click received.');
  
  const notification = event.notification;
  const action = event.action;
  const data = notification.data || {};

  notification.close();

  if (action === 'dismiss') {
    return;
  }

  // Determine target URL based on notification type
  let targetUrl = data.url || '/';
  
  if (data.type === 'task_assigned') {
    targetUrl = '/my-tasks';
  } else if (data.type === 'task_completed') {
    targetUrl = '/admin/tasks';
  } else if (data.type === 'task_update') {
    targetUrl = '/my-tasks';
  } else if (data.type === 'admin_message') {
    targetUrl = '/';
  } else if (data.type === 'announcement') {
    targetUrl = '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      // Try to focus existing window and refresh notifications
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_RECEIVED',
            action: 'click',
            data: data,
            targetUrl: targetUrl
          });
          return client.focus();
        }
      }
      
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});


