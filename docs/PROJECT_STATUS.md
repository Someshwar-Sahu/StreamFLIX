# PROJECT_STATUS.md

> Read `AI_COLLABORATION_RULES.md` first. Rules apply to all work on this project.

> **RULE FOR ANY AI/DEVELOPER:** This file must be updated at the end of every completed phase.
> Before starting any new work, read this file first to know exactly where the project stands.
> Never assume — check here.

---

## Current phase
**Phase 10 — Not yet planned**

## Completed work

### Phase 0 — Planning & Setup
- [x] Scope decided: Web + Mobile + Desktop from day one, solo dev, learning/portfolio project
- [x] No real/licensed content → DRM out of scope
- [x] Tech stack locked (see ARCHITECTURE.md §3)
- [x] Repo folder structure, root config files, DB schema v1, API routes v1
- [x] Docs initialized: ARCHITECTURE.md, LEARNING_ROADMAP.md, PROJECT_STATUS.md, AI_COLLABORATION_RULES.md
- [x] git init + first commit
- [x] ffmpeg installed and verified — HLS generation + VLC playback confirmed

### Phase 1 — Backend foundation
- [x] Docker (Postgres 16 + Redis 7) running locally, data relocated to E: drive
- [x] FastAPI skeleton, Alembic migrations (User, Content, ContentVariant, WatchHistory)
- [x] `/auth/register` + `/auth/login` — JWT-based, verified working
- [x] Celery + Redis task queue verified working end-to-end (Windows, `--pool=solo`)

### Phase 2 — Content upload + transcode pipeline — COMPLETE
- [x] `POST /content`, `GET /content`, `GET /content/{id}`, `GET /content/{id}/status`
- [x] HLS served via `StaticFiles` mount at `/media/{content_id}/master.m3u8`
- [x] Full pipeline verified end-to-end: upload → transcode → catalog → stream → playback

### Phase 3 — Web frontend — COMPLETE
- [x] React + Vite, CORS, JWT-authenticated API client
- [x] Catalog, Watch (hls.js), Login/Register, Upload pages
- [x] Full authenticated flow verified: register → login → upload → transcode → catalog → play

### Phase 4 — Desktop (Electron) — COMPLETE
- [x] Electron shell loads production build (see Phase 9 for packaging)

### Phase 5 — Mobile (React Native) — COMPLETE
- [x] Full native Android toolchain working; mobile uses plain npm (excluded from pnpm workspace)
- [x] Catalog, Watch (react-native-video HLS), Login/Register, Upload (react-native-image-picker)
- [x] Full feature parity confirmed across Web, Desktop, and Mobile
- [x] `start-dev.ps1` — launches uvicorn, Celery worker, Metro, adb reverse, web dev server,
      and Electron together (Docker Desktop started manually)

### Phase 6 — Polish & cross-cutting fixes — COMPLETE
- [x] Catalog auto-refresh (Web: focus/visibility; Mobile: `useFocusEffect`)
- [x] JWT expiry handling (Web + Mobile): 401 → auto-logout → redirect to login

### Phase 7 — Real adaptive transcoding + mobile config — COMPLETE
- [x] **Major:** Multi-resolution transcoding (1080p/720p/480p, skip-upscale), `content_variants`
      populated, master playlist auto quality-switching verified working
- [x] Raw source auto-deleted post-transcode; `DELETE /content/{id}` endpoint added
- [x] **Minor:** Mobile backend URL centralized into `src/config.ts`

### Phase 8 — Role-based access — COMPLETE
- [x] **Major:** `role` column on User (viewer/uploader), JWT includes role, `POST /content` +
      `DELETE /content/{id}` restricted via `require_uploader` dependency — verified 403 for
      viewers, success for uploaders, on both Web and Mobile. UI gating (Upload button hidden
      for viewers) implemented on both platforms.
- [x] **Minor:** Cleaned up leftover pre-Phase-7 orphaned raw test files from `media_storage/raw/`

### Phase 9 — Electron production packaging — COMPLETE
- [x] **Major:** Real installable `.exe` via `electron-builder` (NSIS installer)
  - `main.js` uses `app.isPackaged` (not `NODE_ENV`) to distinguish dev vs production loading
  - Vite `base: './'` fix — resolves asset-path issues under `file://` loading
  - Switched React Router from `BrowserRouter` to `HashRouter` — required for `file://`-based
    routing to work (affects Web too, URLs now use `/#/path` style, no functional downside)
  - Verified end-to-end: installer builds → installs cleanly → loads bundled production web
    build → talks to backend → catalog populates → playback works
- [x] **Minor (all three folded in together):**
  - Automated the web-build copy step: `build-web.js` + `prebuild` script — `pnpm build` now
    does build+copy+package in one command, no more manual multi-step copying (which had
    caused a stale nested-folder bug earlier)
  - Added `description` + `author` fields to `package.json` (removed electron-builder warnings)
  - Added a custom app icon (`icon.ico`, simple dark background + play-triangle placeholder)
- [x] Explored auto-starting backend processes (Docker/uvicorn/Celery) from within Electron's
      main process for local dev convenience — attempt failed and was reverted; `main.js` is
      back to the clean, working version. `start-dev.ps1` remains the correct way to start the
      full stack; not worth revisiting unless a real need arises.

## Pending work (Phase 10 — not yet planned)
- [ ] To be decided — see Future improvements below for backlog options

## Known issues / risks
- RESOLVED — Old nginx+ffmpeg+HLS failure, Windows toolchain issues, pnpm+Metro incompatibility,
  catalog auto-refresh, JWT expiry handling, production packaging asset/routing bugs — see
  earlier phase entries for full history if ever needed.
- Backend API URL still requires a manual one-line edit (`apps/mobile/src/config.ts`) when
  LAN/hotspot IP changes.
- **Operational: after any machine restart**, start Docker Desktop manually, then run
  `start-dev.ps1` from repo root (handles uvicorn, Celery, Metro, adb reverse, web dev server,
  and Electron dev mode together). The packaged/installed StreamFlix.exe still requires the
  backend stack to be running separately (Docker + uvicorn + Celery) — it does NOT bundle or
  auto-start the backend; this is intentional (see Phase 9 notes on why full backend-bundling
  was deemed out of scope).
- Master HLS playlist omits exact width in `RESOLUTION=?x{height}` tag — tolerated by both
  hls.js and react-native-video, flagged as a known simplification.

## Technical debt
- passlib dropped (unmaintained), replaced with direct `bcrypt` calls.
- Electron installer assumes the backend is started separately — not a fully standalone
  distributable (by design; see Known issues above).
- Mobile uses npm, not pnpm — intentional exception; code-sharing between web/mobile (original
  monorepo goal) still unsolved for mobile specifically.
- No manual quality-selector UI yet (adaptive switching is automatic-only) — still deferred,
  per explicit instruction to add "in its necessary step."
- App icon is a simple placeholder (dark background + play triangle) — swap with real branding
  if/when desired.

## Future improvements (explicitly deferred, not forgotten)
- "Easy tier" recommendations (trending, same-category)
- Turborepo — only if build times become a real problem
- S3-compatible object storage — local disk dev path structured to map to it later
- Solve code-sharing strategy between web and mobile (pnpm workspace vs npm split)
- Manual quality-selector UI (web: `hls.js` `currentLevel`; mobile: `react-native-video`
  `selectedVideoTrack`)
- Storage usage visibility/monitoring — deferred until deployed to a real hosted environment
- Admin role tier (beyond current viewer/uploader) if ever needed
- Mobile production build (currently only tested via `run-android` debug build — no signed
  release APK/AAB has been built yet, unlike desktop which now has a real installer)

## Next recommended task
No single next phase is locked in yet — pick from Future improvements above based on what's
most valuable to learn or ship next. Following the established "one major + one minor per
phase" approach has worked well through Phases 7–9; recommend continuing that pattern.