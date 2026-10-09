# Phase 5 verification

Verification date: 2026-10-09. Phase scope: Cryptocurrency Analytics only. No deployment, commit, push, or Phase 6 implementation.

## Automated checks

All required checks passed: `npm run test` (252 tests across 9 files), `npm run lint`, `npm run build`, `npm run format:check`, and `git diff --check`. The dummy-secret bundle check also passed. No MaxListenersExceededWarning appeared in the final suite. Tests and final lint ran outside the sandbox after sandboxed commands stalled.

The suite contains 162 pre-existing tests (37 weather, 54 currency, 71 economy) and 90 new crypto tests (45 contracts/services/calculations, 25 proxy/security, 20 UI interactions). Existing feature assertions are unchanged.

Crypto coverage includes validation, nullable metrics/ranks, timestamp normalization/order, all four period mappings, tiny-price formatting, period-change edge cases, global normalization, loading/empty/error/partial states, keyboard selection, persistence, retry, cached refresh failures, unknown assets, safe configuration errors, authentication injection, input allowlists, redaction, redirects, caching/coalescing, and 429 cooldown.

The host showed Vitest worker-start stalls and timing failures when multiple jsdom/chart suites ran together. Vitest now uses one isolated worker, a 15-second test budget, and a 5-second Testing Library asynchronous wait budget. No behavior assertions, request-count checks, retry policy, or MSW network guards were removed. No EventEmitter limits were increased. MSW remains exactly 2.15.0 and TypeScript remains exactly 6.0.3.

## Local HTTP smoke checks

Executed against `npm run dev` on localhost port 5174:

- `/crypto` and `/crypto/bitcoin`: HTTP 200 application shell.
- `/api/crypto/markets` and `/api/crypto/global`: HTTP 503 with safe `NOT_CONFIGURED` JSON when the key is absent.
- `/api/crypto/markets?url=https://example.com`: HTTP 400 with safe `INVALID_INPUT` JSON.

These are HTTP/middleware checks, not rendered-browser checks.

## Secret boundary

Built with a dummy, non-secret `COINGECKO_API_KEY` marker and scanned every generated `dist` asset: marker absent. The process environment was restored after the check. No real key was used or written.

The frontend sends only same-origin, allowlisted requests. Proxy tests verify upstream-only `x-cg-demo-api-key` injection, no credential in upstream URLs, safe errors, stripped unused fields, and rejection of credential reflection in otherwise valid responses. Only `.env.example` is tracked; no real secret environment file was added. Production needs a server/serverless adapter for the reusable handler; static assets alone cannot serve crypto data.

## Provider and browser limits

Live CoinGecko verification unavailable because no local API key was configured. No live market, Bitcoin history, or global-data success is claimed. Official provider documentation was reviewed on 2026-10-01; sources and limits are in [the contract](CRYPTO_API_CONTRACT.md).

Browser automation timed out again on 2026-10-09 before providing a usable browser state. Visual layouts across device widths, light/dark rendering, browser console behavior, and browser network inspection remain unverified. Keyboard and interaction checks are Testing Library/jsdom checks. Responsive grid, table overflow, theme tokens, visible focus, semantic controls, and chart text/data alternatives were reviewed in source.

## Build notice

Vite's build succeeded with a `PLUGIN_TIMINGS` diagnostic identifying Tailwind transformation overhead on this host. This performance notice was not suppressed.
