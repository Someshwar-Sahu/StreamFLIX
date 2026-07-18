# PROJECT_STATUS.md

> Read `AI_COLLABORATION_RULES.md` first. Rules apply to all work on this project.

> **RULE FOR ANY AI/DEVELOPER:** This file must be updated at the end of every completed phase.
> Before starting any new work, read this file first to know exactly where the project stands.
> Never assume — check here.

---

## Current phase
**Phase 6: Polish & cross-cutting fixes — NOT STARTED**

## Completed work

### Phase 0 — Planning & Setup
- [x] Scope decided: Web + Mobile + Desktop from day one, solo dev, learning/portfolio project
- [x] No real/licensed content → DRM out of scope
- [x] Tech stack locked (see ARCHITECTURE.md §3)
- [x] Repo folder structure created (monorepo, pnpm workspaces)
- [x] Root config files created
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
- [x] `transcode_video` Celery task — ffmpeg `-c copy` → HLS output
- [x] `POST /content`, `GET /content`, `GET /content/{id}`, `GET /content/{id}/status`
- [x] HLS served via `StaticFiles` mount at `/media/{content_id}/master.m3u8`
- [x] Full pipeline verified end-to-end: upload → transcode → catalog → stream → VLC playback

### Phase 3 — Web frontend — COMPLETE
- [x] React + Vite scaffold, CORS enabled, JWT-authenticated API client
- [x] Catalog, Watch (hls.js), Login/Register, Upload pages
- [x] Reactive auth state via React Context
- [x] Full authenticated flow verified: register → login → upload → transcode → catalog → play

### Phase 4 — Desktop (Electron) — CORE COMPLETE
- [x] Electron shell loads the web dev server, verified working (catalog, login, playback)
- [ ] Production packaging (electron-builder) — DEFERRED

### Phase 5 — Mobile (React Native) — COMPLETE
- [x] Full native Android toolchain working (JDK path via `gradle.properties`, SDK path via
      `local.properties`, mobile excluded from pnpm workspace — uses plain npm due to
      pnpm/Metro bundler incompatibility)
- [x] Backend made LAN-reachable (`--host 0.0.0.0`, relaxed CORS for dev, phone+PC same
      hotspot network, confirmed via `/health` from phone browser)
- [x] Catalog screen — fetches `GET /content`, tappable items (disabled unless status=ready)
- [x] Navigation (`@react-navigation`) — Catalog → Watch → Upload flow
- [x] Watch screen — `react-native-video` HLS playback, verified working on physical device
- [x] Auth screens (Login/Register), JWT persisted via `AsyncStorage`, auth-gated navigation
- [x] Logout button, verified returns to Login screen
- [x] Upload screen — swapped `react-native-document-picker` (incompatible with new RN
      architecture, broke native build) for `react-native-image-picker` (well-maintained,
      works correctly) — file picker + authenticated `POST /content`, verified working
- [x] Full feature parity confirmed across Web, Desktop, and Mobile — matches the original
      Phase 0 architectural goal
- [x] **Dev workflow automation**: `start-dev.ps1` at repo root launches uvicorn, Celery
      worker, Metro, and web dev server each in their own terminal window, plus auto-launches
      Electron after a 5s delay (waits for web dev server to be ready first). Docker Desktop
      still started manually (it's a GUI app, not a background service the script controls).

## Pending work (Phase 6 — next, polish/cross-cutting)
- [ ] Catalog auto-refresh — currently only fetches once on mount, no refresh after upload or
      on interval (affects Web AND Mobile). Needs pull-to-refresh (mobile) and/or refetch-on-
      focus (both platforms) at minimum.
- [ ] JWT expiry handling — token expires after 1hr server-side, but no client-side interceptor
      catches a 401 and redirects to login (affects Web AND Mobile). Currently fails silently.

## Known issues / risks
- RESOLVED — Old nginx+ffmpeg+HLS failure: root cause dead, confirmed working standalone.
- Windows dev environment confirmed NOT a blocker for HLS. iPhone/App Store testing needs a
  Mac — deferred.
- Celery on Windows requires `--pool=solo` flag; `celery_app.py` needs explicit `include=[...]`.
- Relative file paths break depending on process cwd — fixed via absolute `media_storage_path`.
- Content row `id=1` permanently stuck at `status=processing` — harmless pre-fix test data.
- Backend API URL is hardcoded to a LAN IP in mobile's `api/client.js` and `Watch.tsx` — will
  break if hotspot/network IP changes (already happened once, caused a confusing "catalog
  empty + upload fails silently" symptom that was actually just a stale IP + Docker not running
  after a machine restart). Needs a real config solution before this becomes a recurring
  annoyance.
- **Operational: after any machine restart, these must be manually restarted (nothing
  auto-starts):** Docker Desktop (GUI app, start manually), then run `start-dev.ps1` from repo
  root to launch uvicorn, Celery worker, Metro, web dev server, and Electron together.
- Catalog does not auto-refresh after upload or periodically — user must manually navigate
  away and back, or restart the app, to see updated transcode status. Affects Web and Mobile.
- Expired JWT (1hr) is not detected/handled client-side — no global 401 interceptor exists yet
  on Web or Mobile; user experiences silent failures rather than being prompted to re-login.
- **Android/Windows toolchain fixes** (all resolved, kept for reference):
  - Android Studio installer naming mixup between IDE folder and SDK folder — mapped correctly.
  - Windows System PATH loads before User PATH, old Java 8 always won — worked around via
    `gradle.properties` (`org.gradle.java.home`) instead of fighting global PATH.
  - `adb` PATH resolution unreliable in terminal sessions — worked around using adb's full
    path directly when needed; does not block anything.
  - pnpm + Metro bundler incompatibility — resolved by excluding `apps/mobile` from the pnpm
    workspace, using plain npm for it instead.
  - `react-native-document-picker` incompatible with current RN architecture (native compile
    failure) — replaced with `react-native-image-picker`.

## Technical debt
- passlib dropped (unmaintained), replaced with direct `bcrypt` calls.
- `transcode_video` does `-c copy` only — no real multi-resolution ladder; `content_variants`
  table unpopulated.
- No role field on `User` model — every registered user can upload; no admin/viewer UI gating.
- Electron dev-mode only, no production installer yet.
- Mobile (`apps/mobile`) uses npm, not pnpm — intentional exception, documented above. Code
  sharing between web and mobile (the original point of the monorepo) is not yet solved for
  mobile specifically.
- Mobile/Watch screen backend URL hardcoded (see Known issues above).
- No catalog auto-refresh, no client-side JWT expiry handling (see Pending work above).

## Future improvements (explicitly deferred, not forgotten)
- "Easy tier" recommendations (trending, same-category)
- Turborepo — only if build times become a real problem
- S3-compatible object storage — local disk dev path structured to map to it later
- Real multi-resolution transcoding (populate `content_variants`)
- Role field on User model + role-based UI gating
- Electron production packaging (electron-builder)
- Solve code-sharing strategy between web and mobile (pnpm workspace vs npm split)
- Config-based (not hardcoded) backend URL for mobile
- Pull-to-refresh / refetch-on-focus for catalog (both platforms)
- Global 401 handling → auto-logout + redirect to login on token expiry (both platforms)

## Next recommended task
Phase 6: fix catalog auto-refresh and JWT expiry handling — both are small, well-understood
fixes that noticeably improve the app's real-world usability, and both affect Web and Mobile
simultaneously so they're efficient to tackle together.