# LEARNING_ROADMAP.md

> Read `AI_COLLABORATION_RULES.md` first. Rules apply to all work on this project.

> **RULE FOR ANY AI/DEVELOPER:** Update this after every completed phase — new topics covered,
> new terminology introduced, resources used, and what's coming next. Keep it current.

---

## Topics covered so far (Phase 0 — Planning)

- Monorepo structure & why it matters for solo multi-platform dev
- pnpm vs npm (strict dependency resolution, workspace support)
- Monorepo (concept) vs Turborepo (tool) — not the same thing
- HLS (HTTP Live Streaming) — open spec, not Apple-exclusive; no auth/cert needed to create or serve
- FairPlay DRM vs HLS — DRM is optional and separate, only relevant for licensed content (not used here)
- Celery (task queue) + Redis (message broker) — why slow jobs (ffmpeg) must run off the request thread
- Polling vs WebSocket vs SSE — trade-offs for status updates
- React Native vs Flutter — code-sharing vs performance trade-off, why RN fits this project
- Why recommendation systems have an "easy tier" (SQL-based) vs "hard tier" (ML, out of scope here)
- Schema/serialization gap vs actual bug — same underlying data can be saved correctly but
  invisible if the Pydantic response model doesn't declare the field
- `replace: true` on navigate only rewrites one history entry — doesn't prevent multi-step
  back-button traversal. Correct pattern for auth-gated flows: check current auth state on
  mount and redirect forward, don't rely on history manipulation alone.
- FastAPI response models are a hard filter — a field can be saved correctly in the DB and
  still never appear in any response if the Pydantic schema doesn't declare it.
- Relative API paths (`/media/...`) only resolve correctly when frontend and backend share
  an origin. Vite dev server and FastAPI don't by default — any path returned by the backend
  meant to be loaded directly (images, media) needs to be resolved against the API's base URL
  explicitly, not assumed to work as a bare relative path.
- RN Stack Navigator sidesteps the web back-button auth-bypass problem entirely: swapping
  which screens exist in the stack (based on auth state) removes the old screens from
  history rather than just adding a new entry on top, so there's no equivalent to
- Phase 19: Shared monorepo packages (`@streamflix/types`, `@streamflix/api-client`, `@streamflix/ui`) for type safety and API client reuse across Web and Mobile.
- Phase 19: Offline HLS video download engine architecture in React Native (downloading master playlist -> variant playlist -> segment `.ts` chunks to local file storage).

## Terminology introduced
- **HLS/DASH** — adaptive bitrate streaming protocols (video split into chunks at multiple qualities)
- **Transcoding** — converting uploaded video into multiple resolutions/bitrates for streaming
- **Job queue / async worker** — background processing pattern (Celery + Redis)
- **Monorepo** — one repo, multiple apps/packages
- **BFF (Backend-for-Frontend)** — not used yet, may be relevant if mobile/web API needs diverge later
- **JWT (access + refresh tokens)** — stateless auth pattern for multi-platform clients

## Resources (search these — exact links not verified, search terms given)
- "FastAPI + Celery + Redis background tasks tutorial"
- "ffmpeg HLS transcoding tutorial" (search fresh — user's earlier attempt via old tutorial failed silently)
- "pnpm workspaces monorepo setup"
- "React Native share code with React web monorepo"
- Official docs (primary references, always prefer these over video tutorials):
  - FastAPI: https://fastapi.tiangolo.com
  - Celery: https://docs.celeryq.dev
  - ffmpeg HLS docs: https://ffmpeg.org/ffmpeg-formats.html#hls-2
  - pnpm workspaces: https://pnpm.io/workspaces

## Remaining concepts (upcoming phases)
- ffmpeg HLS flags in depth (segment duration, variant playlists, keyframe alignment)
- FastAPI + SQLAlchemy async session patterns
- Alembic migrations
- Celery worker deployment (separate process from API)
- hls.js (browser playback of HLS without native support)
- React Native video playback (react-native-video + HLS)
- Electron packaging basics

## Suggested next topic
Before any code: get a **single ffmpeg HLS conversion working locally, verified with VLC** —
this isolates the step that silently failed in the user's previous attempt, before any
backend/server complexity is layered on top.
