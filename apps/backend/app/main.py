from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings

from app.api.watch_history import router as watch_history_router
from app.api.auth import router as auth_router
from app.api.content import router as content_router
from app.api.categories import router as categories_router
from app.api.admin import router as admin_router
from app.api.admin_storage import router as admin_storage_router
from app.api.profile import router as profiles_router
from app.api.watchlist import router as watchlist_router
from app.api.ratings import router as ratings_router
from app.api.series import router as series_router

from app.api.streaming import router as streaming_router
from app.api.discover import router as discover_router

app = FastAPI(title="StreamFlix API")

origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()] if settings.cors_origins != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(profiles_router)
app.include_router(admin_storage_router)
app.include_router(categories_router)
app.include_router(discover_router)
app.include_router(content_router)
app.include_router(streaming_router)
app.include_router(ratings_router)
app.include_router(series_router)
app.include_router(watchlist_router)
app.include_router(watch_history_router)

settings.media_storage_path.mkdir(parents=True, exist_ok=True)
app.mount("/media", StaticFiles(directory=str(settings.media_storage_path)), name="media")

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text
from app.core.db import get_db

@app.get("/health")
async def health_check(db: AsyncSession = Depends(get_db)):
    db_status = "ok"
    try:
        await db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {"status": "ok", "db": db_status}