# StreamFlix — Project Status

Solo-built Netflix-style streaming platform. Web + Mobile + Desktop, monorepo, FastAPI backend. Learning/portfolio project. DRM out of scope.

This document is the single source of truth for project state. It reflects one consistent current state.

---

## Completed Phases (0–22)

**Phase 0–9 (Web/Backend foundation):** Docker/FastAPI/Alembic/JWT auth, upload pipeline (Celery/ffmpeg HLS transcoding), React web frontend, Electron dev shell, React Native Android setup, catalog auto-refresh + JWT expiry handling, multi-resolution transcoding (1080p/720p/480p, skip-upscale), role-based access control (viewer/uploader/admin), Electron production packaging.

**Phase 10–17 (Feature expansion & Admin):** Manual quality-selector UI + HLS master playlist bugfix, accounts/profiles (two-step auth), series/seasons/episodes, watchlist/ratings (content-or-series), trending/similar (mixed movie+series `DiscoverItem` shape), admin role tier, search+categories.

**Phase 18 — UI Pass (Web, Desktop, Mobile) — COMPLETE:**
- **Web:** Login/Register, Profile Picker (marquee-ring avatar grid), Catalog, Theater Watch Layout, Series Detail, Upload, Admin panel.
- **Desktop:** Electron wrapper with dark titlebar, custom icon, autoHideMenuBar.
- **Mobile:** React Native App with profile switcher, poster rows, player quality controls, downloads UI.

**Phase 19 — Monorepo Architecture & Navigation Decomposition — COMPLETE:**
- Created shared packages `@streamflix/types`, `@streamflix/api-client`, and `@streamflix/ui`.
- Deconstructed overloaded Catalog into dedicated Home, Movies, Series, Categories, Search, My Space, Watchlist, History, Profile Management, and Settings screens across Web and Mobile.

**Phase 20 — Milestone Baseline Commit — COMPLETE:**
- Saved complete baseline release snapshot incorporating all Phase 19 features.

**Phase 21 — Scalable Storage & Streaming Pipeline Architecture — COMPLETE:**
- Single Master File Storage (1x disk footprint) + Zero-CPU 1080p Byte-Range streaming.
- On-Demand 20s chunk downscaling (720p/480p) with shared hot cache & automated LRU eviction.
- 30s debounced telemetry & seek/pause progress synchronization.

**Phase 22 — Production Packaging & Free Cloud Deployment Readiness — COMPLETE:**
- **Desktop Production Packaging**: Generated Windows Installer (`StreamFlix Setup 0.1.0.exe`) and portable executable via `electron-builder`.
- **Mobile Native Build Sync**: Fixed component name registration (`StreamFlix`) and aligned Kotlin (`MainActivity.kt`) / Swift (`AppDelegate.swift`) entry points.
- **Dynamic API Base URLs**: Removed hardcoded IP addresses from Mobile (`config.ts` and `client.ts`), supporting `AsyncStorage` override and dynamic fallback.
- **24/7 Render + Supabase Keep-Alive**: Implemented `/health` endpoint in FastAPI that executes `SELECT 1` on Supabase PostgreSQL. Pinging `/health` every 10–14 minutes via free cron keep-alive prevents Render inactivity sleep (15m) AND Supabase database pausing (7d).

---

## Current Roadmap State

All core development, cross-platform packaging, monorepo architecture, and cloud readiness phases are complete. The platform is ready for production deployment on Render and Supabase.