# PROJECT_STATUS.md

> Read `AI_COLLABORATION_RULES.md` first. Rules apply to all work on this project.

> **RULE FOR ANY AI/DEVELOPER:** This file must be updated at the end of every completed phase.
> Before starting any new work, read this file first to know exactly where the project stands.
> Never assume — check here.

---

## Current phase
**Phase 5: Mobile (React Native) — NOT STARTED**

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
- [x] `/auth/register` + `/auth/login` — JWT-based, verified working
- [x] Celery + Redis task queue verified working end-to-end (Windows, `--pool=solo`)

### Phase 2 — Content upload + transcode pipeline — COMPLETE
- [x] `transcode_video` Celery task — ffmpeg `-c copy` → HLS output, verified via VLC
- [x] `media_storage_path` anchored as absolute path in config
- [x] `POST /content` — file upload, DB row creation, triggers Celery transcode job
- [x] Celery task updates DB status (`processing` → `ready`/`failed`) via separate sync DB connection
- [x] `GET /content`, `GET /content/{id}`, `GET /content/{id}/status`
- [x] HLS files served via `StaticFiles` mount at `/media/{content_id}/master.m3u8`
- [x] Full pipeline verified end-to-end: upload → transcode → catalog → HTTP stream → VLC playback

### Phase 3 — Web frontend — COMPLETE
- [x] React + Vite scaffold in `apps/web`, wired into pnpm workspace
- [x] CORS enabled on backend for `localhost:5173`
- [x] `api/client.js` — axios instance, auto-attaches JWT via interceptor
- [x] Catalog page, Watch page (hls.js playback verified in browser)
- [x] Auth pages (register/login), backend `POST /content` requires JWT (verified 401 without token)
- [x] Upload page — authenticated upload, verified working
- [x] Auth state reactive via React Context — nav updates instantly on login/logout
- [x] Full authenticated flow verified: register → login → upload → transcode → catalog → play

### Phase 4 — Desktop (Electron) — CORE COMPLETE
- [x] Electron shell initialized in `apps/desktop`
- [x] `main.js` loads the Vite dev server (`localhost:5173`) in a BrowserWindow
- [x] Verified: catalog, login, and video playback all work correctly inside Electron window
- [ ] Production packaging (electron-builder → real installer) — DEFERRED, not needed for dev/testing

## Pending work (Phase 5 — next)
- [ ] React Native project init in `apps/mobile`
- [ ] Point mobile app at backend API (note: `localhost` won't work from a phone/emulator —
      needs machine's LAN IP or Android emulator's special `10.0.2.2` alias)
- [ ] Catalog screen (reuse API-call logic/patterns from web, not code directly — RN has no DOM)
- [ ] Video player screen — needs `react-native-video` (HLS support) since `hls.js` is
      browser-only and won't work in RN
- [ ] Auth screens (login/register), token storage via `AsyncStorage` (RN has no `localStorage`)
- [ ] Upload screen — RN file picker + upload

## Known issues / risks
- RESOLVED — Old unexplained nginx+ffmpeg+HLS failure: root cause dead, ffmpeg HLS generation
  confirmed working standalone (Windows via Git Bash, VLC playback verified 2026-07-16).
- Windows dev environment confirmed NOT a blocker for HLS itself. Only future Apple-specific
  blocker: testing on real iPhone / App Store publishing needs a Mac — deferred.
- Celery on Windows requires `--pool=solo` flag.
- `celery_app.py` needs `include=[...]` explicitly listing task modules.
- Relative file paths break depending on process cwd — fixed via absolute `media_storage_path`.
  Rule: always use `settings.media_storage_path`, never relative path strings.
- Content row `id=1` permanently stuck at `status=processing` — harmless pre-fix test data.
- `auth.js`/`client.js` circular import — works fine, flagged to avoid confusion later.
- Typed a literal placeholder string (`^latest-installed-version`) into `package.json` instead
  of the real electron version — caused a pnpm resolver error. Fixed by reading the actual
  version from `node_modules/electron/package.json`. Lesson: never hand-type version
  placeholders from instructions — always check the real installed value.

## Technical debt
- passlib dropped (unmaintained). Replaced with direct `bcrypt` calls in `core/security.py`.
- `transcode_video` does `-c copy` only — no real multi-resolution ladder yet.
  `content_variants` table exists but is unpopulated.
- No role field on `User` model — every registered user can upload. No admin/viewer distinction
  at the data layer yet, so UI role-gating isn't implemented (Upload button visible to all,
  backend correctly blocks unauthenticated requests with 401).
- Electron currently only runs in dev mode (loads live Vite server) — no production build/installer yet.

## Future improvements (explicitly deferred, not forgotten)
- "Easy tier" recommendations (trending, same-category)
- Turborepo — only if build times become a real problem
- S3-compatible object storage — local disk dev path structured to map to it later
- Real multi-resolution transcoding (populate `content_variants`)
- Role field on User model + role-based UI gating
- Redirect-to-login on protected routes when logged out
- Electron production packaging (electron-builder)

## Next recommended task
Init React Native in `apps/mobile`, get a minimal screen running in an emulator/device first
(prove the toolchain works) before wiring any API calls — mobile dev environments (Android
Studio/emulator setup) tend to have their own setup friction, isolate that before adding
app logic on top, same lesson as the earlier ffmpeg isolation approach.