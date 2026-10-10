# Release and production smoke checklist

Status: **not executed against a production host**. Copy this checklist into release evidence and mark pass/fail only after observing the result. Record date, commit, deployment identifier, URL, browser/OS, viewport, provider status and any issue. Never attach credentials or an unredacted network archive.

## Before deployment

- [ ] Review Phase 9 changes and choose a license before broad open-source distribution; none is currently selected.
- [ ] Select the host and implement/test the adapter and routing requirements in [deployment](DEPLOYMENT.md).
- [ ] Run tests, lint, build, formatting, whitespace checks and npm audit on the release commit.
- [ ] Verify intentional compiler/MSW pins and the selected build/function Node runtimes.
- [ ] Configure the key in server runtime scope, HTTPS, ingress controls and provider credit alerts.
- [ ] Inspect frontend output: expected assets, no environment/test/source-map files or credential markers.
- [ ] Retain a rollback target for both frontend and function.

## Routes and assets

- [ ] Load `/` and reload every deep route: `/weather`, `/currencies`, `/economy`, `/crypto`, `/crypto/bitcoin`, `/settings`.
- [ ] Confirm `/dashboard` redirects and an unknown route shows application recovery.
- [ ] Confirm JS/CSS/favicon/theme assets have correct types and no failed requests.
- [ ] Confirm API failures remain JSON; SPA fallback must not conceal missing crypto routing.
- [ ] Check title, description, favicon, initial theme and subsequent navigation titles.
- [ ] Inspect console for unexpected errors; distinguish intentionally induced provider failures from application defects.

## Provider and product smoke checks

| Provider / view          | Actual checks                                                                                                | Result / time / evidence |
| ------------------------ | ------------------------------------------------------------------------------------------------------------ | ------------------------ |
| Dashboard                | Four independent summaries, observation dates, detail links; a failed provider leaves other summaries usable | Not run                  |
| Open-Meteo / Weather     | Default Abuja data, search/select another place, current/hourly/daily views, chart/table, refresh            | Not run                  |
| Frankfurter / Currencies | Directory, pair swap, decimal and zero conversion, invalid amount feedback, period/history                   | Not run                  |
| World Bank / Economy     | Country/indicator/period, actual observation year, null gaps, comparison and source definition               | Not run                  |
| CoinGecko / Crypto       | Configured proxy, market/global data, Bitcoin or saved asset, asset navigation, history, filter/sort         | Not run                  |
| Settings                 | Light/Dark/System, persisted appearance, session selections, reset and cancel                                | Not run                  |

- [ ] Record each provider's success or failure separately; automated tests do not establish uptime.
- [ ] Inspect browser requests/storage without sharing secrets: crypto calls are same-origin; no provider key in URL, headers, response, bundle or browser storage.
- [ ] Exercise retry after an induced offline/error state; retain cached data on failed refresh. Do not intentionally exhaust provider quotas to test rate limiting.
- [ ] Test missing-key/safe error responses in a controlled preview environment, not by disrupting the live release.
- [ ] Confirm domain selections survive navigation/reload; appearance survives a new visit; storage blocking degrades safely.

## Responsive and accessibility checks

At widths approximately **390, 768, 1024 and 1440 CSS pixels**, inspect navigation, cards, selectors, charts, tables, settings, overflow and focus. Record browser zoom and orientation. Use at least one real mobile device when available.

- [ ] Keyboard-only: reach skip link, main content, navigation, selectors, refresh/retry, periods and Settings.
- [ ] Focus is visible and follows navigation; opening the mobile dialog contains focus, Escape closes it and focus returns appropriately.
- [ ] Table overflow is deliberate, keyboard-accessible and does not cause whole-page sideways scrolling.
- [ ] Screen-reader spot check: headings, form labels, validation, loading/error feedback and sort direction announcements.
- [ ] Chart context includes units/dates and usable table alternatives; missing values are not fabricated.
- [ ] Check text/control contrast in both themes, selected/hover/disabled states and reduced-motion behavior.
- [ ] Reset confirmation is understandable, cancellable and restores focus.

These are manual checks, not a claim of WCAG certification. Browser automation timed out during Phase 9; none of these visual/native-browser results is implied by the jsdom suite.

## Release evidence and presentation

- [ ] Capture actual screenshots using [the screenshot plan](SCREENSHOTS.md).
- [ ] Add the verified live URL and real image links to README and portfolio materials.
- [ ] Review provider attribution, current usage terms and Demo account allowance.
- [ ] Record unresolved issues and rollback decision; do not mark a failed smoke check as a pass.
