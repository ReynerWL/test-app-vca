from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import Column, Integer, String, Float, DateTime, func
from config import DATABASE_URL

engine = create_async_engine(DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

class Base(DeclarativeBase):
    pass

class CrossingEvent(Base):
    __tablename__ = "crossing_events"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_class = Column(String, nullable=False)   # car, truck, dll
    direction = Column(String, nullable=False)        # in / out
    confidence = Column(Float, nullable=False)
    capture_path = Column(String, nullable=True)      # path foto (khusus truck)
    timestamp = Column(DateTime, default=func.now())

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("✅ Database initialized")
