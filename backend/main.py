import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from streaming.video_processor import VideoProcessor
from api.routes import router, set_processor
from notification.fcm import init_firebase

processor: VideoProcessor = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global processor
    await init_db()
    init_firebase()

    processor = VideoProcessor()
    set_processor(processor)
    task = asyncio.create_task(processor.run())
    print("🚀 Video processor started")

    yield

    # Shutdown — tutup WebRTC connections
    from streaming.webrtc_server import close_all
    await close_all()
    processor.stop()
    task.cancel()
    print("👋 Shutting down...")

app = FastAPI(title="SAMTEK VCA API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)

if __name__ == "__main__":
    import uvicorn
    from config import HOST, PORT
    uvicorn.run("main:app", host=HOST, port=PORT, reload=False, workers=1)
