# InsightSphere — portfolio case study

**Project type:** Multi-API Analytics Dashboard. **Release state:** preparation complete; deployment integration and final screenshots pending.

## Problem and solution

Public datasets differ in shape, units, publication schedules and failure behavior. Simply placing API responses beside one another makes it easy to confuse forecast times with publication dates, missing values with zeroes, or annual economic observations with current market data.

InsightSphere brings weather, reference exchange rates, annual economic indicators and cryptocurrency markets into a consistent analytical workspace. The overview summarizes saved selections, while domain pages provide KPIs, trends, comparisons, tables and drill-down interaction. Each provider can fail independently without taking away the other summaries.

## My role / engineering scope

The project represents frontend and application engineering across React/TypeScript composition, feature architecture, asynchronous query state, runtime validation, domain transformations, accessible controls, a server-side credential boundary, automated testing and release documentation. This describes the work represented by the repository, not a claim of a particular employer, team size or deployment history.

## Challenges and decisions

| Challenge                         | Decision and tradeoff                                                                                                                                    |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Four incompatible response models | Domain-owned Zod schemas and normalization keep external shapes out of UI components; validation adds bundle weight but catches bad data at the boundary |
| Different freshness and dates     | Domain-specific query policies and visible observation dates instead of describing all data as real-time                                                 |
| Missing economic years and rates  | Preserve nulls/gaps, use valid observations for metrics and explicitly label comparison years                                                            |
| Partial provider outages          | Independent query states and retained cached data on failed refresh; recovery stays local to the affected feature                                        |
| Confidential CoinGecko key        | Same-origin constrained server proxy; static-only hosting is insufficient                                                                                |
| Provider credits                  | No crypto polling/automatic retries; bounded server cache/coalescing/cooldown, with distributed limits left to hosting operations                        |
| Async UI confidence               | Offline MSW contracts plus Testing Library behavior tests, strict request guards and isolated cleanup                                                    |
| Analytical UI accessibility       | Native labelled controls, keyboard sorting, focus handling and chart table alternatives; manual browser certification remains separate                   |

React and strict TypeScript provide component and model boundaries. TanStack Query owns server state. Native Fetch avoids an additional HTTP library. Recharts supplies consistent charts, accepting a shared chart bundle cost. Feature ownership avoids duplicating domain services in the overview.

## Factual outcomes

- Four integrated data domains with a unified overview and separate analytical views.
- Runtime-validated models, useful transformations and explicit loading/error/empty/partial/stale states.
- Server-only crypto authentication, constrained proxy routes and safe failures.
- A verified 323-test Phase 9 final suite, plus lint, strict production build, formatting and dependency review; evidence lives in [Phase 9 verification](PHASE_9_VERIFICATION.md).
- Release, accessibility, provider smoke-test and screenshot checklists ready for the owner.

No engagement, revenue, uptime or conversion improvement has been measured. Browser automation, live production validation and screenshots remain outstanding; responsive source structure is not evidence of device testing.

## Lessons learned

1. Runtime validation and TypeScript solve different problems: external JSON still needs checking.
2. Data interpretation belongs beside the domain model: units, timestamps and missing-value rules affect every chart and KPI.
3. Resilience is visible product behavior, including retained data and clear recovery, not merely a caught exception.
4. Credential safety changes deployment architecture; a frontend build cannot replace a server runtime.
5. Test isolation and strict network interception make failures more trustworthy than a larger test count alone.
6. Release evidence needs distinct labels for automated, browser, live-provider and production checks.

## CV-ready summary

**InsightSphere — Multi-API Analytics Dashboard**  
React, TypeScript, Vite, TanStack Query, Zod, Recharts, Vitest, Testing Library, MSW

- Integrated four public-data providers through typed services, runtime validation and domain-specific normalization.
- Built an independent-summary dashboard with historical charts, accessible data tables, reference-rate conversion and country comparisons.
- Implemented a constrained server-side CoinGecko proxy with credential isolation, caching, coalescing and safe error handling.
- Established 323 automated tests covering transformations, contracts, asynchronous interactions, preferences and failure recovery; preserved strict offline request handling.

## Reusable presentation copy

**Short portfolio card:** A React and TypeScript analytics workspace for weather, currencies, economic indicators and cryptocurrency markets, with validated data, historical trends and independent provider recovery.

**Long portfolio description:** InsightSphere turns four public-data sources into one coherent analytical experience. Feature-owned services validate and normalize responses before they reach cached React views. Users can explore forecasts, convert reference exchange rates, compare annual country indicators and inspect cryptocurrency markets. A server-side proxy protects CoinGecko credentials, while offline contract and interaction tests cover failures as well as successful responses. Deployment preparation and manual release checklists document what is verified and what remains to be tested live.

**Suggested GitHub description:** Multi-API analytics dashboard built with React and TypeScript for weather, currency, economic and cryptocurrency insights.

**Suggested topics:** `react`, `typescript`, `vite`, `analytics-dashboard`, `tanstack-query`, `zod`, `recharts`, `msw`, `data-visualization`, `open-meteo`, `world-bank`, `cryptocurrency`.

No remote repository metadata was changed. Use [the screenshot plan](SCREENSHOTS.md) for the hero image; add a real live URL only after deployment verification.

## Future work

Owner-led deployment and monitoring, broader real-browser/device coverage, richer URL sharing and global search are possible follow-ups. Export, authentication, databases, streaming feeds and new domains remain outside the completed implementation scope. Future work belongs to enhancements, maintenance, bug fixes or deployment operations, not an invented Phase 10.
