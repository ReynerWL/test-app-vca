import os

# --- Video Source ---
VIDEO_SOURCE = os.getenv("VIDEO_SOURCE", "assets/test_video.mp4")

# --- YOLOv8 Model ---
YOLO_MODEL = os.getenv("YOLO_MODEL", "yolov8s.pt")

# Confidence threshold deteksi (0.0 - 1.0)
CONFIDENCE_THRESHOLD = 0.25

# Frame skip — proses 1 dari N frame
FRAME_SKIP = 2

# --- Virtual Line ---
# Koordinat garis virtual dalam pixel (x1, y1) → (x2, y2)
LINE_START = (0, 180)
LINE_END = (640, 180)

# Class IDs yang dideteksi
VEHICLE_CLASSES = {
    2: "car",
    3: "motorcycle",
    5: "bus",
    7: "truck",
}

HOST = "0.0.0.0"
PORT = 8000

FIREBASE_CREDENTIALS_PATH = "firebase-key.json"
FCM_ENABLED = os.path.exists(FIREBASE_CREDENTIALS_PATH)

DATABASE_URL = "sqlite+aiosqlite:///./vca.db"

CAPTURES_DIR = "../captures"
