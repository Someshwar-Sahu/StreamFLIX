from celery import Celery
from app.core.config import settings

celery_app = Celery(
    "streamflix",
    broker=settings.redis_url,
    backend=settings.redis_url,
    include=["app.workers.tasks", "app.workers.cache_cleaner"],
)

celery_app.conf.beat_schedule = {
    "cleanup-hls-cache-every-5-mins" : {
        "task": "app.workers.cache_cleaner.run_periodic_cache_cleanup",
        "schedule": 300.0,
    }
}