import numpy as np
from config import LINE_START, LINE_END

class LineCounter:
    def __init__(self, line_start=LINE_START, line_end=LINE_END):
        self.line_start = np.array(line_start, dtype=float)
        self.line_end = np.array(line_end, dtype=float)

        # Track posisi sebelumnya tiap objek {track_id: side}
        self._prev_side: dict[int, int] = {}

        # Counts per class per direction
        self.counts: dict[str, dict[str, int]] = {}

    def _get_side(self, point: tuple) -> int:
        p = np.array(point, dtype=float)
        d = self.line_end - self.line_start
        v = p - self.line_start
        cross = d[0] * v[1] - d[1] * v[0]
        return 1 if cross >= 0 else -1

    def update(self, detections: list[dict]) -> list[dict]:
        crossing_events = []

        for det in detections:
            track_id = det["id"]
            center = det["center"]
            current_side = self._get_side(center)

            if track_id in self._prev_side:
                prev_side = self._prev_side[track_id]

                # Crossing terjadi jika sisi berubah
                if prev_side != current_side:
                    direction = "in" if current_side == 1 else "out"
                    class_name = det["class_name"]

                    # Update count
                    if class_name not in self.counts:
                        self.counts[class_name] = {"in": 0, "out": 0}
                    self.counts[class_name][direction] += 1

                    event = {
                        **det,
                        "direction": direction,
                        "event": "crossing",
                    }
                    crossing_events.append(event)

            self._prev_side[track_id] = current_side

        # Cleanup track IDs yang sudah tidak muncul
        if len(self._prev_side) > 500:
            active_ids = {d["id"] for d in detections}
            self._prev_side = {k: v for k, v in self._prev_side.items() if k in active_ids}

        return crossing_events

    def get_total_counts(self) -> dict:
        total = {"car": {"in": 0, "out": 0},
                 "motorcycle": {"in": 0, "out": 0},
                 "bus": {"in": 0, "out": 0},
                 "truck": {"in": 0, "out": 0}}
        total.update(self.counts)
        return total

    def draw_line(self, frame: np.ndarray) -> np.ndarray:
        import cv2
        p1 = tuple(map(int, self.line_start))
        p2 = tuple(map(int, self.line_end))
        cv2.line(frame, p1, p2, (0, 255, 255), 2)
        cv2.circle(frame, p1, 5, (0, 200, 255), -1)
        cv2.circle(frame, p2, 5, (0, 200, 255), -1)
        return frame

    def update_line(self, line_start: tuple, line_end: tuple):
        import numpy as np
        self.line_start = np.array(line_start, dtype=float)
        self.line_end   = np.array(line_end,   dtype=float)
        self._prev_side = {}   # reset tracking
        print(f"📏 Line updated: {line_start} → {line_end}")
