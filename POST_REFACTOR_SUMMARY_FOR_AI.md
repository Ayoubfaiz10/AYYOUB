# Project Overview

**Cabinet Manager v2.0** (`lawyer-manager`) — A full-featured law office management desktop application built with Electron. Manages clients, cases, tasks, documents, calendar, hearings, expenses, and communications with AI-assisted insights. Arabic language, RTL layout. Windows-only (NSIS installer).

- **App**: Electron 28 + Vanilla JS + CSS3 + HTML5
- **DB**: SQLite via sql.js (`lawyer.db`)
- **AI**: Groq API (llama-3.1-8b-instant, OpenAI-compatible)
- **Build**: electron-builder NSIS (Windows)
- **Dependencies**: bcryptjs ^3.0.3, sql.js ^1.11.0, tesseract.js ^7.0.0
- **Dev Dependencies**: electron ^28.0.0, electron-builder ^24.0.0

# Architecture

## Folder Structure

```
B3/
├── main.js              # Electron main process (685 lines)
├── preload.js           # Context bridge + IPC validation (145 lines)
├── renderer.js          # Init orchestrator + patches (84 lines)
├── database.js          # SQLite via sql.js (1307 lines, ~68 exports)
├── index.html           # Single-page app shell (978 lines)
├── style.css            # All component styles (2886 lines)
├── design-tokens.css    # Centralized design system (238 lines, 192 tokens)
├── package.json
├── modules/             # 20 files across 12 feature dirs + 8 flat infra
├── storage/             # password.json, ai_config.json, uploaded docs
├── backups/             # Auto/manual DB backups
├── test/
│   └── password.test.js # 60 unit tests for password flow
└── dist/                # Build output
```

## Module Architecture

All modules use the `window.App` namespace (`const A = window.App`). Modules execute synchronously in order (loaded via `<script>` tags at end of `<body>`). `renderer.js` orchestrates initialization in `DOMContentLoaded`.

### Infrastructure (flat — `modules/*.js`)

| File | Lines | Responsibility |
|------|-------|---------------|
| `shared.js` | 80 | `escapeHtml`, `safeSet`, `showToast`, `showError`, `showEmpty`, `showSkeleton`, `debounce`, `logError`, `state` |
| `ipc-cache.js` | 42 | `cachedInvoke` (30s TTL), `mutate` (cache invalidation) |
| `modal.js` | 58 | `showModal`, `hideModal`, `showConfirm` (Promise-based dialog) |
| `navigation.js` | 34 | `navigateTo`, section switching, lazy loading |
| `ui.js` | 49 | Dark mode toggle, date display, quick add, session timeout |
| `auth.js` | 112 | Login, password setup, lock, onboarding, corrupt detection |
| `archive.js` | 28 | Archived cases list, unarchive |
| `reports.js` | 32 | Report cards (cases, financial) |

### Feature Modules (`modules/*/`)

| Module | Files | Lines | Responsibility |
|--------|-------|-------|---------------|
| `dashboard/` | `index.js`, `views.js` | 393 | 6 stats, 3-zone layout, mini calendar, AI insights |
| `clients/` | `index.js`, `views.js` | 347 | Client CRUD, 3 views, workspace with 8 tabs |
| `cases/` | `index.js`, `views.js`, `kanban.js` | 623 | Case CRUD, 3 views, kanban, workspace with 10 tabs |
| `documents/` | `index.js`, `views.js` | 147 | Document CRUD, 3 views, upload, viewer |
| `calendar/` | `index.js`, `views.js` | 295 | Month/week/day/agenda views, event CRUD |
| `hearings/` | `index.js` | 52 | Hearings list, filtering, table view |
| `tasks/` | `index.js`, `views.js` | 357 | Task CRUD, 4 views, kanban, subtasks, comments, workflows |
| `search/` | `index.js` | 252 | Global search (Ctrl+K), command palette, advanced search |
| `ai/` | `index.js` | 163 | AI chat, contextual AI, smart insights, floating button |
| `settings/` | `index.js` | 154 | Users CRUD, activity log, backup/alert settings, password change |
| `expenses/` | `index.js` | 28 | Expenses/payments summary table |
| `notifications/` | `index.js` | 24 | Notification list, mark all read |

## State Management

- **Global state**: `A.state.*` object — stores allClients, allCases, allTasks, allEvents, etc.
- **Cross-module functions**: `A.XXX` (e.g., `A.loadDashboard`, `A.openCaseDetail`, `A.showToast`)
- **Backward-compatible**: `window.XXX` for inline `onclick` handlers
- **No framework**: Vanilla JS, no bundler, no reactive state management
- **Caching**: `cachedInvoke` with 30s TTL for read-only IPC, auto-invalidation via `mutate()`

## IPC Architecture

- `main.js` ↔ `preload.js` ↔ `renderer.js`
- `nodeIntegration: false`, `contextIsolation: true`
- `preload.js` exposes `window.ipcRenderer` with `invoke`, `on`, `removeAllListeners`
- **78 IPC handlers** (main) validated against **39 VALID_CHANNELS** (preload)
- Channel categories: `auth:*` (9), `db:*` (50+), `events:*` (5), `ai:*` (7), `notif:*` (1)
- Rate limiting: 100 calls/10s per channel per window
- Argument validation: `validateArgs()` with per-channel rules (object shape)

## Database Architecture

- **22 tables**: clients, cases, tasks, subtasks, task_comments, workflows, workflow_steps, task_templates, appointments, documents, procedures, paiements, alert_settings, backup_settings, document_text, jugements, communications, users, permissions, case_permissions, activity_log, events
- **~68 exported functions** in `database.js`
- SQLite via sql.js (pure JS, no native deps)
- Migrations inline in `initDb()`
- Auto-backup configurable (hours frequency)
- Manual backups via `createBackup()`
- `validateRef()` enforces FK-like integrity

## Init Order

```
index.html loads:
  shared.js → ipc-cache.js → modal.js → navigation.js → ui.js → auth.js
  → archive.js → reports.js → search/ → dashboard/* → clients/*
  → cases/* → calendar/* → hearings/ → tasks/* → documents/*
  → ai/ → settings/ → expenses/ → notifications/ → renderer.js

renderer.js init:
  initModal → initNavigation → initDarkMode → initDate → initAuth
  → initQuickAdd → initGlobalSearch → initCommandPalette
  → initAdvancedSearch → initDashboard → initClients → initCases
  → initCalendar → initHearings → initTasks → initDocuments
  → initExpenses → initArchive → initReports → initAI
  → initSettings → initSettingsData → initNotifications
  → initSessionTimeout → (patches) → checkAuth
```

# UI Structure

## Pages & Sections (23 sections in index.html)

Single-page app with section switching via `navigateTo()`:
- Dashboard, Clients, Cases, Tasks, Calendar, Hearings, Documents, Search (Ctrl+K), AI, Settings, Expenses, Notifications
- Modals: Case workspace, Client workspace, Task detail, Document viewer, Confirm dialogs
- Overlays: Login, Startup, Onboarding, Command palette, Photo viewer
- Sales pages: About, License, Changelog, Support

## Navigation

- **Sidebar**: 260px wide, navy background, RTL layout
- **Topbar**: 48px, search bar (Ctrl+K), date display, user badge, dark mode toggle
- **Content**: Scrollable main area with padding
- Collapses to icon-only at 900px breakpoint

## Design System

Centralized in `design-tokens.css` (192 custom properties across 238 lines, 1234 `var()` references in style.css):

### Colors

- **Background**: `--bg: #F8F8F7`, `--white: #FFFFFF`
- **Navy**: `--navy: #1E2A38`, `--navy-light: #2A3A4C`, `--navy-dark: #151E28`
- **Gold accent**: `--gold: #C6A15B`, `--gold-dark: #A8883E`
- **Gray scale**: 50/100/200/300/400/500/600/700/800
- **Semantic**: `--danger`, `--success`, `--warning`, `--info`, `--purple`
- **Opacities**: `--gold-bg-xs/sm/md/lg/subtle`, `--danger/success/warning/info-bg-xs/subtle`
- **Overlays**: `--overlay-light/medium-alt/medium/navy`
- **Sidebar**: `--sidebar-border/label/icon/btn-hover-bg/btn-hover-color/text-5/text-9/text-35/text-95`

### Typography

- **Font**: Inter 400/500/600/700 system stack
- **Scale**: 10px(caption), 11px(caption), 12px(xs), 13px(sm/body), 14px(base/card-title), 16px(lg/section-title), 22px(xl/page-title), 28px(2xl)
- **Semantic tokens**: `--text-page-title`, `--text-section-title`, `--text-card-title`, `--text-body`, `--text-secondary`, `--text-caption` with weight & line-height

### Spacing

- `--space-0`(1px), `--space-0-5`(2px), `--space-1`(3px), `--space-1-5`(4px), `--space-2`(6px), `--space-3`(8px), `--space-3-5`(10px), `--space-4`(12px), `--space-5`(14px), `--space-6`(18px), `--space-7`(20px), `--space-8`(24px), `--space-9`(28px), `--space-10`(32px), `--space-11`(36px), `--space-12`(40px), `--space-14`(48px)

### Radii

- `--radius-sm`(4px), `--radius-md`(6px), `--radius-lg`(10px), `--radius-xl`(12px), `--radius-2xl`(16px), `--radius-pill`(100px)

### Shadows

- `--shadow-sm/md/lg/xl`, `--shadow-gold/gold-hover`, `--shadow-dialog/toast/danger/palette`, `--focus-ring-gold/focus-ring-gold-wide`

### Transitions

- `--transition-fast`(120ms), `--transition-base`(150ms), `--transition-slow`(200ms)
- Easing: `--easing-default/enter/exit`

### Layout Tokens

- `--sidebar-width`(220px), `--topbar-height`(48px), `--modal-width`(520px), `--confirm-width`(340px), `--palette-width`(580px), `--onboarding-width`(480px), `--login-width`(340px)
- `--avatar-xs`(24px) through `--avatar-2xl`(52px)
- `--icon-xs`(16px) through `--icon-4xl`(64px)

## Reusable Components

- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, `.btn-ghost`, `.btn-danger`, `.btn-gold`, `.btn-sm`, `.btn-xs`, `.btn-icon`
- **Badges**: `.badge`, `.badge-active`, `.badge-pending`, `.badge-closed`, `.badge-gold`, `.badge-danger`
- **Cards**: `.card`, `.card-header`, `.card-body`
- **Forms**: `.input`, `.input-group`, `.input-icon`, `.input-label`, `select.input`, `textarea.input`, `.input-sm`, `.toggle`
- **Tables**: `.table`, `.table-wrap`, `.table th/td`, striped rows
- **Modals**: `.modal`, `.modal-overlay`, `.modal-header`, `.modal-body`, `.modal-footer`, `.modal-close`
- **Confirm dialog**: `.confirm-dialog`, `.confirm-overlay`, `.confirm-icon-danger/warning`, `.confirm-title`, `.confirm-message`, `.confirm-actions`
- **Skeletons**: `.skeleton`, `.skeleton-card/tableRow/kanban/calEvent/aiMsg/docCard/stat`
- **Empty states**: `.empty-state`, `.empty-state-v2`, `.empty-state-v3`
- **Toasts**: `.toast`, `.toast-success/error/info`
- **Filter group**: `.filter-group`, `.filter-btn`, `.filter-btn.active`
- **View toggle**: `.cases-view-toggle`, `.view-btn`
- **Toolbar**: `.toolbar`, `.toolbar-left`, `.toolbar-right`

# Features

## Dashboard
- **Status**: Fully implemented (V3)
- 6 stat cards (clients, cases, tasks, hearings, documents, revenue)
- Welcome section with greeting + quote + avatar
- Quick actions bar (add client, case, task, event)
- 3-zone layout: case list, mini kanban, document list, mini calendar, upcoming events, AI insights
- Financial summary with chart
- Notifications feed (recent activity log entries)
- Health score indicator, deadline center
- Responsive: collapses at 1400px, 1200px, 768px

## Clients (CRM V5)
- **Status**: Fully implemented
- 3 views: segments, cards, table
- Segments by case count (active clients, multiple cases, etc.)
- Client workspace modal: 8 tabs (overview, cases, tasks, documents, timeline, communications, payments, contacts)
- Client CRUD with modals
- Archive/unarchive

## Cases (V4)
- **Status**: Fully implemented
- 3 views: card grid, table, kanban (6 columns)
- Case workspace modal: 10 tabs (overview, timeline, documents, tasks, hearings, notes, expenses, contacts, analytics, AI)
- Kanban with drag-and-drop
- Archive/unarchive, status management
- Workflow templates

## Documents (V6)
- **Status**: Fully implemented
- 3 views: grid, folders, table
- Drop zone upload with drag-drop
- Document viewer with sidebar
- Category filtering
- File upload via IPC (webUtils.getPathForFile for Electron 28+)

## Calendar (V7)
- **Status**: Fully implemented
- 4 views: month grid, week grid, day grid, agenda
- Event types: hearings, deadlines, tasks, meetings, documents, payments
- Event CRUD with modals
- Conflict detection
- Upcoming events in dashboard
- Color-coded event types

## Hearings
- **Status**: Fully implemented
- Table view with filtering
- Connected to calendar events
- Skeleton loading

## Tasks (V8)
- **Status**: Fully implemented
- 4 views: list, kanban, priority, analytics
- Subtasks, comments, workflows, templates
- Priority indicators
- Task check (circular checkboxes)
- Analytics with numbers
- Workflow/template system for auto-creating task sequences

## Expenses
- **Status**: Fully implemented (minimal)
- Summary table of expenses and payments
- Connected to case workspace

## Notifications
- **Status**: Fully implemented (minimal)
- Dashboard feed showing recent activity log entries
- System notifications via Electron `Notification` (bounded cache)
- Mark all read button

## Search (Global + Command Palette)
- **Status**: Fully implemented (V9)
- Ctrl+K command palette
- Global search across cases, clients, tasks, events, documents, procedures
- Keyboard navigation
- Results grouped by category
- Action shortcuts (add task, add event)
- 300ms debounce

## Settings
- **Status**: Fully implemented
- Users CRUD (6 roles, permissions system)
- Activity log viewer
- Backup settings (auto/manual)
- Alert settings (deadline/hearing thresholds)
- Password change
- Permission-based access control

## AI Assistant (V9)
- **Status**: Fully implemented
- 7 modes: General, Case context, Client context, Document context, Audience context, Smart Insights, Timeline generation
- Groq API with llama-3.1-8b-instant
- Floating action button
- AI timeline, document summary, risk detection
- Context-aware prompting
- Configurable API key

# Security

## Password Hashing
- **bcrypt** with 12 salt rounds, stored in `storage/password.json`
- SHA256 legacy hashes migrated transparently on login
- Corrupted file detection: returns `{ ok: false, error, corrupt: true }` for bad JSON / non-string hash
- Minimum password length: 4 characters
- Password change requires current password verification

## XSS Protections
- `A.escapeHtml()` — escapes `& < > " '`
- `A.safeSet()` — passes escaped function to innerHTML
- `A.safeSetStatic()` — direct innerHTML (used for skeleton loading, error states)
- **Known limitation**: 100+ innerHTML assignments using DB fields without sanitization (`A.safeSetStatic` or direct `innerHTML` with interpolated data). This is the largest remaining security gap.

## Input Sanitization
- IPC argument validation in `preload.js`: `validateArgs()` checks object shapes and required fields
- Rate limiting: 100 calls per 10s per channel per window
- Valid channels whitelist (39 channels)

## Authentication Flow
1. `checkAuth()` checks if password exists (`auth:hasPassword`)
2. If no password → show setup form
3. If corrupted file → show error overlay (cannot proceed until fixed)
4. Login via `auth:login` → verifies password, migrates SHA256→bcrypt if needed
5. Session timeout: configurable (default 30 min), locks app
6. App-level lock (not OS-level)

## Permissions System
- 6 roles: admin, lawyer, paralegal, secretary, accountant, viewer
- 10 permissions: cases, clients, tasks, documents, calendar, reports, settings, users, billing, AI
- Case-level access control
- Audit log for sensitive operations

# Performance

## Lazy Loading
- Sections loaded once on first navigation (`loadedSections` Set)
- Workspace tabs lazy-rendered
- Skeleton loaders for all async content

## Caching
- **IPC cache** (`cachedInvoke`): 30s TTL, 17 cached channels, auto-invalidation via `mutate()`
- Cache maps: `channel → { data, ts }`
- Invalidation triggers: mutations in related channels

## Memory Leak Prevention
- **Notification cache** (`sentNotifications`): `Map<key, timestamp>` → capacity 500, TTL 7 days, GC every 6h, LRU eviction
- IPC listener cleanup: `removeAllListeners` on window unload
- Toast DOM cleanup: auto-removes after 3.3s
- Lazy-loaded sections: once loaded, kept in DOM (no re-render)

## Optimizations Implemented
- Debounced search (global 300ms, module 250ms, notes 500ms)
- `transform: translateZ(0)` + `will-change` on animated cards
- Skeleton loading instead of spinners
- Empty state components instead of raw "no data" text
- Print styles (hide sidebar, topbar, overlays; force block layout)
- Design system: 192 CSS variables, 1234 var() references → single-point-of-change for theme

## Large List Handling
- No virtualization (all lists render in full)
- Kanban columns have `min-height` for empty states
- Table pagination not implemented (all rows rendered)
- **Risk**: large datasets (1000+ clients/cases) will degrade performance

## Search Optimizations
- Global search uses SQLite `LIKE` queries
- Results limited (no explicit LIMIT in queries)
- 300ms debounce prevents excessive DB calls

# Refactoring Summary

## Dead Code Removed

| Category | Items Removed |
|----------|---------------|
| IPC handlers (main.js) | 4 (`db:updateClient`, `db:getDocumentsByCases`, `db:deleteDocument`, `db:getPaiementsByCases`) |
| Preload channels | 4 (same as above) |
| Database exports | 35 (`deleteComment`, `getAllAppointments`, `addAppointment`, `deleteAppointment`, `getEventsByDateRange`, `getEventsByClient`, `getTodayEvents`, `getAlertsNeeded`, `detectConflicts`, `getWeekDeadlines`, `getUnpaidFees`, `getStaleCases`, `getUrgentTasks`, `addJugement`, `getAllJugements`, `searchJugements`, `deleteJugement`, `getAllCommunications`, `deleteCommunication`, `getUserByEmail`, `checkPermission`, `getPermissions`, `setPermission`, `getCaseAccessLevel`, `setCaseAccessLevel`, `getDocumentVisibility`, `updateProcedure`, `deleteProcedure`, `updatePaiement`, `deletePaiement`, `listBackups`, `restoreFromBuffer`, `exportTableCSV`, `deleteTemplate`, `BACKUP_DIR`) |
| Shared.js functions | 3 (`A.escAttrs`, `A.showSectionError`, `A.wrapLoad`) |
| Overridden calendar functions | 2 (`A.loadHearings`, `A.renderHearingsTable`) |
| Duplicate window globals | 9 (`toggleSubtask`, `deleteSubtaskItem`, `addSubtaskTo`, `addCommentTo`, `applyWorkflow`, `applyTemplate`, `deleteWorkflowItem`, `showNewWorkflowForm`, `showNewTemplateForm`) |
| CSS unused classes | 55 (removed from style.css) |
| CSS unused variables | 7 (removed from design-tokens.css) |
| Orphaned files | 3 (npm/, dist/win-unpacked.tmp/, for-claude.txt) |

## Bugs Fixed

| Bug | Location | Fix |
|-----|----------|-----|
| `validateRef` not exported | database.js:405 | Added to module.exports |
| `updateClient` not exported | database.js:373 | Added to module.exports |
| `updateClientNotes` calls nonexistent function | main.js:204 | Changed to `db.updateClient(data)` |
| `db:deleteWorkflow` blocked by preload | main.js + preload.js | Added to VALID_CHANNELS |
| `db:addLog` blocked by preload | shared.js:35 | Added to VALID_CHANNELS |
| `hash` channel broken | main.js | Replaced with `auth:hashPassword` (bcrypt) |
| SHA256 passwords without salt | main.js | Migrated to bcrypt on login |
| `file.path` deprecated in Electron 28+ | renderer.js | `webUtils.getPathForFile(file)` |
| Password corrupt detection missing | main.js | Added JSON parse + type checks |
| `sentNotifications` Set memory leak | main.js | Set→Map with TTL+GC+capacity |

## Design System Overhaul

- **Before**: `design-tokens.css` had 29 variables, style.css had ~2000 hardcoded values
- **After**: 192 variables, 1234 `var()` references, 0 hardcoded `#fff` in component CSS (except print block)
- Replaced: 32x `#fff`, 79x font-size, 12x font-weight, 15+ gold rgba, 10+ semantic rgba, 6+ sidebar tints, 12+ border-radius, 5 backdrop-filter, 5 shadows
- Removed 8 `!important` (kept 5 in justified print block)

## Notification System

- **Before**: `Set` grew unbounded, no cleanup, no expiration
- **After**: `Map<key, timestamp>`, max 500 entries, TTL 7 days, GC every 6h, LRU eviction, O(1) lookup

## Line Count Changes

| File | Before | After | Delta |
|------|--------|-------|-------|
| main.js | ~694 | 685 | -9 |
| preload.js | ~154 | 145 | -9 |
| database.js | ~1323 | 1307 | -16 |
| shared.js | ~109 | 80 | -29 |
| style.css | ~3299 | 2886 | -413 |
| design-tokens.css | ~155 | 257 | +102 |
| index.html | ~1019 | 978 | -41 |
| cases/index.js | ~336 | 237 | -99 |
| calendar/index.js | ~220 | 165 | -55 |
| dashboard/views.js | ~365 | 332 | -33 |
| renderer.js | ~82 | 84 | +2 |

# Remaining Technical Debt

## High Priority
1. **XSS vulnerabilities**: 100+ innerHTML assignments with unsanitized DB fields. `A.safeSet` is available but not used everywhere. Many modules use raw string interpolation into `innerHTML`.
2. **No virtual scrolling**: All lists render full dataset. Will degrade with 1000+ records.
3. **Error handling gaps**: Some IPC handlers lack try/catch, unhandled rejections may crash renderer.

## Medium Priority
4. **CSS duplication**: Phase 12 section redefines many base classes (`.btn`, `.card`, `.badge`, `.modal`, `.input`). These overrides add 200+ lines and create maintenance burden. Should be consolidated into base styles.
5. **No unit tests**: Only password flow is tested (60 tests). All other modules lack test coverage.
6. **No TypeScript**: Large JS files (database.js at 1307 lines) would benefit from types.
7. **No bundler**: All 31 JS files loaded via `<script>` tags. No tree-shaking, no module bundling.
8. **Inline styles in JS**: Some modules set `element.style.cssText` with hardcoded values instead of CSS classes.

## Low Priority
9. **IPC cache stale reads**: `cachedInvoke` returns stale data if invalidation channel is missed.
10. **Tesseract.js optional but large**: Adds ~50MB to bundle for OCR that may rarely be used.
11. **No offline indicator**: App doesn't detect network loss for AI features.
12. **No i18n system**: All UI text is hardcoded Arabic strings in JS files. Adding French/English would require a full rewrite.
13. **No keyboard shortcuts beyond Ctrl+K**: Navigation, actions lack keyboard accelerators.

## Known Risks
- **Database corruption**: sql.js loads entire DB into memory. A large DB (100MB+) will consume significant RAM. Write operations rewrite the entire file.
- **AI API key in plaintext**: Stored in `storage/ai_config.json` as plain JSON.
- **Password file in plaintext JSON**: `storage/password.json` contains the bcrypt hash in plain JSON (not a keychain/secure store). Acceptable for desktop app but noted.
- **Single window**: No multi-window support. Workspace modals are overlays, not new windows.
- **No data export**: No CSV/PDF export for most views (only PDF export stub in reports).

# Future Roadmap

## High Priority
- [ ] XSS remediation: Replace all unsafe innerHTML with `A.safeSet`
- [ ] Unit test suite: Add tests for all IPC handlers and modules
- [ ] Virtual scrolling for large lists (clients, cases, tasks)

## Medium Priority
- [ ] Consolidate Phase 12 CSS overrides into base styles
- [ ] Pagination for tables (clients, cases, documents)
- [ ] Keyboard shortcuts for navigation (1-9 for sections, Escape for modals)
- [ ] Offline AI fallback (local model when Groq unavailable)

## Long-Term Ideas
- [ ] React/Svelte migration or bundler (Vite/ESBuild)
- [ ] Multi-window support (electron's BrowserWindow for workspaces)
- [ ] Dark mode improvements (system preference detection)
- [ ] Data export (CSV, PDF, Excel)
- [ ] Mobile companion app (API + PWA)

# Metrics

| Metric | Value |
|--------|-------|
| Total JS files | 31 |
| Core JS files | 5 (main, preload, renderer, database, shared) |
| Module files | 27 (infrastructure + features) |
| IPC handlers | 78 |
| Preload channels | 39 |
| Database tables | 22 |
| Database exports | ~68 |
| CSS custom properties | 192 |
| `var()` references | 1234 |
| style.css lines | 2886 |
| design-tokens.css lines | 238 |
| index.html sections | 23 |
| index.html modals/overlays | 11+ |
| HTML lines | 978 |
| Unit tests | 60 (password only) |
| Test files | 1 |
| Dependencies | 3 (bcryptjs, sql.js, tesseract.js) |
| Dev dependencies | 2 (electron, electron-builder) |

# Development Notes

## Special Behaviors

- **renderer.js patches** `A.loadAiInsights = A.loadSmartInsights` (line 79) because the dashboard calls `loadAiInsights` but the function is named `loadSmartInsights` in `ai/index.js`
- **renderer.js patches** `A.loadDashboard` to call `updateTopbarUser()` which injects a user badge into the topbar search area
- **renderer.js patches** `A.navigateTo` to call `A.loadSettingsUsers()` and `A.loadSettingsActivity()` when navigating to settings
- **All modules define `A.initXxx()` and `A.loadXxx()`** — init sets up event listeners, load fetches data and renders
- **Lazy loading** happens in `navigation.js`: first `navigateTo('section')` calls `A.loadSection()`, subsequent navigations just toggle `.active` class
- **IPC cache invalidation** is manual: calling `A.mutate(channel, ...args)` calls the IPC handler then clears related cached entries
- **`A.showConfirm()`** returns `Promise<boolean>`, uses Enter/Escape keyboard shortcuts, click-outside to cancel
- **Toast notifications** auto-remove after 3.3s (3s display + 300ms fade-out animation)
- **Skeleton screens** are shown before data loads and replaced when data arrives
- **`window.onerror`** and **`window.onunhandledrejection`** log to activity_log via IPC

## Important Warnings

- Do NOT add `nodeIntegration: true` — breaks the security model
- Do NOT add channels without adding to `VALID_CHANNELS` in preload.js — they will be silently rejected
- Do NOT use `confirm()` or `alert()` — all blocking dialogs were replaced with `A.showConfirm()` / `A.showToast()`
- Do NOT hardcode CSS values — use design-tokens.css variables
- When adding new modules, follow the pattern: define `A.initXxx()` and `A.loadXxx()`, add script tag to index.html, add init call to renderer.js
- IPC mutations should use `A.mutate()` instead of `A.state.ipc.invoke()` to keep caches in sync
- `database.js` functions are synchronous (sql.js is synchronous) — all IPC handlers in main.js are synchronous wrappers

## Conventions

- `const A = window.App` at top of every module
- Arrow functions for event handlers, `function` keyword for named module functions
- Arabic error messages and UI text (RTL)
- IPC channel naming: `domain:action` (e.g., `db:addCase`, `auth:login`)
- Database query naming: `getXxx` for reads, `addXxx` for inserts, `updateXxx` for updates, `deleteXxx` for deletes
- CSS class naming: `.module-component-state` (e.g., `.dash-stat-card`, `.task-card-v8`)
- CSS variables: `--category-purpose` (e.g., `--space-4`, `--text-body`, `--shadow-md`)
- All new CSS must use `var()` references from design-tokens.css

## Best Practices

- Use `A.safeSet(el, esc => ...)` for dynamic HTML to prevent XSS
- Use `A.safeSetStatic(el, html)` only for static HTML (skeletons, error states)
- Use `A.showToast()` for user feedback instead of alert/console
- Use `A.logError()` for error logging (writes to activity_log table)
- Use `A.cachedInvoke()` for read-only IPC (30s cache)
- Use `A.mutate()` for write IPC (invalidates related caches)
- Add new IPC channels to both main.js handler AND preload.js VALID_CHANNELS
- Add invalidation rules to ipc-cache.js for new read channels
- Test with `npm start` (no build step required)
