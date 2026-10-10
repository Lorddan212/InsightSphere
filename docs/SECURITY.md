# Security and privacy

## Credential boundary

The browser calls `/api/crypto/*`. Only the server reads `COINGECKO_API_KEY` and sends the CoinGecko authentication header. Every Vite-prefixed environment value is browser-visible; never give this key a `VITE_` prefix. `.env`, `.env.local` and other real environment files are ignored; `.env.example` contains a blank value and instructions.

Do not paste credentials into issue reports, screenshots, query strings, logs, storage, fixtures or frontend configuration. Store production secrets in the selected host's function/runtime environment. A frontend build does not need a real CoinGecko credential. Missing server configuration produces a safe 503 response and leaves the other domains usable.

## Request and response controls

- The proxy accepts only its listed GET routes, constrained coin IDs, USD and fixed history periods. It does not forward arbitrary URLs, headers or caller-selected pagination.
- Upstream URLs use a fixed CoinGecko origin. Redirects are disabled. Calls have a deadline and bounded concurrency, caching and request budgets.
- Zod validates provider payloads. Server responses strip unused fields; frontend services validate again before normalization. External images use a small HTTPS host allowlist.
- Errors expose fixed codes and user-oriented messages, not upstream bodies, stack traces, filesystem paths or credentials. React boundaries likewise show generic recovery UI.
- API responses use `Cache-Control: no-store`. The internal server cache is separate from browser/CDN caching.

Per-process limits do not constrain the combined traffic of multiple serverless instances. Before public launch, configure host-level ingress controls and account credit alerts appropriate to anticipated traffic. Do not rely on CORS to protect a public endpoint. Monitoring is a future operational choice; no monitoring or visitor-tracking SDK is installed.

## Data behavior

There are no user accounts, personal-profile database or application analytics tracker. Appearance is in localStorage; selected analytics preferences are in sessionStorage and memory. No credential is stored there. Reset preferences preserves unrelated browser storage.

The browser sends selected public-data queries directly to Open-Meteo, Frankfurter and World Bank, and may load permitted coin images from provider CDNs. Those services can receive normal network metadata such as IP addresses and request parameters. CoinGecko API calls originate from the server proxy. Hosting infrastructure may also retain access logs. No browser geolocation permission is requested. This is a technical description, not a legal compliance certification.

## Release review and response

Phase 9 checks tracked-file credential references, common private-key/token patterns, environment filenames in reachable Git history and the final frontend bundle using a non-secret sentinel. These checks have limits and are not a complete forensic audit of every historical blob. Evidence is in [Phase 9 verification](PHASE_9_VERIFICATION.md).

If a real credential is discovered, stop release, notify the owner privately, revoke/rotate it with the provider and assess affected history/artifacts. Do not publish the value or silently rewrite Git history. The owner controls any cleanup and redeployment.
