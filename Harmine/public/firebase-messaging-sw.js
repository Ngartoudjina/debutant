// firebase-messaging-sw.js
// Les valeurs Firebase sont injectées au build via vite.config.ts (plugin generate-firebase-sw).
// En développement, les notifications push ne fonctionnent pas (comportement normal).

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: self.__FIREBASE_API_KEY__ || '',
  authDomain: self.__FIREBASE_AUTH_DOMAIN__ || '',
  projectId: self.__FIREBASE_PROJECT_ID__ || '',
  storageBucket: self.__FIREBASE_STORAGE_BUCKET__ || '',
  messagingSenderId: self.__FIREBASE_MESSAGING_SENDER_ID__ || '',
  appId: self.__FIREBASE_APP_ID__ || '',
};

if (firebaseConfig.apiKey) {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  messaging.onBackgroundMessage(function(payload) {
    const notificationTitle = payload.notification?.title || 'Nouvelle notification';
    const notificationOptions = {
      body: payload.notification?.body || 'Vous avez reçu une nouvelle notification',
      icon: '/logo-dynamism1.png',
      badge: '/logo-dynamism1.png',
      tag: 'notification-tag',
      data: payload.data,
      actions: [
        { action: 'open', title: 'Ouvrir' },
        { action: 'close', title: 'Fermer' },
      ],
    };
    return self.registration.showNotification(notificationTitle, notificationOptions);
  });
}

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) return clients.openWindow('/');
      })
    );
  }
});
