# How to Contribute

Welcome! Thanks for your interest in contributing to **LexOffece**.

## Getting Started

1. **Fork** the repository
2. **Clone** your fork
3. Create a **branch** for your feature/fix
4. Make your changes
5. **Test** your changes
6. Submit a **Pull Request**

```bash
# Install dependencies
npm install

# Start in dev mode
npm start

# Run tests (222 tests)
npm test

# Lint & format
npm run lint
npm run format
```

## Code Style

- **Vanilla JS** — no frameworks
- Use `window.App` namespace (`const A = window.App`)
- IPC through `preload.js` validated channels only
- XSS protection: always use `A.safeSet()` / `A.escapeHtml()`
- Arabic comments for business logic, English for technical comments

## Testing

- **Unit tests**: `tests/unit/*.test.js` (Mocha + Chai)
- **E2E tests**: `tests/e2e/` (Playwright)
- Always run `npm test` before submitting a PR

## Branching

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code |
| `dev` | Active development |
| `feature/description` | New features |
| `fix/description` | Bug fixes |

## What to Work On

Check the [Issues](https://github.com/Ayoubfaiz10/AYYOUB/issues) page for open tasks, or suggest your own improvements:

- Bug fixes
- UI/UX improvements
- Performance optimizations
- New features (discuss in issue first)
- Documentation (Arabic or French)
- Tests coverage
- Accessibility

## Questions?

Open an issue and tag it as `question`.

---

**Built with love for Moroccan law offices.**
