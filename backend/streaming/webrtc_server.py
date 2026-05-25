import asyncio
import fractions
import time
import numpy as np

from aiortc import RTCPeerConnection, RTCSessionDescription, VideoStreamTrack
from aiortc.contrib.media import MediaRelay
import av

# Set peer connections aktif
pcs: set[RTCPeerConnection] = set()

class ProcessorVideoTrack(VideoStreamTrack):
    kind = "video"

    def __init__(self, processor):
        super().__init__()
        self.processor = processor
        self._timestamp = 0
        self._start = time.time()

    async def recv(self):
        pts, time_base = await self.next_timestamp()

        frame_bytes = self.processor.latest_frame

        if frame_bytes:
            import cv2
            nparr = np.frombuffer(frame_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
            frame = av.VideoFrame.from_ndarray(img, format="rgb24")
        else:
            frame = av.VideoFrame(width=640, height=360, format="rgb24")

        frame.pts = pts
        frame.time_base = time_base
        return frame


async def webrtc_offer(body: dict, processor) -> dict:
    offer = RTCSessionDescription(sdp=body["sdp"], type=body["type"])

    pc = RTCPeerConnection()
    pcs.add(pc)

    @pc.on("connectionstatechange")
    async def on_state_change():
        print(f"WebRTC state: {pc.connectionState}")
        if pc.connectionState in ("failed", "closed"):
            await pc.close()
            pcs.discard(pc)

    pc.addTrack(ProcessorVideoTrack(processor))

    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return {
        "sdp": pc.localDescription.sdp,
        "type": pc.localDescription.type,
    }


async def close_all():
    coros = [pc.close() for pc in pcs]
    await asyncio.gather(*coros)
    pcs.clear()
