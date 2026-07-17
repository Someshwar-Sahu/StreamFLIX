from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from app.api.auth import router as auth_router
from app.api.content import router as content_router
from app.core.config import settings

app = FastAPI(title="StreamFlix API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(content_router)

app.mount("/media", StaticFiles(directory=str(settings.media_storage_path)), name="media")

@app.get("/health")
def health_check():
    return {"status": "ok"}