# Architecture

InsightSphere is a client-rendered React application with four independent data domains and one server-only cryptocurrency boundary. It has no account service, application database or shared cross-device preference store.

## Request and response flow

```text
User selection → feature hook → TanStack Query → service → native Fetch
                                                       ↓
                                         Open-Meteo / Frankfurter / World Bank
                                                       ↓
UI ← normalized domain model ← Zod validation ← unknown JSON response

Crypto service → same-origin /api/crypto/* → server/crypto/proxy.ts
                                                 ↓ server-only key header
                                           CoinGecko Demo API
                                                 ↓
UI ← frontend validation/normalization ← server validation/field stripping
```

The overview composes the existing feature queries and calculations; it does not maintain duplicate API services. Each summary can load, fail, retry or refresh independently. Cache freshness is distinct from a provider's observation date.

## Ownership

| Location                                           | Responsibility                                                |
| -------------------------------------------------- | ------------------------------------------------------------- |
| `src/app`                                          | Providers, router, lazy page imports and appearance           |
| `src/components`                                   | Shared layout, controls, loading/error states and boundaries  |
| `src/features/{weather,currencies,economy,crypto}` | Domain APIs, schemas, hooks, types, transformations and views |
| `src/features/dashboard`                           | Summary composition and compact trends                        |
| `src/lib/api`                                      | Shared request classification, timeout and retry policy       |
| `src/lib/query`                                    | Query client defaults; features override freshness            |
| `src/lib/preferences`                              | Scoped preference reset                                       |
| `server/crypto`                                    | Deployment-neutral proxy and Vite-only local adapter          |
| `src/test`                                         | Isolated jsdom setup, strict MSW lifecycle and browser mocks  |

## State and persistence

TanStack Query owns asynchronous server state. Native React state owns form input, filter/sort controls and other local interactions. No extra state library is installed.

Appearance uses localStorage (`insightsphere.theme`). Domain choices use validated sessionStorage: weather location, currency pair/period, economic country/indicator/period/comparisons, and crypto asset/period. Session storage lasts for the tab; there is no account synchronization. Weather also has an in-memory fallback. Blocked or malformed storage does not prevent use. Reset clears only InsightSphere preferences, not arbitrary storage or query data.

`public/theme.js` applies the saved/device appearance before React starts. ThemeProvider handles subsequent changes and media-query listener cleanup.

## Data correctness and requests

Schemas validate unknown JSON before normalization. Null values stay missing, not zero. Weather converts epoch seconds and uses provider IANA timezones. Currency date ranges use UTC; conversion is local and does not refetch on each keystroke. Economic metrics retain actual observation years and distinguish percentage points from relative change. Crypto uses provider IDs, ordered timestamps and nullable ranks/prices.

Queries include the relevant selection in their keys and propagate cancellation. Weather search is debounced. Metadata caches longer than changing observations; there is no background polling or focus refetch. The overview does not request crypto rankings/history or economic comparison countries. Failed refreshes retain cached data with feedback. See [API overview](API_OVERVIEW.md) for contracts and cache policies.

## Routing and recovery

React Router owns `/`, `/weather`, `/currencies`, `/economy`, `/crypto`, `/crypto/:coinId`, `/settings`, the `/dashboard` redirect and the catch-all view. Pages are lazy loaded behind Suspense. A route error boundary provides reload/navigation recovery; the feature boundary preserves the shell when a view throws. Normal provider errors are handled in the corresponding query view.

The shell updates document titles and focuses main content on navigation. The mobile menu uses a native dialog; real focus containment still needs browser verification. Charts have textual context and data tables, with null gaps preserved and animations disabled.

## Server boundary

`createCryptoProxy({ apiKey })` returns an asynchronous Web `Request` → `Response` handler. It validates methods, paths and query parameters, constructs fixed CoinGecko URLs, injects authentication only upstream and rejects redirects. It returns safe error envelopes and validated fields, never raw exception text.

Cache, coalescing, request budget and cooldown are per handler instance/process. Instantiate it once per warm server/function instance, not once per request. Those limits are not a distributed account-wide quota. Public hosting must add appropriate ingress controls and monitor provider credits.

The Vite plugin mounts this handler for development and local preview only. `npm run build` produces the frontend; it does not package a production function. A platform adapter and routing must be configured after the owner selects hosting. See [deployment](DEPLOYMENT.md).

## Verification boundaries

Vitest, Testing Library and MSW cover transformations, validation and asynchronous user behavior offline. They do not certify rendered layout, live providers, native browser focus, hosting rewrites or deployment. Public source maps are not enabled; the build output is checked separately. See [testing](TESTING.md) and [release checklist](RELEASE_CHECKLIST.md).
