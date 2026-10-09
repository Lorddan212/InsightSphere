# InsightSphere

Multi-API Analytics Dashboard — a portfolio project for meaningful KPIs, trends, comparisons, and drill-down analysis.

**Current phase: Phase 8 — Testing, Quality & Performance. Status: Complete.** The overview at `/` summarizes Open-Meteo weather, Frankfurter currency rates, World Bank economic indicators, and CoinGecko markets. Detailed analysis remains at `/weather`, `/currencies`, `/economy`, and `/crypto`. Crypto requires a server-side Demo API key.

## Local development

Use Node.js 22.22.2+ on the 22.x line, 24.15+ on the 24.x line (recommended), or 26+ and npm. These minimums match the locked development dependencies. Initialized with Node.js 24.19.0 and npm 11.10.0.

```sh
npm ci --include=dev
npm run dev
```

| Command           | Purpose                                                    |
| ----------------- | ---------------------------------------------------------- |
| `npm run dev`     | Start Vite development server                              |
| `npm run lint`    | Check TypeScript/React with ESLint                         |
| `npm run build`   | Type-check application/tooling and build production assets |
| `npm run preview` | Preview the build locally; not a production server         |

Run `npm run test` for the offline Vitest suite, or `npm run test:watch` during development. React Testing Library and MSW exercise API contracts and user behavior without live requests. Browser layout checks remain separate.

## Architecture

```text
src/
  app/App.tsx
  components/{charts,layout,ui}/
  features/
    dashboard/{components,hooks,types}/
    weather/{api,components,hooks,schemas,types}/
    currencies/{api,components,hooks,schemas,types}/
    economy/{api,components,hooks,schemas,types}/
    crypto/{api,components,hooks,schemas,types}/
  hooks/
  lib/{api,query}/
  pages/
  schemas/
  styles/
  types/
  utils/
  main.tsx
```

Braces abbreviate separate directories. Empty directories exist locally without placeholder source files; Git does not preserve them in a fresh clone. Create them when adding their first real files. Vite client types are configured in tsconfig.app.json, so no duplicate vite-env.d.ts is needed.

Keep domain logic in its feature. Global hooks, schemas, types, and utilities are for genuinely shared concerns only. API flow: service → runtime validation → normalization → TanStack Query hook → UI. See [AGENTS.md](AGENTS.md) for operating rules and [the roadmap](docs/DEVELOPMENT_ROADMAP.md) for all ten phases.

## Stack and dependency plan

Installed: React, React DOM, Vite, TypeScript, the React Vite plugin, type definitions, and ESLint with React/TypeScript rules. Strict typing is enabled for application and tooling projects.

Phase dependencies:

Installed for Phase 1: Tailwind CSS with its Vite plugin, React Router, TanStack Query, and Lucide React. These support styling, routing, future server state, and navigation icons respectively.

- Phase 2: Zod validates network responses; Recharts renders the temperature chart. Native Intl handles timezone-aware dates; React Hook Form and date-fns remain deferred.
- Phase 2 tests: Vitest, React Testing Library, user-event, jest-dom, jsdom, and MSW.

Native Fetch handles requests. The Phase 5 CoinGecko integration adds a minimal server-only proxy, with no framework or dependency additions. Formatting follows .editorconfig: two spaces, UTF-8, LF, final newline; JavaScript/TypeScript follows single quotes and no semicolons. ESLint handles code quality. Prettier enforces this style through `npm run format` and `npm run format:check`.

## Planned APIs

| Domain     | Provider                  | Intended analysis                                           |
| ---------- | ------------------------- | ----------------------------------------------------------- |
| Weather    | Open-Meteo                | Current conditions, forecast/hourly trends, location search |
| Currencies | Frankfurter               | Exchange rates, conversion, historical comparisons          |
| Economy    | World Bank Indicators API | Country indicators, histories, comparisons                  |
| Crypto     | CoinGecko                 | Rankings, market data, asset histories                      |

Open-Meteo, Frankfurter, and World Bank are connected. CoinGecko uses a same-origin server proxy with a server-only Demo API key.

## Environment and security

Weather, currency, and economy require no environment variables. Crypto requires server-only `COINGECKO_API_KEY`, documented in `.env.example`. Real `.env` files are ignored; examples must never contain secrets. Every `VITE_*` variable is public browser data. Confidential credentials belong in server-side infrastructure, never the frontend bundle.

## Project workflow

Git is initialized locally. Phase 1 does not change repository remotes or Git identity and does not create a commit. Use focused, meaningful commits when requested.

Phases 0–7 are complete. Phase 8 audits and strengthens testing, resilience, accessibility, security and performance. Phase 9 — Production & Portfolio has not started.

Deployment is owned by the user; no deployment was performed. Browser-history routing requires the chosen host to serve index.html for application routes. Add screenshots, API/testing documentation, production smoke-test evidence, and portfolio lessons as implemented functionality becomes available.

## Phase 1 behavior

Routes: / (overview), /dashboard (redirect), /weather, /currencies, /economy, /crypto, /settings, and a catch-all Not Found page. Pages are lazy loaded with a skeleton fallback and a route error boundary.

The mobile navigation uses a native modal dialog with Escape dismissal, focus containment, and focus restoration. Route changes update the document title and focus the main content. Appearance uses light, dark, or system preference and stores only the selection in localStorage under insightsphere.theme. Storage failure falls back to in-memory behavior.

Shared primitives: Button, Card, Badge, PageHeader, EmptyState, ErrorState, and PageSkeleton. Query defaults are a 60-second stale time, five-minute inactive cache retention, one retry, and no refetch on window focus; future features should override these for provider-specific needs.

Implementation references: [Tailwind Vite setup](https://tailwindcss.com/docs/installation/using-vite), [React Router](https://reactrouter.com/start/declarative/routing), and [TanStack Query](https://tanstack.com/query/latest/docs/framework/react/reference/QueryClientProvider).

See [Phase 1 verification](docs/PHASE_1_VERIFICATION.md) for executed checks and remaining validation limits.

## Weather analytics

The default location is Abuja, Nigeria. Search for another place with at least three characters; results are debounced by 400ms and selected using native keyboard-accessible buttons. The selected location persists in sessionStorage across navigation and reloads; precise geolocation is never requested. URL sharing is deferred.

Current conditions, four KPI cards, a 24-hour temperature chart, hourly cards plus an accessible data table, and a seven-day forecast share one validated, normalized query. Measurements use Celsius, km/h, mm, and hPa. IANA timezones keep timestamps local to the selected place, including daylight-saving changes. Current precipitation covers the provider's current interval; hourly precipitation covers the preceding hour.

Forecasts are fresh for 10 minutes and cached for 30 minutes. A manual refresh preserves cached data if it fails. Missing values, incomplete periods, loading, offline, errors, and no-results searches have explicit UI states. No weather key or environment setup is needed for the public non-commercial endpoint.

See [weather API contract](docs/WEATHER_API_CONTRACT.md) for request fields, error semantics, attribution, and architecture. Vitest explicitly uses NODE_ENV=test so component tests also work in environments that globally set production mode.

[Phase 2 verification](docs/PHASE_2_VERIFICATION.md) records the 37 passing tests, command results, live browser checks, and remaining validation limits.

## Currency analytics

Frankfurter v2 supplies supported currency metadata, latest reference rates, and historical observations. NGN support was verified against the live provider; the default is USD/NGN. Select base/quote currencies, swap them without losing the amount, or choose 7D, 1M, 3M, and 1Y history. Pair and period persist in sessionStorage. Equal currencies use the identity rate without provider requests or fabricated history.

The converter calculates locally from the cached rate and accepts non-negative plain decimals up to 1 trillion with at most six decimal places. Empty, invalid, and oversized inputs have explicit feedback. Intl respects currency-specific decimal places. Amount changes never trigger API requests. Results are estimates, excluding fees and spreads.

The chart and accessible historical table show actual provider observations. Change compares the first and last available observations; high and low exclude missing values. Calendar date ranges use UTC and month-end clamping. Metadata caches for 24 hours, latest rates for 30 minutes, and history for one hour. Failed refreshes retain cached data with a warning. Provider publication dates are shown; these are reference rates, not real-time market quotes.

No new feature dependencies were added. MSW is pinned to `2.15.0` and TypeScript to `6.0.3`. This preserves the supported test/compiler toolchain: MSW 3 produced repeated TLS listeners during the test suite, and the installed typescript-eslint does not support TypeScript 7. Tests block unhandled requests and assert that no requests bypass mocks. Use `npm install --include=dev` when the environment defaults to production.

See [currency API contract](docs/CURRENCY_API_CONTRACT.md) and [Phase 3 verification](docs/PHASE_3_VERIFICATION.md) for implementation decisions, checks, and verification limits.

## Economic analytics

World Bank Indicators API v2 (World Development Indicators, source 2) supplies annual observations, country metadata, and indicator definitions. Nigeria is the default. Ten verified indicators cover GDP, GDP growth, GDP per capita, population, population growth, unemployment, inflation, life expectancy, internet usage, and electricity access. No new dependencies or keys are required; MSW 2.15.0 and TypeScript 6.0.3 remain pinned.

Country, indicator, 10Y/20Y/30Y/MAX range, and up to two comparison countries persist in sessionStorage. Native labelled controls support keyboard use. The latest available value always shows its actual observation year within the selected range. Historical charts and a scrollable data table preserve null/missing years; no zero-fill, interpolation, or fabricated current-year values are used. MAX begins at 1960; other periods count inclusively backward from the current UTC year.

Level indicators use relative change with a positive starting denominator; rates and shares use percentage-point change; life expectancy uses years. GDP and GDP per capita are at current prices, not inflation-adjusted measures. Comparisons use the latest common non-null year where possible. Otherwise, each country's own latest year is displayed with an explicit warning that the comparison is not same-year. Failed comparison requests do not remove the main analysis.

Only the selected indicator and selected countries are queried. Country/indicator metadata caches for seven days, series for 24 hours; requests follow and validate pagination. Manual refresh retains cached results when a request fails. Dataset update dates are distinct from observation years. Annual data can be delayed or revised.

See [Economy API contract](docs/ECONOMY_API_CONTRACT.md) and [Phase 4 verification](docs/PHASE_4_VERIFICATION.md) for provider findings, executed checks, and browser verification limits.

## Cryptocurrency Analytics

`/crypto` opens Bitcoin by default (or the session's last selected asset). `/crypto/:coinId` supports shareable detail routes. The module includes global USD market cap and volume, BTC/ETH dominance, a filterable top-50 market table, selected-asset price/change/cap/volume/high/low/supply, and 24H/7D/30D/1Y price history with an accessible data table. Provider IDs identify assets; symbols are display labels. Missing metrics stay unavailable and failed refreshes preserve cached data.

To configure local access:

1. Obtain a CoinGecko Demo API key.
2. Copy `.env.example` to `.env.local` and set `COINGECKO_API_KEY` privately.
3. Restart `npm run dev` (or `npm run preview` for a local build preview).

Never use a `VITE_` prefix for the key. `.env` and `.env.local` are ignored. The browser calls `/api/crypto/*`; only the server injects the provider authentication header. Without a key, the UI reports a configuration error.

The proxy uses native Fetch, Zod validation, fixed provider routes, bounded caching, request coalescing, and a per-process request budget. There is no polling, remote search, WebSocket stream, or extra dependency. Table filtering is local. Provider history is limited to 365 days; historical intervals are retained rather than converted into invented daily values.

**Production needs a server boundary:** static `dist/` hosting alone cannot serve `/api/crypto/*`. Mount the reusable `createCryptoProxy` handler from `server/crypto/proxy.ts` in the chosen server/serverless runtime and set the secret there. `server/crypto/vite.ts` is the local development/preview adapter, not a production server. Deployment remains user-owned.

See [Crypto API contract](docs/CRYPTO_API_CONTRACT.md) for endpoints, provider evidence, caching, safe errors, and security limits.

See [Phase 5 verification](docs/PHASE_5_VERIFICATION.md) for the 252-test result, security checks, and live/browser verification limits.

## Phase 6 behavior

The overview follows each domain's saved session selection and offers independent refresh/retry controls and detailed-page links. Weather shows current conditions and a 24-hour trend; currencies show the latest reference rate and selected-period movement; economy shows one country's indicator, annual trend, and actual observation year; crypto shows the selected USD quote and global market cap/volume. Compact charts include expandable data tables.

Existing feature query keys, validation, calculations, and freshness policies are shared. The overview does not load economic comparison countries or crypto rankings/history. A failed provider leaves the other summaries usable; failed refreshes retain cached data with a notice. Provider observation dates remain separate from cache freshness. See [Phase 6 verification](docs/PHASE_6_VERIFICATION.md) for request budgets, test evidence, and browser verification limits.

## Phase 7 behavior

Settings retains Light/Dark/System appearance and explains how each feature's last selection becomes the overview's default. Appearance persists across visits; analytics selections persist in the current tab across navigation and reloads. A confirmed reset restores System appearance and established domain defaults while preserving unrelated storage and cached data. Storage failures produce inline feedback. Existing feature editors remain the single place to change selections.

The crypto market table combines its existing filter with keyboard-operable sorting by rank, price, 24-hour change, market cap and volume. Missing values remain last in either direction, equal values keep their order, and cached query data is not mutated. Unavailable saved crypto assets offer explicit Bitcoin recovery; unknown deep links retain their own error state.

Unexpected route rendering errors now preserve the shell and provide retry/reload/navigation recovery. Mobile navigation restores focus to content after selection and to its trigger after dismissal. Active links have a border and heavier text as well as `aria-current`. Remaining historical/comparison table scroll regions are keyboard-focusable. A small startup script applies appearance before React loads; favicon and full route document titles use InsightSphere branding.

Global search, toast infrastructure, duplicate default editors, generic table engines and additional URL-state systems were deliberately deferred. No new dependencies. See [Phase 7 verification](docs/PHASE_7_VERIFICATION.md) for the gap analysis, test evidence, and manual verification limits.

## Phase 8 quality review

The quality review strengthens offline failure coverage and test cleanup, constrains the local proxy middleware to its namespace, removes an unused placeholder chunk, and aligns Node requirements with the lockfile. No dependencies were upgraded. See [Phase 8 verification](docs/PHASE_8_VERIFICATION.md) for the audit, baseline, dependency findings, bundle measurements and remaining browser/live-provider verification limits. Run the full test suite separately from other heavy checks on constrained machines.
