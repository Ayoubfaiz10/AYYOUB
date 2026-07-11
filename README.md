# LexOffece v2.0

**منصة إدارة مكاتب المحاماة** — Law Office Management Platform

> تطبيق ديسكتوب متكامل لإدارة القضايا، الموكلين، الجلسات، الوثائق، المهام، والمصاريف مع مساعد ذكي بتقنية AI.
> Full-featured desktop app for managing clients, cases, hearings, documents, tasks, and expenses with AI assistant.

---

## Stack

| التقنية   | Technology                                          |
| --------- | --------------------------------------------------- |
| **App**   | Electron 42 + Vanilla JS + CSS3 + HTML5             |
| **DB**    | SQLite via sql.js (in-memory + file persist)        |
| **AI**    | Groq API — llama-3.1-8b-instant (OpenAI-compatible) |
| **Build** | electron-builder NSIS (Windows)                     |

## Features

- **Dashboard** — Stats, agenda, deadlines, activity timeline, financial summary, AI insights
- **Clients (CRM)** — Table/card/segment views, workspace with 8 tabs (overview, cases, docs, comms, payments, timeline, notes, analytics)
- **Cases** — Table/card/kanban views, workspace with 10 tabs, drag-and-drop kanban, archive
- **Hearings** — Filterable list, connected to calendar
- **Calendar** — Month/week/day/agenda views, event CRUD, conflict detection
- **Tasks** — List/kanban/priority/analytics views, subtasks, comments, workflows, templates
- **Documents** — Grid/table/folder views, upload, OCR (tesseract.js), AI summarization
- **Expenses** — Payment tracking, fee summaries
- **AI Assistant** — 7 modes: chat, summarize, draft, analyze, strategy, risk, hearing prep
- **Search** — Global search (Ctrl+K), command palette, advanced search
- **Settings** — Users (6 roles), activity log, backup/restore, alerts, password change
- **Notifications** — System notifications for deadlines & hearings

## Quick Start

```bash
# Install dependencies
npm install

# Run in development
npm start

# Run tests (196 unit tests)
npm test

# Build Windows installer
npm run build
```

## Project Structure

```
├── main.js                 # Electron main process (IPC, AI, auth)
├── preload.js              # Context bridge + IPC validation
├── renderer.js             # Init orchestrator
├── database.js             # SQLite DB layer (22 tables)
├── index.html              # SPA shell (23 sections)
├── style.css               # All component styles
├── design-tokens.css       # Design system (192 CSS variables)
├── modules/
│   ├── shared.js           # Core utilities (safeSet, toast, etc.)
│   ├── modal.js            # Modal/confirm system
│   ├── navigation.js       # Section switching + lazy loading
│   ├── ipc-cache.js        # IPC caching (30s TTL)
│   ├── clients/            # Client CRUD + workspace
│   ├── cases/              # Case CRUD + workspace + kanban
│   ├── dashboard/          # Dashboard widgets
│   ├── calendar/           # Calendar (4 views)
│   ├── documents/          # Document management
│   ├── tasks/              # Tasks + workflows
│   ├── hearings/           # Hearings list
│   ├── expenses/           # Expenses tracking
│   ├── search/             # Global search + command palette
│   ├── ai/                 # AI chat + insights
│   ├── settings/           # Settings panels
│   └── notifications/      # Notification feed
├── db/                     # Modular DB helpers
├── tests/                  # Unit tests (196 tests)
└── storage/                # [gitignored] passwords, API keys, uploads
```

## Security

- **contextIsolation: true** — no node access in renderer
- **preload.js** — validated channels list, rate limiting, argument validation
- **bcrypt** password hashing (12 rounds)
- **AES-256-GCM** encrypted AI API key
- **CSP headers** — restricted script/style sources
- **XSS prevention** via `A.escapeHtml()` + `A.safeSet()` pattern

## Architecture

All modules use the `window.App` namespace (`const A = window.App`). Modules are loaded via `<script>` tags in `index.html` and initialized in order by `renderer.js`. IPC follows `main.js ↔ preload.js ↔ renderer.js` with `safeIpc()` wrapper on all handlers.

---

**Built with ❤️ for Moroccan law offices.**
