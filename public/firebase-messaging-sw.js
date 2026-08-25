// Firebase Cloud Messaging Background Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Firebase configuration placeholder for service worker
const firebaseConfig = {
  apiKey: "PLACEHOLDER_API_KEY",
  authDomain: "pulsenews.firebaseapp.com",
  projectId: "pulsenews",
  storageBucket: "pulsenews.appspot.com",
  messagingSenderId: "PLACEHOLDER_SENDER_ID",
  appId: "PLACEHOLDER_APP_ID"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage((payload) => {
    console.log('[FCM SW] Received background message: ', payload);
    const notificationTitle = payload.notification?.title || 'PulseNews Market Alert';
    const notificationOptions = {
      body: payload.notification?.body || 'New high-impact news or portfolio movement detected.',
      icon: payload.notification?.icon || '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: payload.data || { url: '/' },
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (e) {
  console.warn('[FCM SW] Firebase messaging initialization skipped or offline:', e);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
