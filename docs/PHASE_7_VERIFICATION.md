# Phase 7 — Professional Product Features

Status: Complete. Date: 2026-10-09.

## Baseline and scope

Started from a clean working tree. Before any source edits, all five gates passed: `npm run test` (278 tests, ten files, 133.19 seconds), `npm run lint`, `npm run build`, `npm run format:check`, and `git diff --check`. MaxListenersExceededWarning was absent. TypeScript 6.0.3 and MSW 2.15.0 remain pinned; no dependencies were added or upgraded.

## Gap analysis

| Area                                                  | Before Phase 7                                                    | Decision                                                                                                    |
| ----------------------------------------------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Light/dark/system theme and persistence               | Already complete                                                  | Retain provider; apply theme before React startup and sync browser theme-color                              |
| Settings                                              | Appearance worked; no preference recovery                         | Explain tab-scoped selections, link to existing editors, add confirmed reset                                |
| Weather/currency/economy/crypto selection persistence | Already complete                                                  | Reuse existing validators/defaults; reset exact owned keys and weather memory fallback                      |
| Invalid persistence                                   | Syntax validation and currency/country capability checks present  | Retain; add explicit Bitcoin recovery for unavailable saved assets                                          |
| Refresh, freshness, cached/error/empty states         | Already complete                                                  | Preserve domain-specific dates, caching and query errors; align crypto refresh icon                         |
| Route errors                                          | Root router fallback replaced the shell                           | Add one render boundary around the route outlet, with retry/reload/navigation recovery                      |
| 404                                                   | Already complete                                                  | Retain and test return navigation                                                                           |
| Tables/filtering                                      | Semantic tables, bounded scrolling and crypto text filter present | Keep local filter; add stable numeric sorting and keyboard-focusable history/comparison scroll regions      |
| Shared table system                                   | Data/column shapes differ                                         | Keep focused domain tables; a generic schema-driven table adds little value                                 |
| Skeletons, reduced motion                             | Already complete                                                  | Retain layout-specific loaders and existing global reduced-motion rule                                      |
| Accessibility/navigation                              | Skip link, native dialog, aria-current, focus styles present      | Clarify skip text, add non-color active marker, fix modal navigation/desktop-close focus and scroll cleanup |
| Chart accessibility                                   | Text descriptions/KPIs/tables present                             | Preserve; make remaining table scroll regions keyboard-focusable                                            |
| Source transparency/formatting                        | Already complete                                                  | Reuse providers and domain formatters unchanged                                                             |
| App metadata/titles                                   | App description and route titles present; favicon absent          | Add branded favicon and full analytical document titles                                                     |
| Global search                                         | Not implemented; insufficient value for six visible destinations  | Defer; retain direct navigation and existing domain search/filter                                           |
| Toast infrastructure                                  | Not justified                                                     | Use persistent inline reset feedback and existing error/status regions                                      |
| URL state                                             | Crypto asset URLs supported                                       | Preserve deep-link identity; defer retrofitting every domain                                                |

## Delivered behavior

Settings keeps the working appearance radio controls and adds links to the existing selection editors rather than a second preferences system. Domain selections remain in sessionStorage for the current tab (including reloads); appearance uses localStorage. Reset requires an inline confirmation, focuses Cancel first, restores focus to its trigger, resets System appearance immediately, and removes only the four domain keys and theme key. It resets the weather in-memory fallback too. Unrelated storage and query caches are preserved. Storage errors produce an honest inline message rather than a false success.

Crypto sorting supports rank, price, daily change, market cap and volume. Headers use buttons and aria-sort, expose directional icons, preserve equal-value ordering, keep nulls last in both directions, and never mutate query data. Existing filtering combines with sorting, and a status line describes result count/order. Numeric columns align right.

A route render boundary preserves the shell after unexpected feature rendering failures. Retry remounts the content; reload handles persistent/lazy-chunk failures; navigation to a different path resets the boundary. Normal API errors remain feature query states. The existing root router fallback still covers failures outside this boundary. No exception diagnostics appear in the user fallback.

Crypto configuration/authentication errors use user-oriented text; environment variable names remain in developer documentation. An unavailable saved asset offers a Bitcoin recovery action. Explicit unknown deep links continue to display their own error rather than silently substituting another asset.

Theme bootstrap is a small synchronous local script in the document head. It validates the stored preference and applies Light/Dark/System before the app loads. The existing theme provider handles later device/setting changes and listener cleanup. No animation, theme, state, icon, table, or notification library was introduced.

## Code-level accessibility and consistency review

Reviewed the shell, overview, all four feature pages, settings, 404, shared primitives, tables/charts, preference hooks, request errors, and Phase 1–6 verification reports. Existing theme tokens, focus styles, native labelled controls, source attribution, domain-specific freshness, accessible tables, null handling, and reduced-motion rules are retained. Added active-link border/weight, clearer skip copy, route metadata, focusable overflow regions and sorting semantics. No full manual accessibility audit is claimed.

## Automated verification

All final gates passed:

| Command                | Result                                           |
| ---------------------- | ------------------------------------------------ |
| `npm run test`         | PASS — 303 tests across 14 files, 147.73 seconds |
| `npm run lint`         | PASS                                             |
| `npm run build`        | PASS — TypeScript and production Vite build      |
| `npm run format:check` | PASS                                             |
| `git diff --check`     | PASS                                             |

MaxListenersExceededWarning remains absent. No unhandled/bypassed MSW requests occurred. Vitest printed only an informational jsdom environment performance suggestion; isolation and listener settings were preserved.

The suite contains 303 tests: the 278 baseline cases plus 25 Phase 7 cases (eight preferences/theme, seven navigation/recovery, eight crypto sorting/filtering, two unavailable-asset recovery). By suite: Dashboard 26, Weather 37, Currency 54, Economy 71, Crypto 100 (90 baseline plus 10 new), shared product behavior 15. Existing regression tests are retained. The configuration-message assertion was updated to the new required user-facing wording and strengthened with an explicit assertion that the environment variable name is absent. No prior behavioral checks, network guards, timeouts, isolation settings or listener limits were weakened.

The first complete regression run exposed extra dashboard landmarks after labelling mini-trend scroll containers. The production markup now uses labelled groups for these containers; the four existing domain landmark assertions remain unchanged. Tests also verify preference cancellation/confirmation, keyboard focus, unrelated-storage preservation, blocked-storage handling, theme remount/system changes, safe reset defaults, native-dialog handler cleanup, route failure/retry/navigation, 404 navigation, every sortable numeric field, stable/null ordering and immutable query data.

## Manual and verification limits

Browser entry point `cua.getState()` timed out before a usable browser state. No repeated attempts were made. Real-browser desktop/tablet/mobile layouts, light/dark contrast, startup flash, viewport overflow, hover, native Escape/focus containment and console behavior remain unverified. jsdom tests stub media queries and native dialog methods to verify application handlers; they do not establish native browser modal behavior. Built HTML was inspected: the local theme script precedes the app/style assets, and the theme script/favicon are present in `dist`. This is artifact inspection, not visual verification. No live-provider or production check was performed.

Global search, toasts, extra settings, generic table engines, cross-domain URL state, accounts/cloud persistence and new providers were deliberately omitted. Deeper browser/accessibility/performance verification belongs to separately authorized Phase 8.

CoinGecko credentials remain server-only. No secret settings, new network endpoints, proxy authentication changes, deployment, commit or push. Phase 8 has not started.
