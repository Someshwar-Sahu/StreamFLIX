# PROJECT_STATUS.md

> Read `AI_COLLABORATION_RULES.md` first. Rules apply to all work on this project.

> **RULE FOR ANY AI/DEVELOPER:** This file must be updated at the end of every completed phase.
> Before starting any new work, read this file first to know exactly where the project stands.
> Never assume — check here.

---

## Current phase
**Phase 0: Planning & Setup — COMPLETE**

## Completed work
- [x] Scope decided: Web + Mobile + Desktop from day one, solo dev, learning/portfolio project
- [x] No real/licensed content → DRM out of scope
- [x] Tech stack locked (see ARCHITECTURE.md §3)
- [x] Repo folder structure created (monorepo, pnpm workspaces)
- [x] Root config files created: `pnpm-workspace.yaml`, `package.json`, `.gitignore`, `README.md`
- [x] Database schema v1 designed
- [x] API routes v1 designed
- [x] Docs initialized: ARCHITECTURE.md, LEARNING_ROADMAP.md, PROJECT_STATUS.md

## Pending work (next up — Phase 1 candidates)
- [ ] `git init` + first commit
- [ ] Verify ffmpeg installed locally, generate one test HLS file, confirm plays in VLC
      (isolated test — before any backend/server involvement, per prior failed attempt)
- [ ] `docker-compose.yml` for Postgres + Redis (local dev)
- [ ] FastAPI skeleton: `app/main.py`, `core/config.py`, DB connection
- [ ] Alembic init + first migration (users, content, content_variants, watch_history tables)
- [ ] Basic `/auth/register` + `/auth/login` endpoints

## Known issues / risks
- User previously attempted nginx+ffmpeg+HLS manually (Linux, Docker) — did not work, root cause
  unknown (no logs from that attempt). Mitigation: this build isolates ffmpeg → HLS as its own
  standalone testable step before wiring into FastAPI/Celery, so failures surface with clear
  Python errors instead of silent nginx failures.
- Windows dev environment — confirmed NOT a blocker for HLS itself (open spec, ffmpeg is
  cross-platform). Only future Apple-specific blocker: testing on real iPhone / App Store
  publishing needs a Mac — deferred, not relevant to current phases (Android + Web + Desktop first).

## Technical debt
- None yet (pre-implementation).

## Future improvements (explicitly deferred, not forgotten)
- "Easy tier" recommendations (trending, same-category) — schema already supports it, add once
  seed content + some watch_history exists
- Turborepo — only if/when build times become a real problem
- S3-compatible object storage — local disk dev path is structured to map to it later

## Next recommended task
Set up `docker-compose.yml` (Postgres + Redis) and do the isolated ffmpeg→HLS→VLC test
*before* writing any FastAPI code. This directly addresses the known risk above.
