# Testing and quality

## Run locally

Install the lockfile with `npm ci --include=dev` on a Node version allowed by `package.json`. Run the full test suite separately from other heavy work on constrained hosts.

```sh
npm run test
npm run lint
npm run build
npm run format:check
git diff --check
npm audit
```

`npm run test:watch` is the interactive alternative. There is no separate typecheck script: build runs `tsc -b` before Vite. `npm run format` rewrites formatting; `format:check` only checks it. No line/branch coverage percentage has been measured or claimed.

## Test design

Vitest runs isolated jsdom files with one worker. Testing Library and user-event exercise user-visible behavior. MSW 2.15.0 intercepts HTTP contracts. TypeScript 6.0.3 and MSW 2.15.0 are intentional pins; changing them requires a separate compatibility review.

`src/test/server.ts` creates one MSW server per isolated environment. Setup listens once, closes once, resets handlers after each test, blocks unhandled traffic and fails teardown on unhandled or bypassed requests. A caught application error cannot turn an unmocked real request into a passing test.

Cleanup unmounts components, restores spies/globals/dialog methods, clears browser preferences and weather memory, resets appearance/title/overflow and returns to real timers. ResizeObserver and layout measurements are jsdom stubs, not proof of rendered charts.

Coverage concentrates on outcomes:

- Schema failures, wrong identities, dates, pagination, numeric limits, zero/null distinction and domain calculations.
- Loading, empty, partial, offline, throttled, malformed and failed-refresh states; retry and cancellation.
- Currency conversion and selection, economic comparison years, weather search, crypto sorting and saved-asset recovery.
- Independent dashboard failures and shared query caches.
- Settings persistence/reset, keyboard actions, navigation focus handlers and error boundaries.
- Server credential handling, constrained routes, safe errors, cache/coalescing/cooldown and middleware routing.

Existing API contracts and offline fixtures are the verification boundary; no Postman cloud workspace or live provider is needed to run the suite.

## Results and limits

Final Phase 9 result: **323 tests in 17 files passed**, with no `MaxListenersExceededWarning`. Lint, strict build, formatting, whitespace checks and npm audit also passed. See [the verification report](PHASE_9_VERIFICATION.md) for exact evidence and limits.

Vitest's informational jsdom startup advisory does not justify disabling isolation. If a worker fails to start, retain the failure record and rerun separately from heavy processes; do not weaken assertions or suppress EventEmitter warnings.

Automated checks do not establish browser layout, native dialog focus containment, screen-reader output, live-provider availability, production rewrites or deployment. Use the separate [release checklist](RELEASE_CHECKLIST.md) and [screenshot plan](SCREENSHOTS.md). Earlier phase reports are dated historical evidence, not current production certification.
