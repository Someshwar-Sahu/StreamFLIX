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

## Pending work (Phase 11 — not chosen yet)
- [ ] TBD

## Known issues / risks
- Pre-Phase-10 content has broken `RESOLUTION=?x{h}` metadata, shows "0p" in dropdown — unfixed
- Mobile backend URL hardcoded in `config.ts`, manual edit needed if LAN IP changes
- Mobile quality badge shows selected, not verified-active, track
- After machine restart: start Docker Desktop manually, then `start-dev.ps1`. Packaged .exe
  needs backend running separately (by design)

## Technical debt
- passlib dropped, using `bcrypt` directly
- Electron installer not standalone (needs backend running separately, by design)
- Mobile uses npm not pnpm; code-sharing web/mobile unsolved
- Icon is placeholder
- Old content has invalid resolution metadata (unfixed)

## Future improvements (deferred)
- "Easy tier" recommendations (trending, same-category)
- Turborepo (only if build times become a problem)
- S3-compatible storage
- Code-sharing strategy web/mobile
- Storage usage monitoring
- Admin role tier
- Mobile signed release build

## Next recommended task
Pick Phase 11 major+minor.