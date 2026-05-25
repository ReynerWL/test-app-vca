import os
from datetime import datetime
from config import FCM_ENABLED, FIREBASE_CREDENTIALS_PATH, CAPTURES_DIR

_firebase_initialized = False

def init_firebase():
    global _firebase_initialized
    if not FCM_ENABLED:
        print("⚠️  FCM disabled — firebase-key.json tidak ditemukan")
        return False
    try:
        import firebase_admin
        from firebase_admin import credentials
        if not firebase_admin._apps:
            cred = credentials.Certificate(FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
        _firebase_initialized = True
        print("✅ Firebase initialized")
        return True
    except Exception as e:
        print(f"❌ Firebase init error: {e}")
        return False

def save_capture(frame, event: dict) -> str:
    import cv2
    os.makedirs(CAPTURES_DIR, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"truck_{ts}_{event['id']}.jpg"
    path = os.path.join(CAPTURES_DIR, filename)
    cv2.imwrite(path, frame)
    print(f"📸 Capture saved: {path}")
    return path

async def send_truck_notification(event: dict, capture_path: str):
    if not _firebase_initialized:
        print(f"[FCM MOCK] Truck! conf={event['confidence']:.2f} dir={event['direction']} capture={capture_path}")
        return

    try:
        from firebase_admin import messaging

        message = messaging.Message(
            notification=messaging.Notification(
                title="🚛 Truck Detected!",
                body=f"Confidence: {event['confidence']*100:.1f}% | Direction: {event['direction'].upper()}",
            ),
            data={
                "confidence": str(round(event['confidence'], 3)),
                "direction":  event['direction'],
                "timestamp":  datetime.now().isoformat(),
                "capture":    os.path.basename(capture_path),
            },
            topic="truck-alerts",
            android=messaging.AndroidConfig(priority="high"),
            webpush=messaging.WebpushConfig(
                notification=messaging.WebpushNotification(
                    title="🚛 Truck Detected!",
                    body=f"Confidence: {event['confidence']*100:.1f}% | {event['direction'].upper()}",
                ),
                headers={"Urgency": "high"},
            ),
        )

        response = messaging.send(message)
        print(f"✅ FCM sent: {response}")

    except Exception as e:
        print(f"❌ FCM error: {e}")