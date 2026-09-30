# InsightSphere

Multi-API Analytics Dashboard — a portfolio project for meaningful KPIs, trends, comparisons, and drill-down analysis.

**Current phase: Phase 0 — Project Foundation.** Only the runnable foundation, architecture directories, and engineering documentation are implemented. The entry screen is a startup sanity check. No dashboard shell or external API integration exists yet.

## Local development

Use Node.js 22.13+ on the 22.x line, or Node.js 24+ (recommended) and npm. Initialized with Node.js 24.19.0 and npm 11.10.0.

```sh
npm ci --include=dev
npm run dev
```

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Vite development server |
| `npm run lint` | Check TypeScript/React with ESLint |
| `npm run build` | Type-check application/tooling and build production assets |
| `npm run preview` | Preview the build locally; not a production server |

No test runner is installed yet. Introduce Vitest, React Testing Library, and MSW with meaningful tests. Lint and build do not substitute for browser, responsive, or accessibility testing.

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

Deferred until concrete use:

- Phase 1: Tailwind CSS, React Router, TanStack Query, Lucide React.
- Features: Zod for runtime contracts, React Hook Form for forms, Recharts for visualizations, date-fns for date handling.
- Tests: Vitest, React Testing Library, MSW where appropriate.

Use native Fetch initially. No Axios, additional state library, or backend is needed now. Formatting follows .editorconfig: two spaces, UTF-8, LF, final newline; JavaScript/TypeScript follows single quotes and no semicolons. ESLint handles code quality. An automatic formatter is deferred; evaluate Prettier when enforcement is useful.

## Planned APIs

| Domain | Provider | Intended analysis |
| --- | --- | --- |
| Weather | Open-Meteo | Current conditions, forecast/hourly trends, location search |
| Currencies | Frankfurter | Exchange rates, conversion, historical comparisons |
| Economy | World Bank Indicators API | Country indicators, histories, comparisons |
| Crypto | CoinGecko | Rankings, market data, asset histories |

These providers are not connected. Verify their current contracts, access requirements, and usage limits during the relevant phase. CoinGecko authentication and a secure proxy, if needed, are Phase 5 decisions.

## Environment and security

No environment variables are required. .env.example records this. Real .env files are ignored; examples must never contain secrets. Every VITE_* variable is public browser data. Confidential credentials belong in server-side infrastructure, never the frontend bundle.

## Project workflow

Git is initialized locally. No remote, global identity changes, or commit is included in this setup. Use focused, meaningful commits when requested.

The next task is **Phase 1 — Application Foundation & Dashboard Shell**, requiring a separate request. It introduces routing, providers, responsive layout, shared UI, and a theme strategy. API integration starts in Phase 2.

Deployment is deferred to Phase 9; no platform is selected and no deployment was performed. Add screenshots, API/testing documentation, production smoke-test evidence, and portfolio lessons as implemented functionality becomes available.

