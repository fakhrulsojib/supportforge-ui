# SupportForge UI

> Production-grade AI customer support agent — Frontend

![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react&logoColor=black)
![Vite](https://img.shields.io/badge/Vite-6+-646CFF?style=flat-square&logo=vite&logoColor=white)
![CSS](https://img.shields.io/badge/CSS-Custom_Properties-1572B6?style=flat-square&logo=css3&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)

## 🎬 Demo

[![SupportForge Demo](https://img.youtube.com/vi/CP3tsJpi1q4/hqdefault.jpg)](https://youtu.be/CP3tsJpi1q4)

> 3-minute walkthrough: live chat with RAG streaming, anti-hallucination guard, smart escalation, admin panel, and analytics dashboard.

## Overview

The frontend for SupportForge — a multi-tenant AI customer support platform. Built with React + Vite, featuring real-time WebSocket chat with streaming responses, an admin panel for document management, and an analytics dashboard.

### Key Features

- **Real-Time Chat** — Token-by-token streaming via WebSocket with typing indicators
- **Source Citations** — Collapsible cards showing retrieved knowledge base chunks
- **Admin Panel** — Drag-and-drop document upload, ingestion status tracking, per-tenant model selection and temperature tuning
- **Analytics Dashboard** — Conversation trends, intent clouds, satisfaction gauges
- **Review Queue** — Negative feedback, escalations, flagged messages, and failed queries
- **Platform Tenants** — Superadmin-only tenant provisioning with lifecycle management
- **Dark Mode** — System-aware + manual toggle, persisted in localStorage
- **Responsive** — Optimized for 375px, 768px, and 1440px+ viewports
- **Multi-Tenant** — Tenant-scoped data with role-based UI rendering

## Tech Stack

| Component | Technology |
|---|---|
| Framework | React 18 |
| Build Tool | Vite 6 |
| Routing | React Router v6 |
| HTTP Client | Axios |
| Styling | Vanilla CSS + Custom Properties |
| State | React Context + Hooks |
| Font | Inter (Google Fonts) |

## Quick Start

> **Prerequisites:** Node.js 20+, npm 10+

```bash
# 1. Clone the repo
git clone https://github.com/fakhrulsojib/supportforge-ui.git
cd supportforge-ui

# 2. Install dependencies
npm install

# 3. Copy environment config
cp .env.example .env
# Edit .env if your API is not at localhost:8000

# 4. Start dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Development

```bash
# Dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

## Project Structure

```
supportforge-ui/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── api/                       # API client layer
│   │   ├── client.js              # Axios instance + JWT interceptor
│   │   ├── chatApi.js
│   │   ├── ingestApi.js
│   │   ├── tenantApi.js
│   │   ├── analyticsApi.js
│   │   ├── reviewApi.js
│   │   ├── platformApi.js
│   │   ├── failedQueryApi.js
│   │   ├── modelsApi.js
│   │   └── authApi.js
│   ├── hooks/                     # Custom React hooks
│   │   ├── useWebSocket.js
│   │   └── useAuth.js
│   ├── context/                   # React Context providers
│   │   └── AuthContext.jsx
│   ├── pages/                     # Page-level components
│   │   ├── ChatPage.jsx
│   │   ├── AdminPage.jsx
│   │   ├── AnalyticsPage.jsx
│   │   ├── LoginPage.jsx
│   │   ├── ReviewPage.jsx
│   │   └── PlatformTenantsPage.jsx
│   ├── components/                # Presentational components
│   │   ├── chat/
│   │   ├── admin/
│   │   ├── analytics/
│   │   ├── layout/
│   │   └── shared/
│   ├── styles/                    # CSS design system
│   │   ├── index.css
│   │   ├── theme.css
│   │   ├── layout.css
│   │   ├── shared.css
│   │   ├── scaffold.css
│   │   ├── auth.css
│   │   ├── chat.css
│   │   ├── admin.css
│   │   ├── review.css
│   │   ├── platform.css
│   │   └── analytics.css
│   └── utils/
│       ├── constants.js
│       └── formatters.js
├── public/
├── vite.config.js
├── package.json
├── .env.example
└── README.md
```

## Pages

| Page | Route | Access |
|---|---|---|
| Login | `/login` | Public |
| Chat | `/chat` | All authenticated users |
| Admin | `/admin` | Admin only |
| Analytics | `/analytics` | Admin + Agent |
| Review Queue | `/review` | Admin only |
| Platform Tenants | `/platform/tenants` | Superadmin only |

## Backend API

This frontend connects to the [supportforge-api](https://github.com/fakhrulsojib/supportforge-api) backend. Make sure the API is running before starting the frontend.

Default API proxy: `http://localhost:8000` (configured in `vite.config.js`).

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the frontend implementation plan and progress.

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.
