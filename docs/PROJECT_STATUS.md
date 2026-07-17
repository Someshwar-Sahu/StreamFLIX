# PROJECT_STATUS.md

> Read `AI_COLLABORATION_RULES.md` first. Rules apply to all work on this project.

> **RULE FOR ANY AI/DEVELOPER:** This file must be updated at the end of every completed phase.
> Before starting any new work, read this file first to know exactly where the project stands.
> Never assume — check here.

---

## Current phase
**Phase 3: Web frontend — NOT STARTED**

## Completed work

### Phase 0 — Planning & Setup
- [x] Scope decided: Web + Mobile + Desktop from day one, solo dev, learning/portfolio project
- [x] No real/licensed content → DRM out of scope
- [x] Tech stack locked (see ARCHITECTURE.md §3)
- [x] Repo folder structure created (monorepo, pnpm workspaces)
- [x] Root config files created: `pnpm-workspace.yaml`, `package.json`, `.gitignore`, `README.md`
- [x] Database schema v1 designed
- [x] API routes v1 designed
- [x] Docs initialized: ARCHITECTURE.md, LEARNING_ROADMAP.md, PROJECT_STATUS.md, AI_COLLABORATION_RULES.md
- [x] git init + first commit
- [x] ffmpeg installed and verified (Windows, Git Bash) — HLS generation + VLC playback confirmed

### Phase 1 — Backend foundation
- [x] Docker installed, data relocated to E: drive (WSL2 vhdx move) to save C: space
- [x] `docker-compose.yml` — Postgres 16 + Redis 7 running locally
- [x] FastAPI skeleton (`app/main.py`, `core/config.py`) — `/health` endpoint verified
- [x] Alembic initialized, wired to async DB via sync URL override in `env.py`
- [x] Models created: User, Content, ContentVariant, WatchHistory
- [x] Migration 1: `users` table
- [x] Migration 2: `content`, `content_variants`, `watch_history` tables
- [x] `/auth/register` + `/auth/login` — JWT-based, verified working (200 OK both)
- [x] Celery + Redis task queue verified working end-to-end (Windows, `--pool=solo`)

### Phase 2 — Content upload + transcode pipeline — COMPLETE
- [x] `transcode_video` Celery task — ffmpeg `-c copy` → HLS output, verified via VLC
- [x] `media_storage_path` anchored as absolute path in config (fixed recurring relative-path bugs)
- [x] `POST /content` — file upload, DB row creation, triggers Celery transcode job
- [x] Celery task updates DB status (`processing` → `ready`/`failed`) via separate sync DB connection
- [x] `GET /content` — list/browse catalog
- [x] `GET /content/{id}` — single content details
- [x] `GET /content/{id}/status` — poll transcode status
- [x] HLS files served via `StaticFiles` mount at `/media/{content_id}/master.m3u8` (handles range requests for seeking automatically)
- [x] **Full pipeline verified end-to-end: upload → transcode → status=ready → catalog list → HTTP stream → VLC playback confirmed working**

## Pending work (Phase 3 — next)
- [ ] React + Vite scaffold in `apps/web`
- [ ] API client setup (calls FastAPI backend)
- [ ] Catalog/browse page (calls `GET /content`)
- [ ] Video player page using `hls.js` (browsers, unlike VLC, need this to parse `.m3u8`)
- [ ] Upload UI (calls `POST /content`)
- [ ] Auth pages (register/login, JWT storage)

## Known issues / risks
- RESOLVED — Old unexplained nginx+ffmpeg+HLS failure: root cause dead, ffmpeg HLS generation
  confirmed working standalone (Windows via Git Bash, VLC playback verified 2026-07-16).
- Windows dev environment confirmed NOT a blocker for HLS itself. Only future Apple-specific
  blocker: testing on real iPhone / App Store publishing needs a Mac — deferred, not relevant
  to current phases (Android + Web + Desktop first).
- Celery on Windows requires `--pool=solo` flag (default pool doesn't work on Windows).
- `celery_app.py` needs `include=[...]` explicitly listing task modules, or worker won't
  register tasks defined elsewhere (silent `KeyError` at runtime otherwise).
- Relative file paths break depending on which process's cwd is active (uvicorn vs celery
  worker vs shell) — fixed by anchoring `media_storage_path` as absolute in `config.py`.
  Rule going forward: always use `settings.media_storage_path`, never relative path strings.
- Content row `id=1` permanently stuck at `status=processing` — pre-fix test upload, harmless,
  left as-is (not worth a manual DB fix for test data).

## Technical debt
- passlib dropped (unmaintained, breaks with modern bcrypt versions — `AttributeError` on
  `__about__`). Replaced with direct `bcrypt` library calls in `core/security.py`.
- `transcode_video` currently does `-c copy` only (repackages to HLS, no actual multi-resolution
  ladder). `content_variants` table exists in schema but is not yet populated — real adaptive
  bitrate streaming (multiple resolutions) is deferred to a later phase.
- `POST /content` hardcodes `uploaded_by=1` — not wired to real authenticated user yet (JWT
  auth exists via `/auth`, but content upload doesn't check/use it yet).

## Future improvements (explicitly deferred, not forgotten)
- "Easy tier" recommendations (trending, same-category) — schema already supports it, add once
  seed content + some watch_history exists
- Turborepo — only if/when build times become a real problem
- S3-compatible object storage — local disk dev path is structured to map to it later
- Real multi-resolution transcoding (populate `content_variants`)
- Wire JWT auth into `POST /content` (currently hardcoded uploader)

## Next recommended task
Scaffold `apps/web` (React + Vite), build a minimal catalog page calling `GET /content`,
then a player page using `hls.js` to stream `GET /media/{id}/master.m3u8` — proves the
whole pipeline works from an actual browser, not just VLC.