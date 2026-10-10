# Screenshot capture plan

Status: **manual capture required**. No screenshots were generated in Phase 9; browser tooling timed out. There are no fabricated images or broken screenshot links in README.

Use actual application data after provider checks succeed. Wait for loading to finish, keep observation dates visible, close developer tools and hide browser/account notifications. Never include keys, environment settings, private bookmarks or network headers. If a provider is unavailable, label that capture honestly rather than editing values into it.

| Capture                                 | Suggested viewport | Suggested future filename    |
| --------------------------------------- | ------------------ | ---------------------------- |
| Unified overview, dark                  | 1440 × 900         | `overview-dark-desktop.png`  |
| Unified overview, light                 | 1440 × 900         | `overview-light-desktop.png` |
| Weather: current metrics and forecast   | 1440 × 900         | `weather-desktop.png`        |
| Currency: converter and history         | 1440 × 900         | `currencies-desktop.png`     |
| Economy: indicator, year and comparison | 1440 × 900         | `economy-desktop.png`        |
| Crypto: market/asset and history        | 1440 × 900         | `crypto-desktop.png`         |
| Mobile overview                         | 390 × 844          | `overview-mobile.png`        |
| Settings and theme controls             | 1440 × 900         | `settings-desktop.png`       |

Save completed images under `docs/assets/screenshots/`; this is a planned destination, not an existing screenshot claim. Use a full-page capture where required to retain meaningful analytics, and document its dimensions. Also inspect 768px and 1024px layouts for release even if those captures are not published.

Preferred portfolio hero: the dark desktop overview, **subject to visual review**, with sidebar, four summaries and mini trends. If the light version is clearer, use it instead. Do not compress or populate the interface unnaturally just to fit every card above the fold.

For each final image, record capture date, commit/deployment, route, theme, viewport and any unavailable provider. Add descriptive alt text such as “InsightSphere overview with weather, exchange-rate, economic and cryptocurrency summaries.” Optimize file size while preserving legible labels; verify README links after adding the real files.
