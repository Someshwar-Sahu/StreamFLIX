import asyncio
import shutil
from pathlib import Path
from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.models.user import Base
from app.models.content import Content
from app.models.profile import Profile
from app.models.category import Category
from app.models.rating import Rating
from app.models.series import Series, Season, Episode
from app.models.watch_history import WatchHistory
from app.models.watchlist import Watchlist
from app.core.db import SessionLocal

PREDEFINED_CATEGORIES = [
    'Action', 'Thriller', 'Sci-Fi', 'Fantasy', 'Comedy',
    'Drama', 'Romance', 'Horror', 'Mystery', 'Adventure',
    'Animation', 'Anime', 'Crime', 'Documentary', 'Family',
    'History', 'Music', 'Superhero', 'War', 'Western',
    'Biopic', 'Short Film', 'Sports', 'Reality TV', 'K-Drama'
]

async def reset_database():
    print(f"Connecting to database: {settings.database_url}")
    engine = create_async_engine(settings.database_url)

    async with engine.begin() as conn:
        print("Dropping all existing database tables...")
        await conn.run_sync(Base.metadata.drop_all)
        print("Creating fresh database schema...")
        await conn.run_sync(Base.metadata.create_all)

    await engine.dispose()

    # Seed categories
    async with SessionLocal() as db:
        print("Seeding predefined categories...")
        for cat_name in PREDEFINED_CATEGORIES:
            db.add(Category(name=cat_name))
        await db.commit()
        print("Categories seeded successfully.")

def clean_media_storage():
    media_dir = settings.media_storage_path
    print(f"Cleaning local media storage at: {media_dir}")

    if media_dir.exists():
        for item in media_dir.iterdir():
            if item.is_dir():
                shutil.rmtree(item, ignore_errors=True)
            else:
                item.unlink(missing_ok=True)
        print("Local media storage directory cleaned.")
    else:
        media_dir.mkdir(parents=True, exist_ok=True)
        print("Created fresh local media storage directory.")

if __name__ == "__main__":
    asyncio.run(reset_database())
    clean_media_storage()
    print("Database reset & storage cleanup complete.")
