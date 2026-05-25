import logging
from typing import List

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class WebSocketManager:
    def __init__(self):
        self.connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.connections:
            self.connections.remove(websocket)

    async def broadcast(self, message: str):
        dead_connections = []

        for ws in self.connections:
            try:
                await ws.send_text(message)
            except Exception as e:
                logger.warning(f"Failed to send to client: {e}")
                dead_connections.append(ws)

        for ws in dead_connections:
            self.disconnect(ws)

    async def broadcast_json(self, data: dict):
        import json
        await self.broadcast(json.dumps(data))
