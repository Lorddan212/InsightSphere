# InsightSphere

Multi-API Analytics Dashboard — a portfolio project for meaningful KPIs, trends, comparisons, and drill-down analysis.

**Current phase: Phase 3 — Currency Analytics. Status: Complete.** The existing shell includes Open-Meteo weather analytics at /weather and Frankfurter currency analytics at /currencies. Economy and crypto remain unconnected.

## Local development

Use Node.js 22.13+ on the 22.x line, or Node.js 24+ (recommended) and npm. Initialized with Node.js 24.19.0 and npm 11.10.0.

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

Keep domain logic in its feature. Global hooks, schemas, types, and utilities are for genuinely shared concerns only. Future API flow: service → runtime validation → normalization → TanStack Query hook → UI. See [AGENTS.md](AGENTS.md) for operating rules and [the roadmap](docs/DEVELOPMENT_ROADMAP.md) for all ten phases.

## Stack and dependency plan

Installed: React, React DOM, Vite, TypeScript, the React Vite plugin, type definitions, and ESLint with React/TypeScript rules. Strict typing is enabled for application and tooling projects.

Phase dependencies:

Installed for Phase 1: Tailwind CSS with its Vite plugin, React Router, TanStack Query, and Lucide React. These support styling, routing, future server state, and navigation icons respectively.

- Phase 2: Zod validates network responses; Recharts renders the temperature chart. Native Intl handles timezone-aware dates; React Hook Form and date-fns remain deferred.
- Phase 2 tests: Vitest, React Testing Library, user-event, jest-dom, jsdom, and MSW.

Use native Fetch initially. No Axios, additional state library, or backend is needed now. Formatting follows .editorconfig: two spaces, UTF-8, LF, final newline; JavaScript/TypeScript follows single quotes and no semicolons. ESLint handles code quality. Prettier enforces this style through `npm run format` and `npm run format:check`.

## Planned APIs

| Domain     | Provider                  | Intended analysis                                           |
| ---------- | ------------------------- | ----------------------------------------------------------- |
| Weather    | Open-Meteo                | Current conditions, forecast/hourly trends, location search |
| Currencies | Frankfurter               | Exchange rates, conversion, historical comparisons          |
| Economy    | World Bank Indicators API | Country indicators, histories, comparisons                  |
| Crypto     | CoinGecko                 | Rankings, market data, asset histories                      |

Open-Meteo is connected; the other providers remain planned. Verify their current contracts, access requirements, and usage limits during the relevant phase. CoinGecko authentication and a secure proxy, if needed, are Phase 5 decisions.

## Environment and security

No environment variables are required. .env.example records this. Real .env files are ignored; examples must never contain secrets. Every VITE_* variable is public browser data. Confidential credentials belong in server-side infrastructure, never the frontend bundle.

## Project workflow

Git is initialized locally. Phase 1 does not change repository remotes or Git identity and does not create a commit. Use focused, meaningful commits when requested.

The next intended task is **Phase 4 — Economic Analytics**, requiring a separate request. The overview labels weather and currencies as available; unified dashboard metrics remain Phase 6 work.

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
