# PROJECT_STATUS.md

> Read `AI_COLLABORATION_RULES.md` first. Rules apply to all work on this project.

> **RULE FOR ANY AI/DEVELOPER:** This file must be updated at the end of every completed phase.
> Before starting any new work, read this file first to know exactly where the project stands.
> Never assume — check here.

---

## Current phase
**Phase 11 — NOT STARTED**

## Completed work

### Phase 0 — Planning & Setup
- [x] Scope: Web+Mobile+Desktop, solo dev, no DRM, tech stack locked
- [x] Repo structure, DB schema v1, API routes v1, docs initialized, git init
- [x] ffmpeg verified (HLS + VLC)

### Phase 1 — Backend foundation
- [x] Docker (Postgres 16 + Redis 7), FastAPI skeleton, Alembic migrations
- [x] `/auth/register` + `/auth/login` JWT verified
- [x] Celery+Redis verified (`--pool=solo` Windows)

### Phase 2 — Content upload + transcode pipeline — COMPLETE
- [x] `POST/GET/DELETE /content`, HLS via `StaticFiles`, full pipeline verified

### Phase 3 — Web frontend — COMPLETE
- [x] React+Vite, JWT client, Catalog/Watch/Login/Upload pages, full flow verified

### Phase 4 — Desktop (Electron) — COMPLETE

### Phase 5 — Mobile (React Native) — COMPLETE
- [x] Native Android toolchain (npm, excluded from pnpm workspace)
- [x] Catalog/Watch/Login/Upload, full parity with Web/Desktop
- [x] `start-dev.ps1` launches full stack

### Phase 6 — Polish — COMPLETE
- [x] Catalog auto-refresh (Web+Mobile), JWT expiry auto-logout

### Phase 7 — Real adaptive transcoding + mobile config — COMPLETE
- [x] Multi-res transcode (1080/720/480, skip-upscale), `content_variants` populated
- [x] Raw file cleanup, `DELETE /content/{id}`
- [x] Mobile URL centralized in `config.ts`

### Phase 8 — Role-based access — COMPLETE
- [x] `role` column, JWT role claim, `require_uploader` (403 + UI gating) verified both platforms

### Phase 9 — Electron production packaging — COMPLETE
- [x] NSIS installer, `app.isPackaged`, `HashRouter`, full install→launch→play verified
- [x] `build-web.js` prebuild automation, icon, metadata
- [x] Bundled-backend attempt failed/reverted — by design, not a gap

### Phase 10 — Manual quality-selector UI — COMPLETE
- [x] Web: hls.js dropdown, forces `hls.currentLevel`
- [x] Bug fixed: master playlist `RESOLUTION=?x{h}` → real `ffprobe`-computed `WxH`
      (only new transcodes; old content still broken, unfixed)
- [x] Mobile: `selectedVideoTrack` chips (AUTO/RESOLUTION via `SelectedVideoTrackType` enum)
- [x] Minor: active quality badge — Web real (`LEVEL_SWITCHED` event), Mobile shows selected
      value only (RN has no reliable active-track-during-Auto event)
- [x] Verified real visual diff 1080p vs 480p via VLC — ladder confirmed correct

### Phase 11 — Watch history / Continue Watching — COMPLETE
- [x] **Major (Backend):** `watch_history` upsert via `ON CONFLICT`, `GET /watch-history`
      (continue-watching list), `DELETE /watch-history/{id}` + `DELETE /watch-history` (clear all)
- [x] **Bug fixed:** autogenerate silently dropped `UniqueConstraint(user_id, content_id)` on
      first migration — added via a hand-written migration (`90989a8e8286`) since autogenerate
      can silently miss constraints when combined with other model changes. Lesson: always
      verify constraints landed in DB directly (`\d table_name`), don't trust `alembic current`
      alone.
- [x] **Major (Web):** Watch.jsx reports progress every 10s + on pause/unload, resumes from
      saved position on load. Catalog.jsx shows Continue Watching row with progress bar,
      Remove + Clear All buttons.
- [x] **Major (Mobile):** Watch.tsx reports progress via `onProgress`/`onLoad`, resumes via
      `videoRef.seek()`. Catalog.tsx shows Continue Watching section with progress bar + Remove.
      Known hack: resume value passed via a property on the component function itself to avoid
      an async-fetch/onLoad race — works but ugly, revisit if resume ever misbehaves.
- [x] **Bug fixed:** `HashRouter` redirect bug — 401 interceptor and Logout button on Web used
      plain `/login` instead of `/#/login`, causing an infinite reload loop (browser 404 → full
      reload → remount → 401 again). Fixed both to use `/#/login`.

### Phase 12 — Search, categories, discovery backend — COMPLETE
- [x] **Major:** Ranked title search (`GET /content?q=`) — exact match, then starts-with, then
      contains, via SQL `CASE` priority ordering (no `pg_trgm`/fuzzy match — flagged as future
      option if typo-tolerance ever needed)
- [x] **Major:** Category system — many-to-many (`Category` model, `content_categories`
      junction table), `GET /categories`, `POST /categories` (uploader-only), upload accepts
      `category_names` (comma-separated names, not IDs), filter via `GET /content?category=`
      (repeatable param, name-based, OR match)
- [x] **Bug fixed:** initial category design used a single FK + IDs — corrected to
      many-to-many + name-based filtering per real requirement (one video can have multiple
      categories; API consumers shouldn't need to know category IDs)
- [x] **Bug fixed:** first migration attempt for many-to-many didn't preserve existing data —
      corrected migration migrates old single `category_id` values into the junction table
      before dropping the column
- [x] **Major:** `GET /content/trending` — distinct-viewer count via `watch_history` in last N
      days (default 7). Known limitation (not a bug): looks sparse/empty with few real users —
      cold-start data problem, resolves naturally once there's real multi-user traffic. Correctly
      does NOT count repeat views by the same user (thanks to Phase 11's unique constraint).
- [x] **Major:** `GET /content/latest` — pure `created_at DESC`, no watch-history dependency,
      always meaningful regardless of user count
- [x] **Major:** `GET /content/{id}/similar` — same-category recommendations, excludes self,
      ready-only
- [x] **Bug fixed:** `get_similar` used `hasattr()` to short-circuit a lazy-load, which still
      triggered the lazy-load anyway — async SQLAlchemy can't lazy-load outside an awaited
      context (`MissingGreenlet`). Fixed by always eager-loading via `selectinload` up front.
- [x] Route-ordering rule applied consistently: `/trending` and `/latest` both placed before
      `/{content_id}` in the router to avoid FastAPI matching them as an int path param

## Known issues / risks
- Pre-Phase-10 content has broken `RESOLUTION=?x{h}` metadata, shows "0p" in dropdown — unfixed
- Mobile backend URL hardcoded in `config.ts`, manual edit needed if LAN IP changes
- Mobile quality badge shows selected, not verified-active, track
- After machine restart: start Docker Desktop manually, then `start-dev.ps1`. Packaged .exe
  needs backend running separately (by design)
- Mobile resume-seek uses a function-object hack instead of clean state — flagged as technical
  debt, not blocking.
- (all previously listed issues unchanged — see earlier phase entries)
- (all previous entries unchanged)
- Category name matching is exact/case-sensitive (`Category.name.in_(...)`) — fine for a
  dropdown-driven UI sourced from `GET /categories`, would need normalization if free-text
  category input is ever allowed
- Trending endpoint needs real multi-user data to be meaningful — not a bug, a data problem

## Technical debt
- passlib dropped, using `bcrypt` directly
- Electron installer not standalone (needs backend running separately, by design)
- Mobile uses npm not pnpm; code-sharing web/mobile unsolved
- Icon is placeholder
- Old content has invalid resolution metadata (unfixed)
- (previous entries unchanged, adding:)
- Mobile Watch.tsx resume logic uses `(Watch as any)._resumeSeconds` hack — should be refactored
  to proper state/ref-based gating if it ever causes resume bugs.
- (previous entries unchanged)
- No fuzzy/typo-tolerant search (would need `pg_trgm` extension) — exact/prefix/contains only

## Future improvements (deferred)
- "Easy tier" recommendations (trending, same-category)
- Turborepo (only if build times become a problem)
- S3-compatible storage
- Code-sharing strategy web/mobile
- Storage usage monitoring
- Admin role tier
- Mobile signed release build

## Pending work (Phase 13 — not yet started)
- [ ] Not yet chosen

## Next recommended task
Pick Phase 13 major+minor.