importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js')
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js')

firebase.initializeApp({
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
})

const messaging = firebase.messaging()

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload)

  const { title, body, image } = payload.notification ?? {}

  self.registration.showNotification(title ?? '🚛 Truck Alert', {
    body: body ?? 'Truck melewati garis deteksi',
    image: image,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    data: payload.data,
    actions: [
      { action: 'view', title: 'Lihat Dashboard' }
    ],
  })
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  if (event.action === 'view') {
    clients.openWindow('http://localhost:5173')
  }
})
