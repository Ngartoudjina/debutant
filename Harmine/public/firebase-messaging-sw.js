// firebase-messaging-sw.js
// À placer dans le dossier public/

importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Configuration Firebase - remplacez par vos vraies valeurs
const firebaseConfig = {
  apiKey: "AIzaSyBO0cE8oaxDFAEpaFeBF4uP04szSgD2C_4",
  authDomain: "coursier-8f010.firebaseapp.com",
  projectId: "coursier-8f010",
  storageBucket: "coursier-8f010.firebasestorage.app",
  messagingSenderId: "645129690508",
  appId: "1:645129690508:web:71f8f8c49c06bcda940aa9"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);

// Récupérer une instance du service de messaging
const messaging = firebase.messaging();

// Gérer les messages en arrière-plan
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan:', payload);

  const notificationTitle = payload.notification?.title || 'Nouvelle notification';
  const notificationOptions = {
    body: payload.notification?.body || 'Vous avez reçu une nouvelle notification',
    icon: '/logo-dynamism1.png', // Ajoutez votre icône
    badge: '/logo-dynamism1.png',   // Icône de badge
    tag: 'notification-tag',
    data: payload.data,
    actions: [
      {
        action: 'open',
        title: 'Ouvrir'
      },
      {
        action: 'close',
        title: 'Fermer'
      }
    ]
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gérer les clics sur les notifications
self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Clic sur notification:', event);
  
  event.notification.close();

  if (event.action === 'open') {
    // Ouvrir ou focus sur l'application
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true })
        .then(function(clientList) {
          // Si l'app est déjà ouverte, la focuser
          for (let client of clientList) {
            if (client.url.includes(self.location.origin) && 'focus' in client) {
              return client.focus();
            }
          }
          // Sinon ouvrir une nouvelle fenêtre
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
  // Pour l'action 'close', on ne fait rien (notification déjà fermée)
});