# Phase 8 — Testing, Quality & Performance

Date: 2026-10-09. Status: Complete, with the manual/browser and live-provider limits below. Scope: quality of the existing four domains, overview and settings. Phase 9, deployment, commits and pushes are excluded.

## Fresh baseline

The working tree was clean before Phase 8. Lint, strict TypeScript/Vite build, formatting and `git diff --check` passed before changes. There is no separate typecheck script; `npm run build` includes `tsc -b`.

The first test run, concurrent with other checks, passed 277 tests in 13 files but failed to start the dashboard worker with `Timeout waiting for worker to respond`. The isolated rerun passed all **303 tests in 14 files**, taking 166.38 seconds. No assertion was weakened, worker timeout increased, isolation disabled or listener limit raised. Resource contention is a plausible explanation, not a proven root cause. Final tests are run separately from heavy checks.

## Audit and disposition

Severity reflects impact within this project; no Critical or High finding was established by this review.

| Area                   | Severity      | Evidence and disposition                                                                                                                                                                                                                                                              |
| ---------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A. Correctness         | Informational | Reviewed domain normalization, UTC/provider dates, missing values, zeroes, currency conversion overflow, economic percentage-point versus relative changes and crypto history ordering. Existing behavioral tests retained; no new calculation defect identified.                     |
| B. TypeScript          | Informational | Strict app/tooling configurations remain enabled. External payloads pass runtime schemas before domain use. No production `any`, suppression or configuration relaxation added.                                                                                                       |
| C. Accessibility       | Informational | Reviewed labels, semantic tables, selected/sorted states, live feedback, skip link, navigation focus, native dialog handlers, reduced motion and chart alternatives. Main text-token contrast measured below. Browser focus containment and screen-reader behavior remain unverified. |
| D. Network resilience  | Low, fixed    | Shared client told currency/economy users to choose another location on some HTTP failures. Changed to domain-neutral selection guidance; added the status/error/cancellation matrix below.                                                                                           |
| E. Security / routing  | Low, fixed    | Vite middleware used a string prefix, consuming unrelated paths such as `/api/cryptography`. It now matches the exact crypto path segment; offline middleware tests cover pass-through and unconfigured behavior.                                                                     |
| F. Performance         | Informational | Debounced weather search, bounded series, query keys/caching and disabled focus refetch retained. Proxy caches, coalescing and cooldown remain. No polling or new request fan-out introduced.                                                                                         |
| G. Bundle              | Low, fixed    | Unused lazy `DomainPage` still generated a 1.37 kB chunk with obsolete coming-soon content. Removed it and its otherwise unused Badge component/export. Existing feature routes remain lazy.                                                                                          |
| H. Test isolation      | Medium, fixed | Shared cleanup omitted local storage, in-memory weather choice, theme/title/overflow, stubbed globals and dialog prototype methods. Added restoration after component cleanup and fresh per-test ResizeObserver stubbing. Symmetric cross-test regressions verify isolation.          |
| I. Responsive behavior | Informational | Reviewed adaptive sidebar/dialog breakpoints, minimum widths, min-width-zero grids, bounded charts and focusable table overflow. No rendered-device verification is claimed.                                                                                                          |
| J. Maintainability     | Informational | Feature ownership, shared request boundary and focused components retained. Removed confirmed dead placeholder code rather than restructuring working domains.                                                                                                                        |
| K. Dependencies        | Medium, fixed | Declared Node 22.13+/24+ was below requirements in the lockfile, including `@asamuzakjp/css-color`. Aligned manifest, lockfile root metadata and README to `^22.22.2                                                                                                                  |     | ^24.15.0 |     | >=26.0.0`. No dependency versions changed. |
| L. Documentation       | Low, fixed    | Phase 7 status and obsolete future-API wording updated. This report records the failed baseline attempt, actual results and verification limits.                                                                                                                                      |

## Tests and network behavior

All original 303 tests and their assertions remain. Added 20 tests:

- 14 shared request tests: HTTP 400/401/403/404/429/500/502/503; malformed JSON; success-status error envelope; mocked network rejection; timeout; caller cancellation; valid JSON with zero/null and Accept header.
- 2 symmetric isolation tests: each verifies clean storage, weather memory, theme, title, body overflow and browser mocks before dirtying those same resources. Either order exercises cleanup.
- 4 middleware tests: unrelated prefixes pass through; the real crypto namespace returns safe, non-cacheable 503 JSON without fetching when unconfigured.

Shared transient retries remain bounded; 429, client errors and deterministic invalid-data failures are not retried automatically. Caller cancellation is preserved. Existing domain/component suites cover malformed schemas, empty and partial payloads, loading, recovery, cached refresh failures and one-domain failure isolation. The proxy suite additionally checks allowlists, identity, authentication failures, cooldown, bounded history and secret-safe errors.

MSW 2.15.0 remains pinned. There is one `setupServer()` definition, one lifecycle `listen`, one `close`, and per-test handler reset. Unhandled requests are blocked and recorded, and bypass events fail teardown even if application code catches an error. No real-provider test calls, passthrough handlers, TLS listener additions or `setMaxListeners` changes were introduced. ResizeObserver and other stubs are restored after unmounting components. File isolation and one-worker execution remain enabled.

The jsdom performance advisory remains informational. Tests do not measure browser layout, native dialog focus containment, live provider availability or deployment.

## Accessibility and responsive review

Existing keyboard tests cover navigation, period controls, preference radios, reset/cancel focus and sorting. Chart tables retain units and dates, missing observations stay missing, chart lines do not bridge null gaps, and animation remains disabled. Positive/negative and active states also use text, signs or structural emphasis.

Calculated sRGB relative-luminance contrast from `src/styles/index.css` (opaque token pairs, rounded to two decimals):

| Foreground | Light minimum across panel/canvas/soft | Dark minimum across panel/canvas/soft |
| ---------- | -------------------------------------- | ------------------------------------- |
| ink        | 12.39:1                                | 9.93:1                                |
| muted      | 5.10:1                                 | 5.87:1                                |
| accent     | 5.41:1                                 | 5.58:1                                |
| success    | 5.14:1                                 | 6.58:1                                |
| danger     | 5.68:1                                 | 5.59:1                                |

These results concern the listed text-token combinations only, not every border, chart series, opacity, hover state or rendered composition. They are not a WCAG certification. Source review found intentional narrow-screen stacking and table overflow; mobile/tablet/desktop screenshots and touch behavior were not verified.

## Security and dependencies

CoinGecko remains behind the server-only allowlisted proxy. The key is injected into an upstream header, not browser URLs. Unknown parameters, invalid IDs, unsupported currencies/periods and non-GET methods are rejected. Redirects are disabled; schema validation strips unused fields; responses use safe error codes and no-store. Existing cache, request budget, concurrency and cooldown limits are retained. No arbitrary URL proxy, unsafe HTML rendering or new external-link scheme was introduced. Real `.env` files remain ignored and were not printed or changed.

`npm audit --json --fetch-retries=0 --fetch-timeout=15000` reported **0 vulnerabilities** at every severity (384 total dependencies in npm metadata). This is a registry advisory result at review time, not proof that every dependency is defect-free.

The first `npm outdated` attempt failed on sandbox npm-cache permissions. The approved rerun completed and reported only:

| Package               | Installed | Wanted/latest |
| --------------------- | --------- | ------------- |
| @tanstack/react-query | 5.104.0   | 5.104.1       |
| lucide-react          | 1.49.0    | 1.54.0        |

Its exit code 1 means updates were found. Neither was upgraded just to clear the report. **TypeScript 6.0.3 and MSW 2.15.0 remain exact pins.** No package was installed, removed or upgraded. Lockfile changes affect only the root Node engine declaration. The current shell reports Node 26.10.0; alternate supported Node lines were not tested.

## Performance and bundle

Baseline largest minified chunks: chart 360.93 kB / 105.39 kB gzip; main index 342.99 / 107.89; schemas 87.61 / 24.92. Weather 23.76 / 7.31; crypto 14.31 / 4.65; economy 14.30 / 4.44; currency 12.12 / 4.22; dashboard 11.97 / 4.26; settings 5.80 / 2.38. The unused DomainPage chunk was 1.37 / 0.72.

Route splitting remains in place; the overview legitimately needs shared charts and schemas. Recharts and runtime validation are accepted bundle costs. No library replacement, mechanical memoization or speculative manual chunking was justified. Query freshness is domain-specific; selected histories and comparison counts are bounded. Same-currency conversion avoids rate/history requests. Dashboard crypto uses summary queries, not a full market-history fan-out. Proxy deduplication and cache tests remain in the suite.

Final build (12.15 seconds in Vite after typechecking): chart 360.90 kB / 105.39 kB gzip; main index 346.08 / 109.02; schemas 87.80 / 25.00. Weather 23.73 / 7.29; crypto 14.28 / 4.63; economy 14.27 / 4.43; currency 12.09 / 4.21; dashboard 11.94 / 4.24; settings 5.76 / 2.37; CSS 23.31 / 5.54. The DomainPage chunk is absent. Chunk distribution changed and the main chunk grew; no overall bundle-reduction percentage is claimed. There were no build chunk-size warnings.

Built with the explicitly non-secret sentinel `phase8-public-sentinel-not-a-real-credential` in the server environment, then searched all of `dist`. The sentinel, `COINGECKO_API_KEY` and `x-cg-demo-api-key` were absent. The previous environment value was restored without printing it. This validates that build, not browser network traffic or a production host. No browser timings, Lighthouse score, Web Vitals or production performance claim is made.

## Final gates and regression status

| Command                | Final result                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run test`         | PASS — 323 tests, 17 files, 162.27 seconds                           |
| `npm run lint`         | PASS                                                                 |
| `npm run build`        | PASS — strict TypeScript and Vite; dummy-credential scan also passed |
| `npm run format:check` | PASS                                                                 |
| `git diff --check`     | PASS                                                                 |

`MaxListenersExceededWarning` was absent. No listener limit or warning suppression was added. The only final test advisory recommends jsdom startup optimizations; file isolation is deliberately retained.

During implementation, one new middleware test initially omitted the existing response message from its expected object (322/323 tests passed). Its expectation was corrected to the full safe response. Typechecking also caught the new test harness invoking a Vite hook without its typed plugin context; the harness now supplies that context. These corrections did not change existing assertions or relax TypeScript settings. The subsequent strict build passed.

Dashboard, weather, currency, economy, crypto, settings, shared preferences and navigation all passed in the full regression suite. All original 303 tests remain, plus 20 new cases. Real provider requests, authenticated live crypto behavior and production routing are not certified by these offline tests.

## Manual verification and remaining limitations

One browser availability attempt (`cua.getState()`, 10-second budget) timed out and reset its kernel. No repeat attempts, new browser stack or browser screenshots were used. Manual responsive, visual, native focus, screen-reader and live-provider checks remain outstanding. Deployment is owned by the user, and Phase 9 has not started.

The initial worker-start timeout is recorded above; retain separate execution of heavy checks on constrained hosts. No listener warning occurred in the successful baseline or final suite. No Critical or High issue was identified by this audit; browser/live verification remains an explicit follow-up rather than a claimed pass.

Changes remain uncommitted and unpushed.
