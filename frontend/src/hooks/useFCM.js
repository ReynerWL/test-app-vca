import { useEffect } from 'react'

const FIREBASE_CONFIG = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

export function useFCM() {
  useEffect(() => {
    initFCM()
  }, [])
}

async function initFCM() {
  if (FIREBASE_CONFIG.apiKey === "YOUR_API_KEY") {
    console.warn('[FCM] Firebase config not set. Skipping FCM setup.')
    return
  }

  try {
    const { initializeApp }    = await import('firebase/app')
    const { getMessaging, getToken, onMessage } = await import('firebase/messaging')

    const app       = initializeApp(FIREBASE_CONFIG)
    const messaging = getMessaging(app)

    // Minta permission notifikasi dari browser
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('[FCM] Notification permission denied')
      return
    }

    // Dapatkan FCM token
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: await navigator.serviceWorker.register(
        '/firebase-messaging-sw.js'
      ),
    })

    if (token) {
      console.log('[FCM] Token obtained:', token.slice(0, 20) + '...')
      // Register token ke backend
      await fetch('/api/fcm/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })
    }

    // Handle foreground messages (app sedang dibuka)
    onMessage(messaging, (payload) => {
      console.log('[FCM] Foreground message:', payload)
      // Tampilkan notifikasi manual karena service worker tidak handle foreground
      if (payload.notification) {
        new Notification(payload.notification.title, {
          body:  payload.notification.body,
          image: payload.notification.image,
          icon:  '/favicon.ico',
        })
      }
    })

  } catch (err) {
    console.error('[FCM] Setup failed:', err)
  }
}
