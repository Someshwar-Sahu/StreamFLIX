# StreamFlix 🍿

A solo-built, full-stack streaming platform (Web, Mobile, Desktop) built as a hands-on learning project to explore video streaming architecture, HLS adaptive playback, and multi-platform app development.

---

## 🚀 Features & Highlights

### 🎬 Video & Streaming
- **Adaptive HLS Video Player**: Multi-resolution streaming (1080p, 720p, 480p) with manual and auto quality switching.
- **Efficient Transcoding**: Fast asynchronous video processing using Celery workers, Redis queues, and FFmpeg.
- **Smart Progress Tracking**: Automatically remembers where you left off across all devices.

### 📱 Multi-Platform Apps
- **Web App**: Built with React & Vite. Includes Netflix-style hero banners, search, category filters, and theater mode.
- **Mobile App**: Built with React Native. Includes native video player, profile switcher, watchlist, and offline downloads UI.
- **Desktop App**: Built with Electron for a native Windows desktop experience.

### 👥 Accounts & Profiles
- **Multiple Profiles**: Support for multiple profiles per user account with individual avatars, watch history, and watchlists.
- **Admin Dashboard**: Manage content uploads, user roles, and storage directly from the app.

---

## 🏗 Architecture Overview

```text
                               ┌──────────────────┐
                               │   FastAPI API    │  ← Single source of truth
                               │    (Python)      │     (Auth, Catalog, Streaming)
                               └────────┬─────────┘
            ┌───────────────────────────┼───────────────────────────┐
     ┌──────▼──────┐             ┌──────▼──────┐             ┌──────▼──────┐
     │   Web App   │             │ Mobile App  │             │ Desktop App │
     │   (React)   │             │(React Native)             │ (Electron)  │
     └─────────────┘             └─────────────┘             └─────────────┘

          Background Workers: Celery + Redis + FFmpeg + PostgreSQL
```

---

## 📁 Project Structure

```text
streamflix/
├── apps/
│   ├── backend/   # FastAPI Python backend & Celery workers
│   ├── web/       # React + Vite web app
│   ├── mobile/    # React Native mobile app
│   └── desktop/   # Electron desktop app
├── packages/
│   ├── api-client/# Shared API client
│   ├── types/     # Shared TypeScript interfaces
│   └── ui/        # Shared component helpers
└── start-dev.ps1   # Script to start all dev servers at once
```

---

## ⚡ How to Run Locally

### Prerequisites
- Node.js (`>= 22`)
- Python (`>= 3.11`)
- pnpm (`>= 11`)
- Docker Desktop (for Redis & Postgres)

### Start Development Servers
Run the single PowerShell script to launch all 5 dev services:
```powershell
.\start-dev.ps1
```

---

## 📦 Building Standalone Apps

### Desktop Application (.exe)
```powershell
pnpm --filter desktop build
```
*(Builds Windows installer to `apps/desktop/dist/`)*

### Mobile App (.apk)
```powershell
cd apps/mobile/android
.\gradlew.bat assembleRelease
```

---

## 📄 Documentation

- [Architecture Notes](docs/ARCHITECTURE.md)
- [Project Status & Completed Phases](docs/PROJECT_STATUS.md)
- [Learning Roadmap](docs/LEARNING_ROADMAP.md)