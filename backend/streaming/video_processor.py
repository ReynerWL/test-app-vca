import cv2
import asyncio
import numpy as np
from datetime import datetime

from config import VIDEO_SOURCE, FRAME_SKIP, CAPTURES_DIR
from detection.yolo_detector import VehicleDetector
from detection.line_counter import LineCounter
from websocket.manager import ws_manager
from notification.fcm import save_capture, send_truck_notification
from database import AsyncSessionLocal, CrossingEvent

class VideoProcessor:
    def __init__(self):
        self.detector = VehicleDetector()
        self.counter = LineCounter()
        self.cap: cv2.VideoCapture = None
        self.running = False
        self.frame_count = 0
        self.latest_frame: bytes = None

        # Source info
        self.source = VIDEO_SOURCE
        self.source_type = "file" 
        self.width = 640
        self.height = 360

        # Flag untuk hot-swap source
        self._pending_source = None
        self._pending_type = None

    def request_source_change(self, source: str, source_type: str):
        self._pending_source = source
        self._pending_type = source_type

    def _open_source(self, source: str):
        if self.cap and self.cap.isOpened():
            self.cap.release()

        self.cap = cv2.VideoCapture(source)
        if not self.cap.isOpened():
            raise RuntimeError(f"Tidak bisa membuka: {source}")

        self.width  = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        print(f"✅ Source dibuka: {source} ({self.width}x{self.height})")

    def get_source_info(self) -> dict:
        return {
            "source": self.source,
            "type": self.source_type,
            "width": self.width,
            "height": self.height,
            "running": self.running,
        }

    def _annotate_frame(self, frame: np.ndarray, detections: list) -> np.ndarray:
        frame = self.counter.draw_line(frame)
        for det in detections:
            x1, y1, x2, y2 = det["bbox"]
            label = f"{det['class_name']} #{det['id']} {det['confidence']:.2f}"
            color = {"car": (0,255,0), "motorcycle": (255,165,0),
                     "bus": (0,0,255), "truck": (0,0,180)}.get(det["class_name"], (200,200,200))
            cv2.rectangle(frame, (x1,y1), (x2,y2), color, 2)
            cv2.putText(frame, label, (x1, y1-6),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 1)

        # Timestamp overlay
        ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        cv2.putText(frame, ts, (10, self.height - 10),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.45, (180,180,180), 1)

        # Count overlay
        counts = self.counter.get_total_counts()
        y = 20
        for cls, dirs in counts.items():
            total = dirs["in"] + dirs["out"]
            if total > 0:
                cv2.putText(frame, f"{cls}: {total}", (10, y),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255,255,255), 1)
                y += 20
        return frame

    async def _save_event(self, event: dict, capture_path: str = None):
        async with AsyncSessionLocal() as session:
            session.add(CrossingEvent(
                vehicle_class=event["class_name"],
                direction=event["direction"],
                confidence=event["confidence"],
                capture_path=capture_path,
            ))
            await session.commit()

    async def run(self):
        self._open_source(self.source)
        self.running = True
        loop = asyncio.get_event_loop()

        while self.running:

            if self._pending_source:
                try:
                    self._open_source(self._pending_source)
                    self.source = self._pending_source
                    self.source_type = self._pending_type
                    self.counter = LineCounter()   # reset counter
                    self.frame_count = 0
                    await ws_manager.broadcast({
                        "type": "source_changed",
                        "data": self.get_source_info()
                    })
                except Exception as e:
                    print(f"❌ Gagal ganti source: {e}")
                finally:
                    self._pending_source = None
                    self._pending_type = None

            ret, frame = await loop.run_in_executor(None, self.cap.read)

            if not ret:
                if self.source_type == "file":
                    self.cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                else:
                    print("⚠️ RTSP stream lost, retrying...")
                    await asyncio.sleep(2)
                    try:
                        self._open_source(self.source)
                    except:
                        pass
                continue

            self.frame_count += 1
            if self.frame_count % FRAME_SKIP != 0:
                continue

            detections = await loop.run_in_executor(None, self.detector.detect, frame)
            crossing_events = self.counter.update(detections)

            for event in crossing_events:
                capture_path = None
                if event["class_name"] == "truck":
                    capture_path = save_capture(frame, event)
                    asyncio.create_task(send_truck_notification(event, capture_path))
                asyncio.create_task(self._save_event(event, capture_path))
                await ws_manager.broadcast({
                    "type": "crossing",
                    "data": {
                        "class": event["class_name"],
                        "direction": event["direction"],
                        "confidence": event["confidence"],
                        "capture": capture_path,
                        "timestamp": datetime.now().isoformat(),
                    }
                })

            if self.frame_count % (FRAME_SKIP * 5) == 0:
                await ws_manager.broadcast({
                    "type": "count_update",
                    "data": self.counter.get_total_counts(),
                })

            annotated = self._annotate_frame(frame.copy(), detections)
            _, buffer = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 85])
            self.latest_frame = buffer.tobytes()

            await asyncio.sleep(0.01)

        if self.cap:
            self.cap.release()

    def stop(self):
        self.running = False
