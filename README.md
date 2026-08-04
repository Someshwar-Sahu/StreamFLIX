<div align="center">

# 🍿 StreamFlix

### Enterprise-Grade Multi-Platform Video Streaming Ecosystem

[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688.svg?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![React Native](https://img.shields.io/badge/React_Native-0.86-61DAFB.svg?style=flat-square&logo=react&logoColor=black)](https://reactnative.dev/)
[![Electron](https://img.shields.io/badge/Electron-43.1-47848F.svg?style=flat-square&logo=electron&logoColor=white)](https://www.electronjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-4169E1.svg?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![pnpm Workspaces](https://img.shields.io/badge/pnpm-Workspaces-F69220.svg?style=flat-square&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)

*A full-stack, end-to-end streaming engine engineered for high-performance HLS video delivery, zero-CPU byte-range streaming, shared monorepo architecture, and cross-platform native clients (Web, Mobile, Desktop).*

</div>

---

## 📌 Executive Summary

**StreamFlix** is a high-throughput, multi-platform media streaming platform built solo to explore modern distributed systems, low-latency video transcoding, and scalable client-server architectures. 

Unlike conventional web applications, StreamFlix implements a **single-master backend model** where a centralized FastAPI core controls authentication, content delivery, transcode worker orchestration, and telemetry, while thin clients (Web, Mobile, Desktop) consume shared contracts defined in a `pnpm` monorepo.

---

## 🚀 Key Architectural Highlights

### ⚡ 1. Scalable Media & Transcoding Engine
- **Zero-CPU 1080p Byte-Range Streaming**: Native 1080p source files are served directly via HTTP `Range: bytes=X-Y` headers without spawning CPU-intensive `ffmpeg` processes.
- **On-Demand 20s Chunk Downscaling**: Lower quality renditions (720p, 480p) are encoded on-the-fly in 20-second lookahead chunks and cached in a shared hot storage layer across concurrent viewers.
- **Single Master File Strategy**: Retains only **1x** source storage overhead (`master_source.mp4`), reducing permanent disk storage consumption by 70–80% compared to pre-transcoded HLS static folders.
- **Async Processing Pipeline**: Heavy video encoding is decoupled from API request threads via **Celery** workers backed by **Redis** queues.

### 👥 2. Multi-Profile Account System
- **Two-Step Authentication**: Secure account authentication (JWT) layered with profile-level access control tokens.
- **Profile Telemetry & Watch History**: Real-time progress synchronization with 30-second debounced heartbeats and seek/pause event listeners (`onSeeking`, `onPause`, `sendBeacon`).
- **Role-Based Access Control (RBAC)**: Enforces Viewer, Uploader, and Admin permissions with dedicated analytics dashboards.

### 🌐 3. Monorepo & Cross-Platform Synergy
- **Web App**: React 19 + Vite with custom HLS web player, theater mode layout, responsive design, and dynamic category discovery.
- **Mobile App**: React Native (Android & iOS) app featuring native player controls, profile switcher, and offline downloads UI.
- **Desktop App**: Electron wrapper producing native Windows `.exe` installers with dark system framing and integrated auto-updating support.
- **Shared Workspace Packages**: Shared TypeScript interfaces (`@streamflix/types`), API client SDK (`@streamflix/api-client`), and design tokens (`@streamflix/ui`).

### ☁️ 4. Free Cloud Deployment & Keep-Alive Reliability
- **Render + Supabase Integration**: Built-in `/health` endpoint that executes a lightweight database query (`SELECT 1`).
- **24/7 Zero-Sleep Architecture**: Pinging `/health` every 14 minutes via free external monitors keeps Render web services (15m idle limit) AND Supabase PostgreSQL databases (7d inactivity pause) active 24/7 for $0.

---

## 🏛 System Architecture Overview

```text
                               ┌───────────────────────────┐
                               │     FastAPI Core API      │  ← Central Business Logic
                               │   (Python 3.11 / Async)   │     (Auth, RBAC, Catalog)
                               └─────────────┬─────────────┘
                                             │
             ┌───────────────────────────────┼───────────────────────────────┐
             ▼                               ▼                               ▼
    ┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
    │   Web Client    │             │  Mobile Client  │             │ Desktop Client  │
    │  (React + Vite) │             │ (React Native)  │             │    (Electron)   │
    └─────────────────┘             └─────────────────┘             └─────────────────┘
             │                               │                               │
             └───────────────────────────────┼───────────────────────────────┘
                                             ▼
                               ┌───────────────────────────┐
                               │   Shared Monorepo Core    │
                               │  (@streamflix/api-client) │
                               └─────────────┬─────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │  Worker & Storage Layer   │
                               │  Celery + Redis + FFmpeg  │
                               │  PostgreSQL (Supabase)    │
                               └───────────────────────────┘
```

---

## 📂 Repository Structure

```text
streamflix/
├── apps/
│   ├── backend/        # FastAPI REST API, SQLAlchemy Async, Celery Workers, FFmpeg Engine
│   ├── web/            # React 19 + Vite Web Application
│   ├── mobile/         # React Native (Android / iOS) Mobile Client
│   └── desktop/        # Electron Wrapper & Installer Configuration
├── packages/
│   ├── api-client/     # Universal HTTP Client SDK for Backend Consumption
│   ├── types/          # Shared TypeScript Interfaces & DTO Models
│   └── ui/             # Cross-Platform Design Tokens & Component Logic
├── docs/               # Architecture Specs, Decision Logs, and Status Checkpoints
└── start-dev.ps1       # Master One-Click Multi-Service Orchestrator Script
```

---

## 🛠 Technology Stack

| Domain | Technology | Description |
|---|---|---|
| **Backend Core** | FastAPI (Python) | High-performance, async REST API with OpenAPI documentation |
| **Database** | PostgreSQL | Relational storage with SQLAlchemy (AsyncIO) & Alembic |
| **Task Queue** | Celery + Redis | Asynchronous background processing for media encoding |
| **Media Processing** | FFmpeg + HLS.js | Adaptive bitrate streaming & HLS master playlist generation |
| **Web Client** | React 19 + Vite | Fast, responsive single-page application |
| **Mobile Client** | React Native | Native Android & iOS application with React Navigation |
| **Desktop Client** | Electron | Cross-platform desktop distribution built with `electron-builder` |
| **Package Manager** | pnpm Workspaces | Monorepo package management & workspace linking |

---

## ⚡ Quick Start (Local Development)

### 1. Prerequisites
Ensure you have the following tools installed on your development system:
- **Node.js**: `>= 22.11.0`
- **Python**: `>= 3.11`
- **pnpm**: `>= 11.0.0`
- **Docker Desktop**: For running local Redis & PostgreSQL services
- **Android Studio / ADB**: *(Optional)* For running the mobile client on an Android device

### 2. Installation & Setup

Clone the repository and install dependencies:
```powershell
git clone https://github.com/Someshwar-Sahu/StreamFLIX.git
cd StreamFLIX
pnpm install
```

Set up python virtual environment for backend:
```powershell
cd apps/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

### 3. Launch Development Environment

Run the master orchestrator script to launch Backend, Celery Worker, Metro Server, Web Dev Server, and Desktop App simultaneously:

```powershell
.\start-dev.ps1
```

---

## 📦 Production Builds & Deployment

### Desktop Production Installer
Build standalone Windows executable installers (`.exe` / `.nsis`):
```powershell
pnpm --filter desktop build
```
*Output location*: `apps/desktop/dist/StreamFlix Setup 0.1.0.exe`

### Mobile APK Build (Android)
Build debug/release Android application packages:
```powershell
cd apps/mobile/android
.\gradlew.bat assembleRelease
```
*Output location*: `apps/mobile/android/app/build/outputs/apk/release/app-release.apk`

---

## 📜 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Built with ❤️ by <b>Someshwar Sahu</b> as an engineering exploration in streaming architecture.
</div>