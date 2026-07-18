# PROJECT_STATUS.md

> Read `AI_COLLABORATION_RULES.md` first. Rules apply to all work on this project.

> **RULE FOR ANY AI/DEVELOPER:** This file must be updated at the end of every completed phase.
> Before starting any new work, read this file first to know exactly where the project stands.
> Never assume — check here.

---

## Current phase
**Phase 8: Role-based access — NOT STARTED**

## Completed work

### Phase 0 — Planning & Setup
- [x] Scope decided: Web + Mobile + Desktop from day one, solo dev, learning/portfolio project
- [x] No real/licensed content → DRM out of scope
- [x] Tech stack locked (see ARCHITECTURE.md §3)
- [x] Repo folder structure created (monorepo, pnpm workspaces)
- [x] Database schema v1 designed, API routes v1 designed
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
- [x] React + Vite, CORS enabled, JWT-authenticated API client
- [x] Catalog, Watch (hls.js), Login/Register, Upload pages
- [x] Full authenticated flow verified: register → login → upload → transcode → catalog → play

### Phase 4 — Desktop (Electron) — CORE COMPLETE
- [x] Electron shell loads the web dev server — same codebase, no duplicate implementation
      needed for any web feature (confirmed: auto-refresh and 401 handling apply automatically)
- [ ] Production packaging (electron-builder) — DEFERRED

### Phase 5 — Mobile (React Native) — COMPLETE
- [x] Full native Android toolchain working; mobile uses plain npm (excluded from pnpm
      workspace) due to pnpm/Metro incompatibility
- [x] Catalog, Watch (react-native-video HLS), Login/Register, Upload (react-native-image-picker)
- [x] Full feature parity confirmed across Web, Desktop, and Mobile
- [x] `start-dev.ps1` — launches uvicorn, Celery worker, Metro, adb reverse, web dev server,
      and Electron together (Docker Desktop started manually)

### Phase 6 — Polish & cross-cutting fixes — COMPLETE
- [x] Catalog auto-refresh (Web: focus/visibility; Mobile: `useFocusEffect`)
- [x] JWT expiry handling (Web + Mobile): 401 → auto-logout → redirect to login

### Phase 7 — Real adaptive transcoding + mobile config — COMPLETE
- [x] **Major:** Multi-resolution transcoding — ffmpeg now generates 1080p/720p/480p HLS
      renditions per upload (skips rungs above source resolution — never upscales)
- [x] `content_variants` table now populated per rendition (was previously unused)
- [x] Master `.m3u8` playlist references all successful variants; players (hls.js,
      react-native-video) automatically switch quality based on bandwidth — verified working
- [x] Raw uploaded source file deleted automatically after successful transcode (storage
      cleanup) — verified working
- [x] `DELETE /content/{id}` endpoint added — removes DB row + all associated files on disk
- [x] **Minor:** Mobile backend URL centralized into `src/config.ts` (single edit point instead
      of hunting across multiple files when LAN IP changes)
- [x] Confirmed: adaptive HLS streaming genuinely streams progressively in segments (not a
      full upfront download) — effect is most visible on longer videos, since short test clips
      only span 1-2 segments total

## Pending work (Phase 8 — next, planned)
- [ ] **Major:** Role-based access — add role field to `User` model (e.g. viewer/uploader/admin),
      restrict `POST /content` and `DELETE /content/{id}` to appropriate roles, add role-based
      UI gating (hide Upload button for viewers) on Web and Mobile
- [ ] **Minor:** TBD — pick a small item at the start of Phase 8 (e.g. clean up leftover
      pre-Phase-7 raw test files, or add a manual quality-selector UI now that adaptive
      streaming exists — deferred earlier per user's explicit request to add it "in its
      necessary step, not before")

## Known issues / risks
- RESOLVED — Old nginx+ffmpeg+HLS failure, Windows toolchain issues, pnpm+Metro incompatibility,
  catalog auto-refresh, JWT expiry handling — see full history in earlier phase entries if needed.
- Content rows `id=1` through `id=6` have orphaned raw files in `media_storage/raw/` (uploaded
  before the Phase 7 auto-cleanup fix existed) — harmless, can be manually deleted anytime.
- Backend API URL still requires a manual one-line edit (`src/config.ts`) when LAN/hotspot IP
  changes — improved from "hunt multiple files" but not fully automated (would need mDNS or a
  dev-tunnel service to solve completely; not worth the complexity at this scope).
- **Operational: after any machine restart**, start Docker Desktop manually, then run
  `start-dev.ps1` from repo root (now also handles `adb reverse` automatically, 3s after Metro
  starts — requires phone already connected via USB when the script runs).
- Master HLS playlist uses `RESOLUTION=?x{height}` (width omitted, ffmpeg's `scale=-2:height`
  doesn't expose final width back to our script) — technically slightly non-conformant HLS
  spec, but tolerated by both hls.js and react-native-video since `BANDWIDTH` drives quality
  selection, not the resolution string. Flagged as a known simplification, not a bug to fix
  urgently.

## Technical debt
- passlib dropped (unmaintained), replaced with direct `bcrypt` calls.
- No role field on `User` model yet — every registered user can currently upload and delete
  content; no admin/viewer distinction (this is exactly what Phase 8 addresses).
- Electron dev-mode only, no production installer yet.
- Mobile uses npm, not pnpm — intentional exception; code-sharing between web/mobile (original
  monorepo goal) still unsolved for mobile specifically.
- No manual quality-selector UI (adaptive switching is automatic-only for now) — explicitly
  deferred by design until a natural point in a future phase.

## Future improvements (explicitly deferred, not forgotten)
- "Easy tier" recommendations (trending, same-category)
- Turborepo — only if build times become a real problem
- S3-compatible object storage — local disk dev path structured to map to it later
- Role field on User model + role-based UI gating — **now the Phase 8 major task**
- Electron production packaging (electron-builder) — **planned for Phase 9**
- Solve code-sharing strategy between web and mobile (pnpm workspace vs npm split)
- Manual quality-selector UI (web: `hls.js` `currentLevel`; mobile: `react-native-video`
  `selectedVideoTrack`) — add "in its necessary step," per explicit prior instruction
- Storage usage visibility (disk usage tracking/display) — deferred until app is deployed to
  a real hosted environment with actual storage constraints, not needed on local dev
- Full cleanup of pre-Phase-7 orphaned raw files (`media_storage/raw/1_test.mp4` etc.)

## Next recommended task
Phase 8: add a `role` column to the `User` model (Alembic migration), default new users to
"viewer," manually promote at least one test account to "uploader" via direct DB update, then
restrict `POST /content` and `DELETE /content/{id}` by role — mirrors the JWT auth pattern
already proven working, just adds a role check on top.