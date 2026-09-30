# Phase 3 verification

Date: 2026-09-30. Scope: Currency Analytics only. Deployment, commits, and pushes remain with the user. Phase 4 has not started.

## Implemented

- Frankfurter v2 metadata, latest pair, and historical services; unknown JSON validated with Zod, normalized into domain models, then cached by TanStack Query.
- USD/NGN default verified against live provider metadata. Native labelled selectors, swap, and validated sessionStorage pair/period persistence.
- Local converter with empty/zero/decimal/invalid/large-value handling, currency-specific Intl formatting, and no amount-driven requests.
- Inclusive UTC 7D, 1M, 3M, and 1Y periods with calendar month-end clamping.
- Actual-observation chart, chronological table, change/high/low KPIs, units, dates, missing-observation handling, and same-currency identity behavior without fake history.
- Independent metadata/latest/history loading, errors, retries, empty states, and retained cached results on refresh failures.
- Existing shell integration and updated overview availability labels; no unified dashboard analytics or economic indicators added.

## Automated verification

The suite contains 91 tests: 54 Currency tests (41 contract/calculation tests and 13 component tests), plus all 37 existing Weather tests. All pass. Component checks exercise selection, swap, conversion without requests, periods, persistence, same-pair behavior, retries, empty/partial data, independent failures, cached refresh failures, keyboard period activation, and the historical table. These are jsdom/MSW checks, not real-browser checks.

Final results: `npm run test` — PASS (91 tests, no MaxListenersExceededWarning); `npm run lint` — PASS; `npm run build` — PASS; `npm run format:check` — PASS; `git diff --check` — PASS. The normal test run and the diagnostic trace-warnings run both completed without the listener warning.

## Listener warning investigation

The initial workspace dependency upgrades included MSW 3.0.1 and TypeScript 7.0.2. MSW 3 test runs emitted `MaxListenersExceededWarning` for 11 `secureConnect` listeners on a `TLSSocket`. A run using `NODE_OPTIONS=--trace-warnings` located the repeated additions in `TlsSocketController.claim`, through `@mswjs/interceptors` and MSW's `InterceptorHttpNetworkFrame.respondWith/resolve` path.

Inspection found one `setupServer()` creation in `src/test/server.ts`, and one `beforeAll` listen plus one `afterAll` close in `src/test/setup.ts` per isolated Vitest environment. `afterEach` cleans up React components and resets handlers. Weather and Currency handlers cover their request paths, including expected errors and cancellations; no test intentionally uses passthrough or live HTTPS.

MSW is now pinned to the requested 2.15.0 and TypeScript to 6.0.3 in package.json and the lockfile. The resolved interceptor is 0.41.9 and Vitest shares MSW 2.15.0. The setup uses MSW 2's `onUnhandledRequest` callback to block unmatched requests and record them. A single `response:bypass` listener records any bypassed response. An after-test assertion fails even if application error handling swallowed an unmatched-request error. These audit callbacks are registered once, not on each test or request.

The full 91-test suite passed under `--trace-warnings` without the warning and without any unhandled/bypassed-request assertion failures. This identifies the MSW 3 interceptor path as the observed source; it does not establish an application TLS leak. No listener limit was increased, warning handler disabled, or warning output suppressed.

## Provider checks

Live requests verified active metadata (166 currencies including NGN), latest USD/NGN, seven-day history, and one-year history (365 returned observations). An invalid currency returned HTTP 422 with the documented JSON error structure. Rates may revise between requests; no observed value is hardcoded into production code. See [API contract](CURRENCY_API_CONTRACT.md) for endpoint details and publication limitations.

## Browser and regression limits

Repeated browser-automation initialization attempts timed out or returned `Unable to load browser request-header policy`. No Phase 3 real-browser visual, mobile, light/dark theme, browser-console, or cross-browser verification is claimed. Responsive Tailwind layouts, semantic controls, focus styling, and chart alternatives were reviewed in code and exercised where possible in component tests. A human browser smoke check remains recommended before deployment.

All Weather tests pass after the shared test-setup and dependency changes. One existing debounced-search assertion reached its default one-second wait during a full-suite run; that assertion now allows three seconds for the real 400ms debounce plus rendering/mock scheduling, without weakening its result checks. Weather production files and the shared request utility were not changed. Live Weather browser regression was not repeated because browser access was unavailable. No deployment was performed.

## Significant files

Created: `src/features/currencies/{api,schemas,types,hooks,utils,components,__tests__}/`, `docs/CURRENCY_API_CONTRACT.md`, and this verification record.

Modified: lazy page exports and router, dashboard module availability labels, shared test setup, one Weather test wait, package manifest/lockfile, README, AGENTS, and roadmap. No new feature dependency was introduced. Changes are left uncommitted and unpushed.
