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

app = FastAPI(title="StreamFlix API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(admin_router)
app.include_router(profiles_router)
app.include_router(admin_storage_router)
app.include_router(categories_router)
app.include_router(content_router)
app.include_router(ratings_router)
app.include_router(series_router)
app.include_router(watchlist_router)
app.include_router(watch_history_router)

app.mount("/media", StaticFiles(directory=str(settings.media_storage_path)), name="media")

@app.get("/health")
def health_check():
    return {"status": "ok"}