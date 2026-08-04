# Phase 21 Implementation Plan — Scalable Storage, Hybrid Transcoding & Infrastructure Pipeline

Following the architectural decisions and technical discussion, this document outlines the execution plan for **Phase 21**. 

Phase 21 optimizes StreamFlix's video delivery engine to support **scalable storage (1x master file overhead)**, **zero-CPU 1080p byte-range streaming**, **on-demand 20-second chunk downscaling (720p/480p)**, **automatic LRU storage cache eviction**, **cloud egress-free deployment**, and **event-driven watch tracking telemetry**.

Per project rules, **no coding implementation will begin until this plan is explicitly reviewed and approved by the project owner**.

---

## User Review Required

> [!IMPORTANT]
> **Key Architecture Shift**: Instead of pre-transcoding 1080p, 720p, and 480p into permanent static folders on upload (which used 3x–5x disk space), uploads will now save **only 1 normalized master file** (`master_source.mp4`). Downscaling to 720p/480p will happen on-demand in 20-second chunk lookaheads, auto-evicted after 10-15 minutes of inactivity.

> [!TIP]
> **Egress & Redis Limits Solved**: 
> - 1080p streaming uses fMP4 byte-range requests directly from the master file (0% CPU re-encoding).
> - Watching video segments generates **0 Redis/API requests**.
> - Progress tracking uses a 30-second debounced heartbeat + seek/pause/exit event listeners (`onSeeking`, `onPause`, `sendBeacon`), cutting backend API/DB writes by 99%.

---

## Open Questions

> [!NOTE]
> None. All core architectural constraints (downscale-only rules, 1080p max quality limit, single master file storage, CPU process caps, and event-driven watch tracking) have been reviewed and aligned upon.

---

## Proposed Changes

### Sub-Phase Breakdown

The implementation is divided into 5 focused sub-phases:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Phase 21a: Single Master Storage & Downscale-Only Filter               │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 21b: Zero-CPU 1080p Byte-Range & 20s Chunk Transcoder            │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 21c: Automated LRU Hot-Cache Storage Eviction Cleaner            │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 21d: Cloud Object Storage (MinIO / S3) & Egress Abstraction      │
├────────────────────────────────────────────────────────────────────────┤
│ Phase 21e: Event-Driven Telemetry & Throttled Player Sync (Web/Mobile) │
└────────────────────────────────────────────────────────────────────────┘
```

---

### Backend Component (`apps/backend`)

#### [MODIFY] [tasks.py](file:///e:/Projects/streamflix/apps/backend/app/workers/tasks.py)
- Refactor `transcode_video` task to normalize uploads into a single Master MP4 file (`master_source.mp4`) with `-movflags +faststart`.
- Implement `transcode_chunk_on_demand` task for encoding 20-second chunk lookaheads for 720p and 480p when requested by clients.
- Add process priority (`nice -n 10`) and thread limits (`-threads 2`) to `ffmpeg` execution to cap CPU load under 60%.

#### [NEW] [cache_cleaner.py](file:///e:/Projects/streamflix/apps/backend/app/workers/cache_cleaner.py)
- Implement an automated LRU (Least Recently Used) garbage collection background task.
- Scans `/tmp/hls_cache/` every 5 minutes and purges downscaled chunks inactive for >10-15 minutes or when disk capacity exceeds 80%.

#### [MODIFY] [content.py](file:///e:/Projects/streamflix/apps/backend/app/api/content.py)
- Update dynamic HLS master manifest endpoint (`GET /content/{id}/stream/master.m3u8`).
- For 1080p source streams: generate variant playlists referencing byte-range segments of `master_source.mp4`.
- For 720p/480p stream requests: direct requests to the on-demand chunk stream endpoint (`GET /content/{id}/stream/{resolution}/segment_{index}.ts`).

#### [NEW] [storage.py](file:///e:/Projects/streamflix/apps/backend/app/services/storage.py)
- Abstract media storage into a unified interface (`LocalStorageProvider` vs `S3MinIOStorageProvider`).
- Supports S3-compatible APIs for seamless connection to MinIO / Cloudflare R2 / Backblaze B2.

---

### Web Frontend (`apps/web`)

#### [MODIFY] [CustomWebPlayer.jsx](file:///e:/Projects/streamflix/apps/web/src/components/CustomWebPlayer.jsx)
- Implement Event-Driven Telemetry tracking:
  - Attach `onSeeking` listener: flushes progress prior to seek point, resets 30s heartbeat timer, and resumes from new timestamp.
  - Attach `onPause` listener: flushes progress immediately.
  - Attach `beforeunload` listener using `navigator.sendBeacon()` for reliable tab-close progress saving.
  - Set continuous playback heartbeat to 30 seconds.

#### [MODIFY] [Watch.jsx](file:///e:/Projects/streamflix/apps/web/src/pages/Watch.jsx)
- Update video source URL binding to consume the dynamic byte-range master manifest.

---

### Mobile App (`apps/mobile`)

#### [MODIFY] [Watch.tsx](file:///e:/Projects/streamflix/apps/mobile/src/screens/Watch.tsx)
- Port Event-Driven Telemetry tracking (`onSeeking`, `onPause`, unmount cleanup hook) to React Native video player component.

---

## Verification Plan

### Automated Tests
- **Storage Filter Test**: Run `pytest` on `tasks.py` to verify `ffprobe` downscale-only filters skip 1080p on 720p/480p source uploads.
- **fMP4 Byte-Range Test**: Verify HLS playlist `master.m3u8` returns valid `#EXT-X-BYTERANGE` tags for 1080p source streaming.

### Manual Verification
- **Zero-CPU 1080p Streaming**: Start 1080p playback and monitor backend server CPU (verify CPU remains near 0%).
- **On-Demand 720p Chunk Lookahead**: Start 720p playback, observe `/tmp/hls_cache` populating only the next 5 chunks (20s).
- **LRU Cache Cleanup**: Pause video for 15 minutes and run `cache_cleaner`, verifying idle 720p chunks are automatically deleted from storage.
- **Seek Telemetry Verification**: Seek from 01:00 to 25:00 in player; verify backend `watch_history` DB table accurately records progress prior to seek and updates to new position without missing data.
