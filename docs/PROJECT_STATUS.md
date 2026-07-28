# PROJECT_STATUS.md

> Read `AI_COLLABORATION_RULES.md` first. Rules apply to all work on this project.

> **RULE FOR ANY AI/DEVELOPER:** This file must be updated at the end of every completed phase.
> Before starting any new work, read this file first to know exactly where the project stands.
> Never assume — check here.

---

## Current phase
**Phase 18 — NOT STARTED (backend fully closed, UI pass begins here)**

## ⚠️ Critical architecture notes for whoever builds the UI
- **Auth is two-step, not one.** `POST /auth/login` returns an account-level token (no
  `profile_id` claim). Every profile-scoped endpoint (watch-history, watchlist, ratings,
  content/series details) requires a **second** call: `POST /profiles/{id}/select`, which
  returns a *different* token containing `profile_id`. The UI must implement a profile-picker
  screen after login (like Netflix) and re-authenticate with the selected profile's token
  before showing any content-personalized screen.
- **Movies and Series are separate entities**, not unified in the DB, but many endpoints
  return a unified `DiscoverItem` shape (`type`: "movie"|"series", `id`, `title`,
  `poster_url`) so the UI can render mixed rows without caring which one it is. Endpoints
  that do this: `GET /content/trending` (see below), `GET /content/{id}/similar`,
  `GET /series/{id}/similar`.
- **Watchlist/Ratings accept either `content_id` OR `series_id`**, never both — enforced by a
  DB check constraint. Sending both or neither is a 422/500, not silently accepted.
- **`GET /content/trending` returns three separate lists**, not one merged list:
  `{ movies: [...], series: [...], overall: [...] }` — each a `DiscoverItem[]`.
- **Detail/"middle" pages** are pre-built for the UI to consume directly:
  `GET /content/{id}/details` and `GET /series/{id}/details` each bundle rating summary,
  watchlist status, resume progress, and similar/episode data in one call.
- **Uploader/admin roles**, not just "uploader" — any UI gating on `role === "uploader"`
  must also allow `"admin"` (this bug still exists in the Web nav, listed below).
- **No test data has categories assigned yet** — all test content/series show `categories: {}`.
  `similar` will correctly return empty until real categories are assigned via
  `category_names` on upload/series-creation. Not a bug, just untested with real data.

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

### Phase 3 — Web frontend — COMPLETE (pre-dates accounts/profiles/series work — will need
      UI updates during Phase 18 to match current API shape)
- [x] React+Vite, JWT client, Catalog/Watch/Login/Upload pages, full flow verified

### Phase 4 — Desktop (Electron) — COMPLETE

### Phase 5 — Mobile (React Native) — COMPLETE (same caveat as Phase 3 — predates later API changes)
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
- [x] Bug fixed: master playlist `RESOLUTION=?x{h}` → real `ffprobe`-computed `WxH` (only new
      transcodes; old content still broken, unfixed)
- [x] Mobile: `selectedVideoTrack` chips (AUTO/RESOLUTION via `SelectedVideoTrackType` enum)
- [x] Minor: active quality badge — Web real (`LEVEL_SWITCHED` event), Mobile shows selected
      value only (RN has no reliable active-track-during-Auto event)
- [x] Verified real visual diff 1080p vs 480p via VLC — ladder confirmed correct

### Phase 11 — Watch history / Continue Watching — COMPLETE
- [x] **Major (Backend):** `watch_history` upsert via `ON CONFLICT`, `GET /watch-history`
      (continue-watching list), `DELETE /watch-history/{id}` + `DELETE /watch-history` (clear all)
- [x] **Bug fixed:** autogenerate silently dropped `UniqueConstraint` on first migration —
      added via hand-written migration. Lesson: always verify constraints landed in DB
      directly (`\d table_name`), don't trust `alembic current` alone.
- [x] **Major (Web):** Watch.jsx reports progress every 10s + on pause/unload, resumes from
      saved position. Catalog.jsx shows Continue Watching row with progress bar, Remove +
      Clear All buttons. **(NOTE: this endpoint shape has since changed — now keyed on
      `profile_id`, requires the two-step auth flow. Web/Mobile UI not yet updated to match.)**
- [x] **Major (Mobile):** Watch.tsx reports progress via `onProgress`/`onLoad`, resumes via
      `videoRef.seek()`. Known hack: resume value passed via a property on the component
      function itself — works but ugly, revisit if resume misbehaves.
- [x] **Bug fixed:** `HashRouter` redirect bug — 401 interceptor and Logout button used plain
      `/login` instead of `/#/login`, causing an infinite reload loop. Fixed both to `/#/login`.

### Phase 12 — Search, categories, discovery backend — COMPLETE
- [x] **Major:** Ranked title search (`GET /content?q=`) — exact match, then starts-with, then
      contains (no fuzzy/typo-tolerant matching — would need `pg_trgm`)
- [x] **Major:** Category system — many-to-many, `GET /categories`, `POST /categories`
      (uploader-only), upload accepts `category_names` (comma-separated names, not IDs),
      filter via `GET /content?category=` (repeatable, name-based, OR match)
- [x] **Bug fixed:** category filtering originally used a single FK + IDs — corrected to
      many-to-many + name-based (real requirement: multi-category videos, no ID exposure)
- [x] **Bug fixed:** first many-to-many migration didn't preserve existing data — corrected
      to migrate old values into the junction table before dropping the column
- [x] **Major:** `GET /content/{id}/similar` — same-category recommendations
- [x] **Bug fixed:** `get_similar` used `hasattr()` to short-circuit a lazy-load, which still
      triggered it anyway (async `MissingGreenlet`) — fixed via eager `selectinload`
- [x] Route-ordering rule: fixed-path routes (`/trending`, `/latest`) placed before
      `/{content_id}` to avoid FastAPI parsing them as an int path param
- [ ] **`GET /content/latest` is movie-only, doesn't surface new series — unresolved gap,
      carried forward, see Pending below**

### Phase 13 — Admin role tier — BACKEND DONE, NOT UI-VERIFIED
- [x] `require_uploader` accepts `admin` role too; `require_admin` dependency added
- [x] `GET /admin/users`, `PATCH /admin/users/{id}/role` (self-demotion guard)
- [x] First admin bootstrapped via direct DB update (chicken-egg problem, same as first uploader)
- [x] `GET /admin/storage` — total usage, per-content breakdown, raw-leftover detection
- [x] Verified end-to-end via PowerShell/`/docs` with real test data
- [ ] Admin panel UI deferred — no UI exists yet, by design (backend-first plan)

### Phase 14 — Accounts/Profiles architecture (Option A) — COMPLETE, VERIFIED
- [x] Full DB wipe + fresh single migration (accounts, profiles, categories, content,
      content_categories, content_variants, watch_history)
- [x] `users` table renamed to `accounts` (class name `User` kept unchanged for minimal churn)
- [x] New `Profile` model — `watch_history` (and later watchlist/ratings) key off `profile_id`,
      not `account_id` — each profile has fully separate history/list/ratings
- [x] Two-step auth flow (see architecture notes at top of this file)
- [x] Auto-creates one default profile on registration (named after username)
- [x] Profile limits enforced app-side: viewer max 3, uploader/admin max 1
- [x] Full flow verified via PowerShell: login → `GET /profiles` → `select` → profile token
      confirmed present → profile-scoped endpoint succeeds
- [ ] **Web UI nav still checks `role === "uploader"` only** — doesn't show Upload for admin.
      Unfixed intentionally (backend-first plan). Must fix during Phase 18.
- [ ] **Web/Mobile UI entirely unaware of the two-step auth flow** — will need a profile-picker
      screen added before any content screen, this is the biggest UI-architecture change needed.

### Phase 15 — Watchlist backend — COMPLETE, VERIFIED (see Phase 17 — later rescoped)
- [x] Original version: `Watchlist` model (`profile_id` + `content_id` only), upsert-safe add

### Phase 16 — Ratings backend — COMPLETE, VERIFIED (see Phase 17 — later rescoped)
- [x] Original version: `Rating` model (`profile_id` + `content_id` only), like/dislike
- [x] Bug fixed: `created_at` had `timezone.utc` object instead of callable default
- [x] `trending`/`similar` upgraded to factor in net-likes (later superseded by Phase 17's
      series-aware version)

### Phase 17 — Series/Seasons/Episodes — COMPLETE, VERIFIED
- [x] `Series`/`Season`/`Episode` models — episodes reuse the existing `Content` +
      transcode/HLS pipeline with zero duplication (an episode is just a `Content` row
      referenced by an `Episode`)
- [x] Series/season/episode CRUD + upload endpoints
- [x] Manual poster upload supported in upload code for both movies (`Content.thumbnail_url`)
      and series (`Series.poster_url`), served via existing `/media` static mount —
      **NOTE: never actually tested with a real image file; all test uploads so far have
      `poster_url`/`thumbnail_url` = null. Verify this works before relying on it in UI.**
- [x] Watchlist and Ratings rescoped from content-only to content-or-series via nullable dual
      FK + `CheckConstraint` (exactly one target) + partial unique indexes
- [x] Two new detail endpoints: `GET /content/{id}/details`, `GET /series/{id}/details`
- [x] **Bug fixed:** `CheckConstraint`s silently dropped by autogenerate (same class of issue
      as Phase 11) — added by hand, verified present via `\d`
- [x] **Bug fixed:** `ON CONFLICT` upserts failed on partial unique indexes — Postgres needs
      the arbiter's `index_where` to match exactly. Fixed on both watchlist and ratings.
- [x] **Bug fixed:** `WatchlistAddIn` schema had both fields as required `int` instead of
      `int | None = None` — Pydantic rejected requests before the validator ever ran.
- [x] **Gap fixed:** `trending`/`similar` were movie-only. Fixed:
  - `GET /content/trending` now returns `{ movies: [...], series: [...], overall: [...] }`
    (each `DiscoverItem[]`), scoring = `(recent views × 2) + net likes`, with episode views
    correctly summed back to their parent series
  - `GET /content/{id}/similar` and new `GET /series/{id}/similar` both return a mixed
    movie+series `DiscoverItem[]` list, matched by shared categories, ordered by net-likes
- [x] Verified end-to-end via PowerShell: series → season → episode upload/transcode → series
      detail → watchlist (series/movie/both) → ratings (series/movie, re-rate path) →
      trending (3-list shape) — all correct, no regressions to movie-only flow
- [x] **Closeout fix:** `GET /content/latest` was movie-only and didn't exclude episode rows
      (same bug class as trending pre-fix). Now returns `{ movies, series, overall }`
      (each `DiscoverItem[]`), episodes excluded, sorted by `created_at`.
- [x] **Bug fixed:** `ContentResponse` schema was missing `thumbnail_url` entirely — poster
      uploads were saving correctly but never serialized in any response (`/content`,
      `/content/{id}/details`). Added field to schema.
- [x] **Verified:** poster upload tested end-to-end (movie + series, real image file) —
      `thumbnail_url`/`poster_url` populate correctly, files serve via `/media`.

---

## Pending work (Phase 18 — UI pass)
- [ ] **Build profile-picker screen** (Web + Mobile) — required before any content screen can
      work, since every content-scoped endpoint needs the profile-select token
- [ ] **Fix Web nav role check** — `role === "uploader"` → must also allow `"admin"`
- [ ] Update Web/Mobile Catalog, Watch, Upload pages to match current API (profile-scoped
      watch-history/watchlist, category tags, poster images)
- [ ] Build Series browsing UI — series list, series detail page (seasons/episodes), episode
      player
- [ ] Build search bar + category filter UI
- [ ] Build admin panel UI (users list/role change, storage usage)
- [ ] Search autocomplete (small, was deferred to this phase from the start)
## Current phase
**Phase 18 — COMPLETE (Web UI pass)**

### Phase 18 summary
- [x] Login/Register — redesigned, cinematic card layout, auth-state guard redirects
- [x] Profile Picker — built new, marquee-ring avatar grid, 8 default illustrated avatars,
      staggered entrance animation, hard state-based guard against back-button bypass
- [x] Nav bar — hidden on `/login` and `/profiles`; admin role added to Upload link visibility
- [x] Catalog — rebuilt: search + category filter, Trending row, Continue Watching row
      (with remove/clear), Movies grid, Series grid, all poster-card based
- [x] Watch — theater layout, watchlist/like/dislike controls wired to backend, styled
      quality selector
- [x] Series Detail — built new (didn't exist before): hero + season/episode list,
      per-episode progress, watchlist/rating controls
- [x] Upload — rebuilt as tabbed Movie / Series wizard (create series → season → episodes),
      poster + category fields added (previously missing from UI entirely)
- [x] Admin panel — built new: user role management table, storage usage dashboard

### Design system established (for Mobile/Desktop parity later)
- Palette: `#0D1117` void / `#171B24` elevated / `#F2A93B` amber accent / `#2EC4B6` teal
  secondary / `#F5F5F0` text / `#8A8F98` muted
- Type: Clash Display (headings) + Inter (body/UI)
- Signature motif: amber "marquee-bulb" ring on avatars/cards, lights up on hover/select
- Motion: staggered rise-in on grids, respects `prefers-reduced-motion`

## Pending work
- [ ] Manual QA pass across all Phase 18 screens (not yet done)
- [ ] Desktop (Electron) — should inherit Web build near-free, verify after QA
- [ ] Mobile UI pass — own design pass next, React Native equivalents of above screens
### Phase 18 — Mobile UI pass (complete)
- [x] Two-step auth (profile token) ported to mobile: `AuthContext`, `client.js`, `auth.js`
      extended to mirror Web; `App.tsx` navigator gates Login → ProfilePicker → main stack
      by swapping the entire Stack.Navigator screen set (no back-button history bug possible
      here, unlike Web — RN Stack doesn't share history across auth states)
- [x] ProfilePicker — built new: colored-circle + initial-letter avatars (no react-native-svg
      dependency added, avoids native rebuild pain per known Android env friction), staggered
      fade-in via Animated API
- [x] Catalog — rebuilt: search, category chips, Trending row, Continue Watching row, Movies
      row, Series row, all via new `PosterCard` RN component
- [x] Watch — video/resume/progress logic untouched (was already solid), added
      watchlist/like/dislike pill row + restyled quality chips to match theme
- [x] SeriesDetail — built new (didn't exist before): hero, season/episode list,
      watchlist/rating controls, episode tap → Watch screen
- [x] Upload — rebuilt as tabbed Movie / Series wizard using existing
      `react-native-image-picker` for both video and poster (no new dependency)
- [x] Admin — built new: user role chips, storage stat cards
- [x] **Bug fixed (caught here, also affected Web):** `/media/...` paths from backend are
      relative. Web's `PosterCard`/`SeriesDetail` were using them directly as `<img src>`,
      resolving against the Vite dev server instead of the backend — posters were silently
      broken on Web. Added `resolveMediaUrl()` helper on both Web (`api/media.js`) and
      Mobile (`api/media.ts`) that prefixes the backend base URL.

## Current phase
**Phase 18 — COMPLETE across Web, Desktop, Mobile**

## Pending work
- [ ] Manual QA pass across all screens, all three platforms (not yet done — user is testing
      tomorrow morning)
- [ ] Confirm the media-URL fix actually resolves posters correctly once tested

## Known issues / risks
- Pre-Phase-10 content has broken `RESOLUTION=?x{h}` metadata, shows "0p" in dropdown — unfixed
- Mobile backend URL hardcoded in `config.ts`, manual edit needed if LAN IP changes
- Mobile quality badge shows selected, not verified-active, track
- After machine restart: start Docker Desktop manually, then `start-dev.ps1`. Packaged .exe
  needs backend running separately (by design)
- Mobile resume-seek uses a function-object hack instead of clean state — technical debt
- Category name matching is exact/case-sensitive — fine for dropdown-driven UI, would need
  normalization if free-text category input is ever allowed
- Trending needs real multi-user data to be meaningful — not a bug, a data problem
- `GET /admin/storage` does a synchronous `os.walk` scan per request — fine at current scale
- **All current Web/Mobile UI code predates Phases 14–17** (accounts/profiles, watchlist,
  ratings, series) — expect to rewrite most pages, not just patch them

## Technical debt
- passlib dropped, using `bcrypt` directly
- Electron installer not standalone (needs backend running separately, by design)
- Mobile uses npm not pnpm; code-sharing web/mobile unsolved
- Icon is placeholder
- Old content has invalid resolution metadata (unfixed)
- Mobile Watch.tsx resume logic uses a hack — refactor if it ever misbehaves
- No fuzzy/typo-tolerant search (would need `pg_trgm`)

## Future improvements (deferred)
- Turborepo (only if build times become a problem)
- S3-compatible storage
- Code-sharing strategy web/mobile
- Storage usage monitoring dashboard polish
- Mobile signed release build

## Next recommended task
Start Phase 18 with the profile-picker screen (Web first) — this unblocks every other UI page,
since nothing content-related works without it. Verify poster upload early too, since it's
central to the visual design. Then proceed page by page: Catalog (movies+series+categories) →
Watch (movie) → Series detail/episode player → Upload (movie/series toggle) → Admin panel.