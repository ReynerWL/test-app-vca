from ultralytics import YOLO
import numpy as np
from config import YOLO_MODEL, CONFIDENCE_THRESHOLD, VEHICLE_CLASSES

class VehicleDetector:
    def __init__(self):
        print(f"🔄 Loading model {YOLO_MODEL}...")
        self.model = YOLO(YOLO_MODEL)
        self.model.fuse()
        print("✅ Model loaded")

    def detect(self, frame: np.ndarray) -> list[dict]:
        results = self.model.track(
            frame,
            persist=True,
            conf=CONFIDENCE_THRESHOLD,
            classes=list(VEHICLE_CLASSES.keys()),
            verbose=False,
            imgsz=640,
            augment=False,
            agnostic_nms=True,
        )

        detections = []
        if results[0].boxes is None:
            return detections

        boxes = results[0].boxes
        for box in boxes:
            if box.id is None:
                continue

            class_id = int(box.cls[0])
            if class_id not in VEHICLE_CLASSES:
                continue

            x1, y1, x2, y2 = map(int, box.xyxy[0])
            center = ((x1 + x2) // 2, (y1 + y2) // 2)

            detections.append({
                "id": int(box.id[0]),
                "class_id": class_id,
                "class_name": VEHICLE_CLASSES[class_id],
                "confidence": round(float(box.conf[0]), 3),
                "bbox": [x1, y1, x2, y2],
                "center": center,
            })

        return detections
