# ARCHITECTURE.md

> Read `AI_COLLABORATION_RULES.md` first. Rules apply to all work on this project.

> **RULE FOR ANY AI/DEVELOPER WORKING ON THIS PROJECT:**
> This file MUST be updated at the end of every completed phase — new decisions, trade-offs,
> or changes made along the way. Do not start a new phase without checking this file first,
> and do not leave it stale after finishing one. Same rule applies to `LEARNING_ROADMAP.md`
> and `PROJECT_STATUS.md`.

---

## 1. What we're building

A learning-scope, portfolio-grade streaming platform (Web + Mobile + Desktop), built solo.
Goal is to understand real production architecture (adaptive streaming, async processing,
multi-platform code reuse) — not to ship a literal Netflix competitor.

No purchased/licensed content will be used → **DRM is explicitly out of scope**. Content will
be royalty-free/test video, so the hard problem is transcoding + adaptive playback, not
content protection.

---

## 2. Core architecture decision

**One backend owns all business logic. Web/Mobile/Desktop are thin clients.**

Reasoning: solo dev + 3 platforms from day one only survives if logic isn't duplicated three
times. Any client-side business logic is a red flag — push it back to backend.

```
                    ┌─────────────┐
                    │   Backend    │  ← single source of truth
                    │  (FastAPI)   │     (auth, catalog, users,
                    │              │      triggers transcode jobs)
                    └──────┬───────┘
           ┌────────────────┼────────────────┐
      ┌────▼───┐      ┌─────▼────┐      ┌────▼────┐
      │  Web   │      │  Mobile  │      │ Desktop │
      │(React) │      │  (RN)    │      │(Electron)│
      └────────┘      └──────────┘      └─────────┘

      Background: Celery worker (ffmpeg transcode) + Redis (job queue) + Postgres (data)
```

Delivery sequencing (architecture supports all 3 "from day one", but build order is):
1. Backend + Web (core feature complete)
2. Desktop (near-free — Electron wraps the web build)
3. Mobile (own UI pass, shares types/api-client via monorepo)

---

## 3. Tech stack (locked)

| Layer | Choice | Reasoning |
|---|---|---|
| Backend API | FastAPI (Python) | User's existing strength, async-native, auto OpenAPI docs keep 3 clients in sync |
| Database | PostgreSQL | Relational integrity for users/catalog/history |
| Job queue | Celery + Redis | Transcoding is slow (minutes) — must run off the request thread |
| Video processing | ffmpeg | Industry standard, generates HLS renditions |
| Storage (dev) | Local disk, path-structured to map 1:1 to S3 later | Zero cost now, no rewrite later |
| Web | React + Vite | User's existing React experience (ZevarCart) |
| Mobile | React Native | Shares logic/patterns with web; no new language required (vs Flutter/Dart) |
| Desktop | Electron | Wraps the web React build almost directly — lowest cost for "desktop from day one" |
| Monorepo tool | pnpm workspaces | Strict dependency resolution, built-in workspace support, lighter than Turborepo (not needed yet) |
| Auth | JWT (access + refresh) | Works identically across all 3 platforms, no cookie/session complications |
| Status updates | Polling (`GET /content/{id}/status`) | Simpler than WebSocket/SSE; transcode status changes rarely — no real-time need yet |

**Explicitly deferred / out of scope for now:** DRM, ML-based recommendations, billing/subscriptions,
comments/ratings, Turborepo (add only if build times become a real problem).

---

## 4. Database schema (v1)

```
users
├── id, email, password_hash, username, created_at

content (videos)
├── id, title, description, thumbnail_url
├── status (uploading/processing/ready/failed)
├── duration, uploaded_by (FK users), created_at

content_variants (HLS renditions — output of transcode)
├── id, content_id (FK), resolution (480p/720p/1080p)
├── hls_path, bitrate

watch_history
├── id, user_id (FK), content_id (FK)
├── progress_seconds, last_watched_at

categories / content_categories (many-to-many)
```

Relationships: `content` 1→many `content_variants`. `users` 1→many `watch_history` many→1 `content`.

Schema already supports "easy tier" recommendations later (trending, same-category) via
plain SQL on `watch_history` — no ML, no schema changes needed.

---

## 5. API design (v1)

```
Auth
POST   /auth/register
POST   /auth/login              → JWT
POST   /auth/refresh

Content
GET    /content                 → browse (pagination, category filter)
GET    /content/{id}            → details + variants
POST   /content                 → upload → triggers Celery transcode job
GET    /content/{id}/status     → poll transcode progress
DELETE /content/{id}

Streaming
GET    /content/{id}/stream/master.m3u8   → HLS master playlist

Watch history
POST   /watch-history           → update progress
GET    /watch-history           → "continue watching"

Categories
GET    /categories
```

Upload flow:
```
1. POST /content → saves raw file, DB status="processing", returns id immediately
2. Backend pushes Celery job (content_id) to Redis
3. Celery worker → ffmpeg → HLS variants → saves files → DB status="ready"
4. Frontend polls GET /content/{id}/status until ready
```

---

## 6. Repo structure

```
streamflix/
├── apps/
│   ├── backend/   (FastAPI: api/, models/, schemas/, services/, workers/, core/)
│   ├── web/       (React + Vite)
│   ├── mobile/    (React Native)
│   └── desktop/   (Electron)
├── packages/
│   ├── api-client/  (shared typed API client)
│   ├── types/        (shared types, mirrors Pydantic schemas)
│   └── ui/            (shared component logic where feasible)
├── infra/
│   ├── docker-compose.yml  (postgres, redis, backend, worker)
│   └── nginx/               (media serving, later)
└── docs/  (this file, LEARNING_ROADMAP.md, PROJECT_STATUS.md)
```

---

## 7. Decision log

| Date | Decision | Reasoning |
|---|---|---|
| Phase 0 | FastAPI over Node/NestJS | User's existing Python strength |
| Phase 0 | React Native over Flutter | Zero new language, code-sharing with web React |
| Phase 0 | pnpm workspaces over Turborepo | Solo dev, no build-speed problem yet |
| Phase 0 | Polling over WebSocket/SSE for transcode status | Status changes rarely, simplicity > real-time here |
| Phase 0 | No DRM | No real/licensed content will be hosted |
| Phase 0 | No ML recommendations | User has no ML background; "easy tier" (SQL-based) covers real value at this scale |
| Phase 17 closeout | `ContentResponse` missing `thumbnail_url` | Schema gap, not upload-logic bug — added field so poster data actually serializes |
| Phase 18 | Two-step auth token (account token + profile token) wasn't reflected in frontend | Added `profileToken`/`profileId` to `AuthContext`, `client.js` now prefers profile token when present |
| Phase 18 | Route guarding for login→profiles→home used `navigate(..., {replace:true})` only | Insufficient — back button could still walk further back. Fixed with state-based guards: each page checks real auth state on mount and bounces forward regardless of history depth |
| Phase 18 | Backend returns relative `/media/...` paths; frontend img/Image tags used them raw | Silently broken on Web (wrong origin), would've been broken on Mobile too if unfixed (no origin at all — bare path with no host). Added `resolveMediaUrl()` per platform to prefix backend base URL |
| Phase 18 (Mobile) | Needed default avatar images for ProfilePicker, no react-native-svg dependency present | Used colored View circles + initial letter instead of SVG assets — avoids adding a native dependency given documented Android env friction (SDK path, JDK, Metro/npm issues) |
| Phase 19 | Monorepo code sharing in `packages/` (`@streamflix/types`, `@streamflix/api-client`, `@streamflix/ui`) | Standardizes interfaces and HTTP clients across Web and Mobile without code duplication |
| Phase 19 | Deconstructed overloaded `Catalog` page into 12 dedicated pages/screens | Separates personal content (My Space, Watchlist, History) from general browsing (Home, Movies, Series, Categories, Search) for modern streaming IA |
| Phase 19 | Refactored `GET /admin/storage` to `anyio.to_thread.run_sync` | Prevents blocking the main FastAPI async event loop during disk size directory traversals |
| Phase 20 | Milestone Baseline Commit | Baseline release snapshot covering full UI, Monorepo packages, and navigation decomposition |
| Phase 21 Architecture | Single Master File Storage (1x Disk Overhead) | Stores only 1 high-quality master source file (fMP4/faststart) instead of pre-transcoding 3-5 full static renditions permanently, reducing disk usage by 70-80% |
| Phase 21 Architecture | Zero-CPU 1080p Streaming via fMP4 Byte-Ranges | Native 1080p stream is served directly from the master MP4 file via HTTP Byte-Range requests without re-encoding, incurring 0% CPU transcoding overhead |
| Phase 21 Architecture | On-Demand 20s Chunk Downscaling (720p/480p) | Lower renditions are encoded on-the-fly in 20-second chunk lookaheads, shared in a hot cache across concurrent viewers to cap CPU load |
| Phase 21 Architecture | Automatic LRU Cache Eviction | Temporary transcoded chunks in hot storage are garbage-collected after 10-15 minutes of inactivity or when cache disk hits 80% capacity |
| Phase 21 Architecture | Cloudflare CDN + Oracle Always Free (200 GB) & MinIO | Leverages Oracle's free 200 GB block storage + self-hosted MinIO with Cloudflare CDN for $0 egress bandwidth costs |
| Phase 21 Architecture | Event-Driven Watch Progress Telemetry | Replaces per-segment logging with a 30s debounced heartbeat + seek/pause/exit event listeners (`onSeeking`, `onPause`, `sendBeacon`), cutting backend API/Redis traffic by 99% |

---

## 8. Scalable Storage & Hybrid Transcoding Pipeline Architecture

### 8.1 Single Master File & Zero-Upscaling Rule
- **Storage Strategy**: Videos are uploaded and stored as a single, normalized Master MP4 file (`master_source.mp4`) with `faststart` metadata. Pre-transcoding into 480p/720p/1080p static folders on upload is eliminated, reducing permanent disk footprint from ~3x-5x down to **1x**.
- **Skip-Upscaling Rule**: Source video height is probed via `ffprobe`. Target renditions higher than the source height are filtered out (e.g., a 720p upload generates only 720p and 480p; 1080p is skipped).

### 8.2 Zero-CPU 1080p Byte-Range Streaming
- When 1080p quality is requested for a 1080p source video, the HLS master/variant playlist maps directly to byte-ranges of the existing master MP4 file.
- The server (Nginx/FastAPI) serves chunks via standard `Range: bytes=X-Y` HTTP headers.
- **CPU Overhead**: **0%**. No `ffmpeg` re-encoding processes are spawned during 1080p playback.

### 8.3 On-Demand 720p/480p Chunk Downscaling & Throttled Processing
- **20-Second Lookahead Chunking**: When a viewer requests 720p or 480p downscaling, the backend transcoder processes only the next **5 HLS chunks (20 seconds)** ahead of active playback position.
- **Shared Chunk Cache**: Transcoded chunks are written to a shared hot cache (`/tmp/hls_cache`). If 50 users watch the same video, Chunk #5 is transcoded **ONCE** and served to all 50 users instantly.
- **Worker & Thread Limits**: `ffmpeg` runs under strict CPU limits (`-threads 2 -nice 10`), with Celery worker concurrency capped to prevent CPU spikes under 100-1000 concurrent user streams. Hardware acceleration (NVENC/QuickSync/VAAPI) is utilized where available.

### 8.4 Automatic LRU Storage Eviction (Garbage Collector)
- A background worker scans the temporary hot cache directory every 5 minutes.
- Chunks not requested within the last **10–15 minutes** (or when cache storage exceeds 80% capacity) are automatically purged.
- When users close the app, their temporary downscaled chunks naturally age out and are deleted.

---

## 9. Cloud Infrastructure & Zero-Egress Architecture

```
 ┌─────────────────────────────────────────────────────────────┐
 │                 Cloudflare CDN (Global Edge)                │
 │                 ($0 Egress Bandwidth Fees)                  │
 └──────────────────────────────┬──────────────────────────────┘
                                │ Static HTTP Segment Requests
                                ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                Oracle Cloud Always Free VM                  │
 │   - 4 OCPU ARM Cores / 24 GB RAM                            │
 │   - 200 GB Block Storage (MinIO S3-Compatible Object Store) │
 │   - Dockerized FastAPI + Dockerized Open-Source Redis       │
 └─────────────────────────────────────────────────────────────┘
```

- **Object Storage**: 200 GB free storage hosted via self-hosted MinIO inside Oracle Cloud Always Free VM (or Backblaze B2 at $0.006/GB for large expansions).
- **Zero Egress Bandwidth**: All media requests pass through Cloudflare CDN, eliminating outbound bandwidth costs.
- **Unlimited Redis Commands**: Open-source Redis runs in a local Docker container alongside FastAPI, avoiding command-count caps of managed serverless Redis services.

---

## 10. Telemetry & Event-Driven Watch Tracking

To prevent database and API overload during high concurrent playback (avoiding 1,800 pings per movie per user):

1. **Debounced 30s Heartbeat**: Sends watch progress only once every 30 seconds of continuous uninterrupted play.
2. **Seek Event Listener (`onSeeking`)**: Flushes exact progress prior to seek point, resets the 30s timer, and resumes tracking from new timestamp.
3. **Pause Event Listener (`onPause`)**: Flushes progress immediately when video is paused.
4. **App Exit Listener (`onBeforeUnload` / `sendBeacon`)**: Transmits final timestamp via asynchronous beacon when tab or app is closed.
- **Traffic Reduction**: Cuts backend API/DB writes from 1,800 calls to **~12–15 calls per movie**.