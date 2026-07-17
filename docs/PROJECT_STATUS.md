# PROJECT_STATUS.md

> Read `AI_COLLABORATION_RULES.md` first. Rules apply to all work on this project.

> **RULE FOR ANY AI/DEVELOPER:** This file must be updated at the end of every completed phase.
> Before starting any new work, read this file first to know exactly where the project stands.
> Never assume — check here.

---

## Current phase
**Phase 4: Desktop (Electron) — NOT STARTED**

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
- [x] HLS files served via `StaticFiles` mount at `/media/{content_id}/master.m3u8`
- [x] Full pipeline verified end-to-end: upload → transcode → status=ready → catalog list → HTTP stream → VLC playback

### Phase 3 — Web frontend — COMPLETE
- [x] React + Vite scaffold in `apps/web`, wired into pnpm workspace
- [x] CORS enabled on backend for `localhost:5173`
- [x] `api/client.js` — axios instance, auto-attaches JWT via interceptor
- [x] Catalog page — lists content from `GET /content`
- [x] Watch page — plays HLS via `hls.js`, verified working in browser
- [x] `/auth/register` + `/auth/login` wired into backend endpoints
- [x] Backend: `POST /content` now requires JWT (`get_current_user_id` dependency) — hardcoded
      `uploaded_by=1` removed, verified 401 without token
- [x] Upload page — authenticated file upload from browser, verified working
- [x] Auth state made reactive via React Context (`AuthContext.jsx`) — nav bar updates
      immediately on login/logout without page refresh (fixed initial bug where it didn't)
- [x] Full authenticated flow verified: register → login → upload → transcode → appears in
      catalog as "ready" → plays in browser

## Pending work (Phase 4 — next)
- [ ] Electron shell setup in `apps/desktop`
- [ ] Wire Electron to load the existing React web build (minimize duplicate work)
- [ ] Verify playback works inside Electron (not just browser — Electron's Chromium engine
      should behave the same, but confirm)
- [ ] Basic packaging/run scripts for desktop app

## Known issues / risks
- RESOLVED — Old unexplained nginx+ffmpeg+HLS failure: root cause dead, ffmpeg HLS generation
  confirmed working standalone (Windows via Git Bash, VLC playback verified 2026-07-16).
- Windows dev environment confirmed NOT a blocker for HLS itself. Only future Apple-specific
  blocker: testing on real iPhone / App Store publishing needs a Mac — deferred, not relevant
  to current phases.
- Celery on Windows requires `--pool=solo` flag (default pool doesn't work on Windows).
- `celery_app.py` needs `include=[...]` explicitly listing task modules, or worker won't
  register tasks defined elsewhere (silent `KeyError` at runtime otherwise).
- Relative file paths break depending on which process's cwd is active (uvicorn vs celery
  worker vs shell) — fixed by anchoring `media_storage_path` as absolute in `config.py`.
  Rule going forward: always use `settings.media_storage_path`, never relative path strings.
- Content row `id=1` permanently stuck at `status=processing` — pre-fix test upload, harmless,
  left as-is.
- `auth.js` and `client.js` have a circular import (each imports the other) — works fine
  because neither touches the other's exports at module-load time, only inside functions.
  Flagged so it's not mistaken for a bug later.

## Technical debt
- passlib dropped (unmaintained, breaks with modern bcrypt versions). Replaced with direct
  `bcrypt` library calls in `core/security.py`.
- `transcode_video` currently does `-c copy` only (repackages to HLS, no actual multi-resolution
  ladder). `content_variants` table exists in schema but is not yet populated — real adaptive
  bitrate streaming is deferred to a later phase.
- No role field on `User` model — every registered user can currently upload content. No
  admin/viewer distinction exists yet at the data layer, so no real UI gating is possible yet
  either (Upload button is visible to logged-out users, but backend correctly blocks the
  actual request with 401 — auth boundary is real, UI polish is not done).

## Future improvements (explicitly deferred, not forgotten)
- "Easy tier" recommendations (trending, same-category) — schema already supports it, add once
  seed content + some watch_history exists
- Turborepo — only if/when build times become a real problem
- S3-compatible object storage — local disk dev path is structured to map to it later
- Real multi-resolution transcoding (populate `content_variants`)
- Role field on User model + role-based UI gating (hide Upload for non-uploaders, admin panel)
- Redirect-to-login when visiting protected routes (e.g. `/upload`) while logged out

## Next recommended task
Set up Electron in `apps/desktop`, load the existing web build inside it, verify playback
works identically to the browser. Should be low-effort since it reuses the finished web app.