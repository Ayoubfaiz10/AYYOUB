# مدير مكتب المحامي — Cabinet Manager v2.0

## Stack
- **App**: Electron + Vanilla JS + CSS3 + HTML5
- **DB**: SQLite via sql.js (`lawyer.db`), in-memory + persisted to file
- **AI**: **Groq** (llama-3.1-8b-instant, API OpenAI-compatible)
- **Build**: electron-builder NSIS (Windows), `asarUnpack` for sql.js WASM

## Architecture

### Core Files
| File | Lines | Role |
|------|-------|------|
| `main.js` | ~920 | 75+ IPC handlers, Groq AI, bcrypt auth, `safeIpc()` wrapper, CSP header |
| `preload.js` | ~240 | 80+ validated channels, rate limiting (60/min), args validation per channel |
| `database.js` | ~1590 | 22 tables, CRUD, migrations, backup/restore/integrity/repair, search index |
| `index.html` | ~1020 | 23 sections, 11 modals/overlays, sales pages |
| `style.css` | ~2710 | Design system, components, dark mode, animations |
| `design-tokens.css` | 118 | 29 CSS custom properties, dark mode palette |
| `renderer.js` | 81 | Init orchestrator with `safeInit()` guarding each module |

### Module Architecture (`modules/` — 12 feature dirs + 9 flat infra files)
All modules use `const A = window.App`. `renderer.js` calls `A.initXxx()` in order.

#### Infrastructure (flat)
| File | Role |
|------|------|
| `shared.js` | escapeHtml, safeSet (with esc callback), safeSetStatic, toast (max 5), debounce, skeleton, logError, showError, showEmpty, safeInvoke |
| `ipc-cache.js` | cachedInvoke (30s TTL, max 200 entries), mutate (invalidates cache), A.invalidateCache exported |
| `modal.js` | showModal (with null guards + draft cleanup), hideModal, showConfirm, draft listener cleanup |
| `navigation.js` | navigateTo (null-guarded + typeof checks on load* functions), lazy loading |
| `ui.js` | Dark mode toggle, date display, quick add, session timeout (null-guarded DOM) |
| `auth.js` | Login/password setup/lock, user selector, onboarding, null-guarded DOM |
| `archive.js` | Archived cases list, unarchive |
| `reports.js` | Report cards (cases, financial) |
| `autosave.js` | localStorage draft engine, restore banner, per-field indicators, modal form save |

#### Feature Modules (subdirectories)
| Directory | Files |
|-----------|-------|
| `dashboard/` | `index.js`, `views.js` |
| `clients/` | `index.js`, `views.js` |
| `cases/` | `index.js`, `views.js`, `kanban.js` |
| `documents/` | `index.js`, `views.js` |
| `calendar/` | `index.js`, `views.js` |
| `hearings/` | `index.js` |
| `tasks/` | `index.js`, `views.js` |
| `search/` | `index.js` |
| `ai/` | `index.js` |
| `settings/` | `index.js` |
| `expenses/` | `index.js` |
| `notifications/` | `index.js` |

### Init order (index.html)
```
shared.js → ipc-cache.js → modal.js → navigation.js → ui.js → auth.js
→ archive.js → reports.js → search/ → dashboard/ + views → clients/ + views
→ cases/views + kanban + index → calendar/ + views → hearings/
→ tasks/ + views → documents/ + views → ai/ → settings/ → expenses/ → notifications/
→ autosave.js → renderer.js
```

### renderer.js init (all wrapped in safeInit try/catch)
```
A.initModal() → A.initNavigation() → A.initDarkMode() → A.initDate()
→ A.initAuth() → A.initQuickAdd() → A.initGlobalSearch()
→ A.initCommandPalette() → A.initAdvancedSearch() → A.initDashboard()
→ A.initClients() → A.initCases() → A.initCalendar()
→ A.initHearings() → A.initTasks() → A.initDocuments()
→ A.initExpenses() → A.initArchive() → A.initReports()
→ A.initAI() → A.initSettings() → A.initSettingsData()
→ A.initNotifications() → A.initSessionTimeout() → A.checkAuth()
```

### IPC Convention
- `db:*` — Database CRUD (60+ channels, all wrapped with `safeIpc()` in main.js)
- `events:*` — Calendar/events (getAll, get, add, update, delete)
- `auth:*` — Auth, users, permissions, password management
- `ai:*` — Groq AI (ask, askContextual, getSmartInsights, generateTimeline, summarizeDocument, detectRisks)
- `logger:*` — Logger file+DB operations (log, getLogs, export, clear, stats)
- `notif:*` — Notification cache stats

### Safe Patterns (must follow)
1. **DOM access**: Always guard `document.getElementById(...)` — use `if (!el) return;` or `?.` before `.textContent`, `.value`, `.style`
2. **cachedInvoke**: Always use `(await A.cachedInvoke(...)) || []` — returns null on IPC error
3. **XSS prevention**: Use `A.safeSet(el, esc => esc(value))` pattern. NEVER interpolate DB values directly in template strings. In `A.showModal()` calls, use `A.escapeHtml(value)` for every `${...}` that contains user data.
4. **Async guards**: Always `.catch()` on fire-and-forget promises. Use try/catch around `await` calls in async handlers.
5. **Module init**: `renderer.js` uses `safeInit()` — don't break the chain on module failure.

## Recent Security Audit (June 2026 — All 196 tests passing)

### Critical fixes applied
- **XSS eliminated**: 30+ XSS vectors fixed by adding `A.escapeHtml()` to all DB-sourced values in modal templates, dashboard widgets, client card links
- **Null-pointer crashes eliminated**: 50+ `document.getElementById(...)` calls guarded with null checks across all modules
- **IPC hardening**: `safeIpc()` wrapper on all 60+ `db:*` handlers in main.js; null guards on 11 crash-prone handlers
- **Backup path traversal**: Filename sanitization (`includes('..')`, `/`, `\`) in both preload.js validation and database.js functions
- **Cache bounded**: ipc-cache.js now has max 200 entries with LRU eviction
- **Toast bounded**: Max 5 concurrent toasts
- **Modal drafts cleanup**: Event listeners properly removed on hideModal
- **Init resilience**: `safeInit()` ensures one module failure doesn't block all initialization

### Remaining known issues (low risk)
- `safeSetStatic()` (used by showModal) doesn't sanitize HTML — XSS prevention relies on callers escaping values with `A.escapeHtml()`
- No CSP nonce for inline scripts — Electron loadFile origin makes this acceptable
- `exportTableCSV` uses string concatenation for table name, but whitelist-checked

## Database Schema (22 tables)
- `clients`, `cases` (client_id FK → clients, ON DELETE SET NULL)
- `tasks` (20+ cols), `subtasks`, `task_comments`, `workflows`, `workflow_steps`, `task_templates`
- `events` (25 cols: recurrence, alert flags, FK to cases/clients)
- `documents` (FK → cases ON DELETE CASCADE), `document_text` (OCR)
- `procedures`, `paiements` (both FK → cases ON DELETE CASCADE)
- `jugements`, `communications` (FK to clients/cases)
- `users` (6 roles), `permissions` (10 perms), `case_permissions`
- `activity_log` (user_id, user_name), `alert_settings`, `backup_settings`
- `appointments` (FK → cases ON DELETE SET NULL)

## IPC Cache (ipc-cache.js)
- `A.cachedInvoke(channel, ...args)`: 30s TTL, key = channel + JSON.stringify(args)
- `A.mutate(channel, ...args)`: invalidates dependent cache entries, then invokes
- `A.invalidateCache(mutationChannel)`: exported so any code can manually invalidate
- Cache invalidation map: 18 read channels mapped to their mutation dependencies
- Returns `null` on IPC error — always guard with `|| []`

## Search Architecture (search/index.js)
- Two-tier: (1) Client-side instant via preloaded flat index (`A._searchIndex`, loaded 3s after auth via `db:getSearchIndex` IPC), (2) Server-side advanced via `db:globalSearch` for comprehensive + OCR
- Relevance scoring: exact=1000 > startsWith=200 > tokenMatch=150 > wordBoundary=100 > substring=50
- Command palette: Raycast-style with recent items (localStorage), navigation, create actions, quick actions

## Auto-Save (autosave.js)
- localStorage drafts with `as_` prefix, debounced 1.5s, persist beforeunload/visibilitychange
- Restore banner on startup, per-field visual indicators, modal form save by title key

## Commands
```bash
npm start                    # Launch Electron app
npm test                     # Run all 196 unit tests
npm run test:auth            # Auth tests only
npm run test:database        # Database tests only
npm run test:cases           # Cases tests only
npm run test:clients         # Clients tests only
npm run test:documents       # Documents tests only
npm run test:tasks           # Tasks tests only
npm run test:search          # Search tests only
npm run test:ipc             # IPC handler tests only
npm run build                # Build Windows installer
```

## Important File Paths
- DB: `C:\Users\FAIZ\Dropbox\OPEN CODE\B3\lawyer.db`
- Password: `C:\Users\FAIZ\Dropbox\OPEN CODE\B3\storage\password.json`
- AI config: `C:\Users\FAIZ\Dropbox\OPEN CODE\B3\storage\ai_config.json`
- Backups: `C:\Users\FAIZ\Dropbox\OPEN CODE\B3\backups\`
- Uploads: `C:\Users\FAIZ\Dropbox\OPEN CODE\B3\storage\affaires\`
- Tests: `C:\Users\FAIZ\Dropbox\OPEN CODE\B3\tests\unit\*.test.js`

## I18n Notes
- `A.updateUI()` scans `[data-i18n]` elements and sets `textContent` (or `placeholder` for INPUT/TEXTAREA/SELECT)
- For buttons/elements with icon `<i>` children, wrap the text in `<span data-i18n="key">text</span>` to avoid losing the icon
- `<select>` elements should NOT have `data-i18n` (it only sets non-visible placeholder attribute)
- All `data-i18n` keys in `index.html` must have a corresponding entry in `i18n.js` or `shared.js`
