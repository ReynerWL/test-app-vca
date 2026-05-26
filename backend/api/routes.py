import asyncio
import cv2
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
from sqlalchemy import select, func
from database import AsyncSessionLocal, CrossingEvent
from websocket.manager import ws_manager

router = APIRouter()
processor = None

def set_processor(p):
    global processor
    processor = p

# MJPEG Stream (fallback)
@router.get("/stream")
async def mjpeg_stream():
    async def generate():
        while True:
            if processor and processor.latest_frame:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" +
                    processor.latest_frame +
                    b"\r\n"
                )
            await asyncio.sleep(0.033)
    return StreamingResponse(
        generate(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

# WebRTC
@router.post("/webrtc/offer")
async def webrtc_offer(body: dict):
    from streaming.webrtc_server import webrtc_offer as _offer
    return await _offer(body, processor)

# WebSocket counting
@router.websocket("/ws/counting")
async def websocket_counting(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        if processor:
            await websocket.send_json({
                "type": "count_update",
                "data": processor.counter.get_total_counts(),
            })
            await websocket.send_json({
                "type": "source_info",
                "data": processor.get_source_info(),
            })
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

# Source Management
@router.post("/api/source")
async def change_source(body: dict):
    if not processor:
        return {"error": "Processor belum berjalan"}

    src_type = body.get("type", "file")

    if src_type == "file":
        source = body.get("path", "")
        if not source:
            return {"error": "path diperlukan"}
    elif src_type == "rtsp":
        source = body.get("url", "")
        if not source:
            return {"error": "url diperlukan"}
    else:
        return {"error": "type harus 'file' atau 'rtsp'"}

    processor.request_source_change(source, src_type)
    return {"ok": True, "switching_to": source}

@router.get("/api/source")
async def get_source():
    if not processor:
        return {"error": "Processor belum berjalan"}
    return processor.get_source_info()

# Video info (untuk frontend aspect ratio)
@router.get("/api/video-info")
async def video_info():
    if not processor:
        return {"width": 640, "height": 360}
    return {"width": processor.width, "height": processor.height}

# REST Data
@router.get("/api/counts")
async def get_counts():
    if not processor:
        return {"error": "Processor belum berjalan"}
    return processor.counter.get_total_counts()

@router.get("/api/events")
async def get_events(limit: int = 50):
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(CrossingEvent)
            .order_by(CrossingEvent.timestamp.desc())
            .limit(limit)
        )
        return [
            {
                "id": e.id,
                "class": e.vehicle_class,
                "direction": e.direction,
                "confidence": e.confidence,
                "capture": e.capture_path,
                "timestamp": e.timestamp.isoformat() if e.timestamp else None,
            }
            for e in result.scalars().all()
        ]

@router.get("/api/stats")
async def get_stats():
    async with AsyncSessionLocal() as session:
        result = await session.execute(
            select(
                CrossingEvent.vehicle_class,
                CrossingEvent.direction,
                func.count(CrossingEvent.id).label("total")
            ).group_by(CrossingEvent.vehicle_class, CrossingEvent.direction)
        )
        stats = {}
        for cls, direction, total in result.all():
            if cls not in stats:
                stats[cls] = {"in": 0, "out": 0}
            stats[cls][direction] = total
        return stats

@router.get("/api/health")
async def health():
    return {
        "status": "ok",
        "processor_running": processor.running if processor else False,
        "ws_clients": len(ws_manager.active_connections),
    }

# FCM Subscribe
@router.post("/api/fcm/subscribe")
async def fcm_subscribe(body: dict):
    token = body.get("token")
    topic = body.get("topic", "truck-alerts")
    if not token:
        return {"error": "token required"}
    try:
        from firebase_admin import messaging
        response = messaging.subscribe_to_topic([token], topic)
        return {"success": True, "subscribed": response.success_count}
    except Exception as e:
        return {"error": str(e)}

# Virtual Line
@router.get("/api/line")
async def get_line():
    if not processor:
        return {"error": "Processor belum berjalan"}
    c = processor.counter
    return {
        "start": {"x": int(c.line_start[0]), "y": int(c.line_start[1])},
        "end":   {"x": int(c.line_end[0]),   "y": int(c.line_end[1])},
    }

@router.post("/api/line")
async def set_line(body: dict):
    if not processor:
        return {"error": "Processor belum berjalan"}
    try:
        start = body["start"]
        end   = body["end"]
        processor.counter.update_line(
            (start["x"], start["y"]),
            (end["x"],   end["y"]),
        )
        # Broadcast ke semua client bahwa line berubah
        await ws_manager.broadcast({
            "type": "line_updated",
            "data": body,
        })
        return {"ok": True}
    except Exception as e:
        return {"error": str(e)}

@router.post("/api/line/reset")
async def reset_line():
    if not processor:
        return {"error": "Processor belum berjalan"}
    from config import LINE_START, LINE_END
    processor.counter.update_line(LINE_START, LINE_END)
    return {"ok": True}
