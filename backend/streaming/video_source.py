import logging
import threading
import time
from typing import Optional

import cv2
import numpy as np

logger = logging.getLogger(__name__)


class VideoSource:
    def __init__(
        self,
        source: str,
        loop_video: bool = True,
        target_fps: int = 30,
    ):
        self.source = source
        self.loop_video = loop_video
        self.target_fps = target_fps
        self._frame_delay = 1.0 / target_fps

        self._cap: Optional[cv2.VideoCapture] = None
        self._latest_frame: Optional[np.ndarray] = None
        self._lock = threading.Lock()
        self._running = False
        self._thread: Optional[threading.Thread] = None

        self.width = 0
        self.height = 0
        self.fps = 0

    def start(self):
        self._cap = cv2.VideoCapture(self.source)

        if not self._cap.isOpened():
            raise RuntimeError(f"Cannot open video source: {self.source}")

        self.width  = int(self._cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self._cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        self.fps    = self._cap.get(cv2.CAP_PROP_FPS) or self.target_fps

        logger.info(
            f"📹 Video source opened: {self.source} "
            f"({self.width}x{self.height} @ {self.fps:.1f}fps)"
        )

        self._running = True
        self._thread = threading.Thread(target=self._read_loop, daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False
        if self._thread:
            self._thread.join(timeout=2)
        if self._cap:
            self._cap.release()
        logger.info("Video source stopped")

    def get_frame(self) -> Optional[np.ndarray]:
        with self._lock:
            if self._latest_frame is None:
                return None
            return self._latest_frame.copy()

    def _read_loop(self):
        logger.info("Frame reader thread started")

        while self._running:
            start_time = time.time()

            ret, frame = self._cap.read()

            if not ret:
                if self.loop_video and self._is_file_source():
                    # Video restart
                    logger.info("Video ended, looping...")
                    self._cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                    continue
                else:
                    # RTSP reconnect
                    logger.warning("Stream lost, reconnecting in 2s...")
                    time.sleep(2)
                    self._cap.release()
                    self._cap = cv2.VideoCapture(self.source)
                    continue

            with self._lock:
                self._latest_frame = frame

            elapsed = time.time() - start_time
            sleep_time = self._frame_delay - elapsed
            if sleep_time > 0:
                time.sleep(sleep_time)

        logger.info("Frame reader thread stopped")

    def _is_file_source(self) -> bool:
        return not self.source.startswith("rtsp://")
