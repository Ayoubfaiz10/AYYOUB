# Lawyer Manager — مدير مكتب المحامي

## Commands

```bash
npm start          # electron .
npm run build      # electron-builder --win --x64 (NSIS installer)
npm test           # mocha "tests/unit/*.test.js" --timeout 30000
```

Focused tests:

```bash
npm run test:auth      mocha tests/unit/auth.test.js --timeout 30000
npm run test:db        mocha tests/unit/database.test.js --timeout 30000
npm run test:cases     mocha tests/unit/cases.test.js --timeout 30000
npm run test:clients   mocha tests/unit/clients.test.js --timeout 30000
npm run test:docs      mocha tests/unit/documents.test.js --timeout 30000
npm run test:tasks     mocha tests/unit/tasks.test.js --timeout 30000
npm run test:search    mocha tests/unit/search.test.js --timeout 30000
npm run test:ipc       mocha tests/unit/ipc-handlers.test.js --timeout 30000
npm run test:e2e       npx playwright test
npm run test:legacy    node test/password.test.js
```

Windows shortcut: `launch.bat` (runs `npm start` from script dir).

**Linter and formatter are configured:**

```bash
npm run lint           # eslint . --ext .js
npm run format         # prettier --write "**/*.js"
npm run format:check   # prettier --check "**/*.js"
```

## Architecture

- **Electron 42** with `contextIsolation: true`, no `nodeIntegration`. IPC flows: `main.js ↔ preload.js (validated bridge) ↔ renderer.js`.
- **Vanilla JS SPA** — no framework. All modules attach to `window.App` (`const A = window.App`). **DO NOT use ES modules** (`import`/`export`).
- **Module loading**: `<script>` tags in `index.html` (ordered, Chart.js UMD loaded first), initialized by `renderer.js` in `DOMContentLoaded`. Sections lazy-load on first navigation. Init order: i18n → modal → navigation → darkMode → date → auth → quickAdd → globalSearch → commandPalette → advancedSearch → dashboard → clients → cases → calendar → hearings → tasks → documents → expenses → archive.
- **DB**: `db.js` — sql.js (SQLite via WASM). DB file lives at `app.getPath('userData')/lawyer.db`. Backups in `.../backups/`. Writes go through `queueSave()` promise chain in `db.js` for sequential ordering.
- **AI**: Groq API (OpenAI-compatible). API key encrypted with AES-256-GCM via `MASTER_KEY` env var.
- **Build**: electron-builder NSIS with Arabic/French installer languages (`installerLanguages: [ar, fr]`). `asarUnpack` required for `sql.js/dist/*.wasm` and `tesseract.js-core/*.wasm`.

## Security (must preserve)

- All IPC channels whitelisted in `preload.js` with argument validation schemas. No unlisted channel is callable.
- Rate limiting: 60 req/min per channel.
- XSS prevention: always use `A.escapeHtml()` and `A.safeSet()` — never raw `innerHTML`.
- CSP headers restrict script/style sources.
- bcrypt (12 rounds) for passwords — per-user hashes in `users` table.
- Session token: `session_token` in localStorage, HMAC-signed with `MASTER_KEY`, 30-day expiry. Verified server-side via `auth:checkRemembered`.

## Auth Flow

- **First run**: `A.checkAuth()` → `auth:boot` → no users → Setup screen (office name, admin, password, "تشغيل مع ويندوز").
- **Login**: User cards (click to select) + password field + "تذكرني لمدة 30 يوماً" checkbox. Token stored on `remember`.
- **Session restore**: On app start, `session_token` from localStorage is verified via `auth:checkRemembered` (HMAC + expiry). If valid → Dashboard directly.
- **Lock**: Clears token, calls `auth:logout`, returns to login screen.

## Testing

- 9 test files: `tests/unit/*.test.js` (8 files) + `tests/unit/auth-flow.test.js` + `test/password.test.js` (legacy).
- Primary tests use Node built-in `node:test` + `node:assert/strict`. Helper at `tests/helpers/db.js` creates in-memory SQLite.
- Legacy: `test/password.test.js` — custom framework (no assert lib), exits code 1 on failure.
- Tests do **not** require Electron — run with plain `node`.

## Key Conventions

- **RTL + Arabic-first**: `dir="rtl"` in HTML, UI text via `data-i18n` i18n attributes.
- **`.env`** (gitignored) requires `MASTER_KEY` (any strong random string). Also supports `LICENSE_SERVER` (default `http://localhost:4000`). Create from `.env.example`.
- **6 user roles**: `admin`, `senior_lawyer`, `junior_lawyer`, `assistant`, `intern`, `external`. Navigation sections filtered by role in `navigation.js:ROLE_ACCESS`. Admin sees all; intern sees dashboard, search, clients, cases, hearings, documents, tasks, support only.
- **`modules_backup/`** is Git-tracked (a versioned snapshot of `modules/`).
- **`storage/`** is gitignored — contains passwords, uploads, API keys at runtime.
- **`.opencode/`** is gitignored (local OpenCode config). References `AGENTS.md` via `instructions`.
