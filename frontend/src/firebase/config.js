import { initializeApp } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY

const app = initializeApp(firebaseConfig)
const messaging = getMessaging(app)

async function subscribeToTruckAlerts(token) {
  try {
    await fetch('/api/fcm/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, topic: 'truck-alerts' }),
    })
    console.log('✅ Subscribed to truck-alerts')
  } catch (e) {
    console.error('Subscribe error:', e)
  }
}

export async function initFCM(onNotification) {
  try {
    // Minta permission notifikasi dari user
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.warn('⚠️ Notification permission denied')
      return null
    }

    // Dapatkan FCM token
    const token = await getToken(messaging, { vapidKey: VAPID_KEY })
    console.log('📱 FCM Token:', token)

    // Subscribe ke topic
    await subscribeToTruckAlerts(token)

    // Listen notifikasi saat app di foreground
    onMessage(messaging, (payload) => {
      console.log('🔔 FCM message received:', payload)
      onNotification({
        title: payload.notification?.title,
        body: payload.notification?.body,
        image: payload.data?.image_url,
        confidence: payload.data?.confidence,
        direction: payload.data?.direction,
        timestamp: payload.data?.timestamp,
      })
    })

    return token
  } catch (e) {
    console.error('FCM init error:', e)
    return null
  }
}
