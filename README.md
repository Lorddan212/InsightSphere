# InsightSphere

A multi-API analytics dashboard for exploring weather, currency, economic and cryptocurrency data through useful KPIs, trends, comparisons and tables.

## Overview

InsightSphere brings four independent public-data providers into one consistent workspace. The overview follows saved selections; dedicated pages provide deeper analysis. Each domain handles its own loading, missing data and provider failures, so one unavailable source does not disable the whole dashboard.

**Release status:** Phases 0–9 release preparation complete. Deployment is user-owned. See [project status](docs/PROJECT_STATUS.md) for verification and remaining release work.

## Live demo

Deployment pending final release. No public URL has been verified.

## Screenshots

Manual capture is required; no screenshot files are claimed yet. The [capture plan](docs/SCREENSHOTS.md) specifies eight views, desktop/mobile dimensions and a suggested overview hero.

## Features

| Area                     | What you can explore                                                                                                |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Unified dashboard        | Independent summaries, saved selections, compact trends, source dates and detail links                              |
| Weather analytics        | Place search, current conditions, metric KPIs, 24-hour temperature/hourly data and seven-day forecasts              |
| Currency analytics       | Supported currency pairs, local conversion, pair swapping, 7D/1M/3M/1Y history and period metrics                   |
| Economic analytics       | Ten annual indicators, country/period selection, up to two comparison countries and explicit observation years      |
| Cryptocurrency analytics | Global USD metrics, top-50 market filtering/sorting, asset routes and 24H/7D/30D/1Y history                         |
| Product features         | Light/Dark/System appearance, scoped preference reset, keyboard-operable controls, chart tables and recovery states |

Missing values are not filled with invented measurements. Reference currency conversion excludes fees/spreads, economic observations may lag the current year, and crypto is cached HTTP data rather than a streaming feed.

## Technology stack

React, strict TypeScript, Vite, Tailwind CSS, React Router, TanStack Query, Zod, Recharts and Lucide React. HTTP uses native Fetch; date/number formatting uses Intl. Tests use Vitest, Testing Library, user-event, jsdom and MSW. ESLint and Prettier provide static/style checks.

**Intentional pins:** TypeScript `6.0.3` and MSW `2.15.0`. Do not upgrade them without a separate compatibility review.

## Architecture

Feature modules own their services, schemas, transformations, query hooks and views. Services validate unknown provider JSON and normalize it before TanStack Query exposes domain data to the UI. The overview reuses those queries and calculations.

Crypto calls stay same-origin: `browser → /api/crypto/* → server proxy → CoinGecko`. The reusable server handler is separate from its Vite development/preview adapter. Read [architecture](docs/ARCHITECTURE.md) and [API overview](docs/API_OVERVIEW.md).

## Data sources

| Provider                     | Data characteristics                                                  |
| ---------------------------- | --------------------------------------------------------------------- |
| Open-Meteo                   | Modelled current conditions, forecasts and place search               |
| Frankfurter v2               | Published reference exchange rates                                    |
| World Bank Indicators API v2 | Annual economic/development observations from WDI                     |
| CoinGecko Demo API           | HTTP cryptocurrency market observations through a secure server proxy |

These sources publish on different schedules; the dashboard does not describe all data as real-time. Detailed contracts, attribution and dated provider findings are linked in the [API overview](docs/API_OVERVIEW.md). Review current provider terms and account limits before public or commercial use.

## Getting started

Use Node.js **24.x at least 24.15** as the recommended setup, with npm. The manifest also permits Node `^22.22.2` or `>=26.0.0`, matching locked tooling constraints. Phase 9 verification uses the runtime recorded in its report; other Node lines are not certified by a version matrix.

From the repository root:

```sh
npm ci --include=dev
```

For crypto, copy `.env.example` to `.env.local`, enter a CoinGecko Demo key privately, and restart Vite after changes. Weather, currencies and economy need no application environment variables. Without a key, crypto shows an unavailable state while the other domains continue working.

```sh
npm run dev
```

Open the local address printed by Vite. To inspect a production frontend build locally:

```sh
npm run build
npm run preview
```

Preview supports the local proxy but is **not a production server**. Deploying `dist` alone will not provide crypto: a host-specific server/function adapter and API/SPA routing are still required. [Deployment guide](docs/DEPLOYMENT.md).

## Available scripts

| Command                | Purpose                                               |
| ---------------------- | ----------------------------------------------------- |
| `npm run dev`          | Start Vite development server with local crypto proxy |
| `npm run build`        | Strict TypeScript check and production frontend build |
| `npm run preview`      | Preview the build locally with the local proxy        |
| `npm run test`         | Run the offline Vitest suite                          |
| `npm run test:watch`   | Run tests interactively                               |
| `npm run lint`         | Run ESLint                                            |
| `npm run format`       | Apply Prettier formatting                             |
| `npm run format:check` | Check formatting without rewriting                    |

## Environment variables and security

| Variable            | Where it belongs                                                     | Purpose                       |
| ------------------- | -------------------------------------------------------------------- | ----------------------------- |
| `COINGECKO_API_KEY` | Local ignored environment file or production server/function runtime | CoinGecko Demo authentication |

Never prefix the key with `VITE_`: Vite-prefixed values are browser-visible. The proxy validates paths/parameters and provider responses, uses fixed upstream URLs and safe errors, and limits per-instance requests. Public deployment also needs appropriate ingress controls; per-instance limits are not a distributed quota. No credentials belong in browser storage, logs or committed files.

Appearance and analytical selections are stored locally; there are no accounts, profile database or intentional visitor analytics. Public providers/CDNs and the deployment host still receive normal network metadata. See [security and privacy](docs/SECURITY.md).

## Testing and quality

Vitest, Testing Library and strict MSW interception exercise domain calculations, schemas, asynchronous views, preferences, recovery and the crypto boundary without live provider requests. Build includes typechecking; there is no separate typecheck script. No coverage percentage is claimed.

Final Phase 9 verification passed **323 tests in 17 files**, lint, strict build, formatting and whitespace checks, with no MaxListenersExceededWarning. npm audit reported zero vulnerabilities. Full release evidence is recorded in [Phase 9 verification](docs/PHASE_9_VERIFICATION.md). See [testing](docs/TESTING.md) for commands and isolation rules. Run the test suite separately from other heavy checks on constrained machines.

## Project structure

```text
src/
  app/                 # Providers, routing and appearance
  components/          # Shared layout and UI
  features/            # Dashboard, weather, currencies, economy, crypto
  hooks/               # Shared hooks
  lib/                 # Requests, query client and preference reset
  pages/               # Settings and route recovery
  styles/              # Tailwind and theme tokens
  test/                # Strict offline test infrastructure
server/crypto/         # Secure handler and local Vite adapter
public/                # Favicon and early theme script
docs/                  # Architecture, contracts, release and portfolio evidence
```

## Known limitations

- No production deployment, live URL or final screenshots have been verified. Hosting selection, adapter integration, API routing, runtime secret setup and smoke testing remain owner actions.
- Browser automation timed out; visual/device, native-focus and screen-reader checks remain manual. Automated tests do not establish WCAG certification or live-provider uptime.
- Provider availability, published dates, coverage and rate/credit limits vary. Crypto supports USD and up to 365 days of history.
- Proxy caching/budgets are process-local. Monitoring and visitor analytics are not installed.
- Most selections are tab-local rather than shareable URL state; crypto asset deep links are supported.

## Documentation and roadmap

[Architecture](docs/ARCHITECTURE.md) · [API contracts](docs/API_OVERVIEW.md) · [Testing](docs/TESTING.md) · [Security](docs/SECURITY.md) · [Deployment](docs/DEPLOYMENT.md) · [Release checklist](docs/RELEASE_CHECKLIST.md) · [Portfolio case study](docs/PORTFOLIO_CASE_STUDY.md)

The planned development roadmap, Phases 0–9, is complete. Deployment integration and manual production verification remain outstanding. The [historical roadmap](docs/DEVELOPMENT_ROADMAP.md) links implementation evidence. Future work is tracked as maintenance, enhancements, bug fixes or deployment operations.

## Author

Maintained by the repository owner. No separate author profile or contact details have been established in the project documentation.

## License

No license currently selected. Choose one before broad open-source distribution; no license has been added on the owner's behalf.
