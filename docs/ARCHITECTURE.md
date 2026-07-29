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