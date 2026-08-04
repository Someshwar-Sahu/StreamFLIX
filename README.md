# StreamFlix 🍿

> A full-stack, multi-platform streaming ecosystem (Web + Mobile + Desktop) built with Python FastAPI, React, React Native, Electron, and PostgreSQL.

StreamFlix is designed to explore production-grade streaming architecture, adaptive video delivery (HLS), cross-platform code sharing via pnpm monorepo workspaces, and zero-egress cloud infrastructure.

---

## 🌟 Key Features

### 🎬 Media & Streaming Pipeline
- **Adaptive HLS Streaming**: Multi-resolution video playback (1080p, 720p, 480p) with manual/auto quality switching.
- **Single Master File Storage**: Single 1x source storage footprint with zero-CPU byte-range 1080p streaming and on-demand 20-second downscaling for 720p/480p.
- **Asynchronous Transcoding**: Offloads video processing jobs to Celery workers with Redis job queues.

### 📱 Multi-Platform Clients
- **Web App**: Built with React + Vite, featuring a Netflix-inspired UI, hero banner carousel, category filtering, search, and theater mode.
- **Mobile App**: Cross-platform React Native app with native video player controls, custom profile switcher, watchlist management, and offline downloads UI.
- **Desktop App**: Native Electron wrapper producing standalone Windows `.exe` installers.

### 👥 Accounts & Personalization
- **Profiles**: Multi-profile support per account with distinct watch histories, watchlists, and avatar customization.
- **Watch Progress Telemetry**: Event-driven 30s heartbeat & seek/pause synchronization across all devices.
- **Role-Based Access Control**: Viewer, Uploader, and Admin tiers with dedicated storage and user management dashboards.

### ☁️ Free Cloud Deployment & Keep-Alive
- **Render & Supabase Ready**: Built-in `/health` endpoint that queries PostgreSQL (`SELECT 1`). Pinging every 14 minutes via free cron services keeps both Render web services (15m idle sleep) and Supabase databases (7d inactivity pause) active 24/7.

---

## 🏗 System Architecture

```text
                               ┌─────────────────┐
                               │   FastAPI API   │  ← Single source of truth
                               │   (Python 3)    │     (Auth, Catalog, Users)
                               └────────┬────────┘
             ┌──────────────────────────┼──────────────────────────┐
      ┌──────▼──────┐            ┌──────▼──────┐            ┌──────▼──────┐
      │   Web App   │            │ Mobile App  │            │ Desktop App │
      │(React/Vite) │            │(React Native)            │ (Electron)  │
      └─────────────┘            └─────────────┘            └─────────────┘
                                        │
           Background Workers: Celery + Redis + FFmpeg + PostgreSQL
```

---

## 📁 Repository Structure

```text
streamflix/
├── apps/
│   ├── backend/   # FastAPI API, SQLAlchemy, Celery workers, FFmpeg services
│   ├── web/       # React + Vite web frontend
│   ├── mobile/    # React Native mobile client
│   └── desktop/   # Electron desktop wrapper
├── packages/
│   ├── api-client/# Shared typed API client
│   ├── types/     # Shared TypeScript interfaces & types
│   └── ui/        # Shared component utilities
└── docs/          # Project architecture, status reports, and roadmap
```

---

## 🛠 Tech Stack

- **Backend**: FastAPI, SQLAlchemy (Async), Alembic, Pydantic, Celery, Redis, FFmpeg
- **Frontend (Web/Desktop)**: React 19, Vite, HLS.js, Electron
- **Mobile**: React Native, React Navigation, React Native Video
- **Monorepo**: pnpm workspaces
- **Database**: PostgreSQL (Supabase / Local)

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js >= 22
- Python >= 3.11
- pnpm >= 11
- Docker Desktop (for Redis/Postgres)

### Launch All Services
```powershell
# Run all dev servers (Backend, Celery Worker, Metro, Web, Desktop):
.\start-dev.ps1
```

---

## 📄 Documentation Links

- [Architecture Overview](docs/ARCHITECTURE.md)
- [Project Status & Completed Phases](docs/PROJECT_STATUS.md)
- [Learning Roadmap](docs/LEARNING_ROADMAP.md)
- [AI Collaboration Guidelines](docs/AI_COLLABORATION_RULES.md)