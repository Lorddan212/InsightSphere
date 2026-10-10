# Deployment preparation

Deployment is user-owned and has not been performed. No hosting provider has been selected or connected. This repository supplies a Vite frontend and a deployment-neutral crypto handler; it does **not** yet contain a production host adapter or host routing configuration. Complete that integration before publishing a functioning four-domain site.

## Recommended path and alternatives

Recommendation: **Netlify static hosting plus one Node serverless function**. This is an engineering recommendation, not a configured deployment. Its Web Request/Response function interface is a close fit for the existing handler, allowing the frontend to keep same-origin API calls. [Netlify Functions API](https://docs.netlify.com/build/functions/api/).

| Option                                | Fit and remaining work                                                                                                                                 | Testing-tier consideration                                                                                                                |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Netlify — recommended                 | Publish Vite output; wrap the existing handler in a Node function, configure its crypto path and SPA fallback; keep the secret in function environment | Free plan includes functions and HTTPS/custom-domain support, with a usage-credit allowance; confirm current account limits before launch |
| Vercel                                | Vite hosting is supported; add a Node function entry and routing while retaining the same server handler                                               | Hobby is for personal, non-commercial use; check whether the intended portfolio use qualifies                                             |
| Node application host, such as Render | Add a small production HTTP/static adapter and start command; route API before static/SPA handling                                                     | Free web services can spin down after inactivity, affecting first-load crypto responsiveness                                              |

Sources reviewed 2026-10-09: [Netlify plans](https://www.netlify.com/pricing/), [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel Hobby terms](https://vercel.com/docs/plans/hobby), [Render web services](https://render.com/docs/web-services), [Render free-service limits](https://render.com/docs/free). Pricing and terms can change; no paid plan or account action is authorized by this recommendation.

All options require secure environment support, HTTPS and correct route handling. A separate backend behind a same-origin reverse proxy is possible but adds operational complexity without a demonstrated benefit here. No competing platform configs have been added.

## Build and runtime requirements

| Setting            | Requirement                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------ |
| Install            | `npm ci --include=dev` using the committed lockfile                                                    |
| Build              | `npm run build`                                                                                        |
| Frontend output    | `dist`                                                                                                 |
| Base path          | Site root `/`; subpath hosting is not configured                                                       |
| Node               | `^22.22.2                                                                                              |     | ^24.15.0 |     | >=26.0.0`; recommend Node 24.x at least 24.15 for hosting |
| Server dependency  | Bundle the proxy and its Zod/schema imports separately from the frontend                               |
| Server credential  | `COINGECKO_API_KEY`, CoinGecko Demo key, runtime/function scope only                                   |
| Server APIs        | Native Fetch, Request, Response and AbortSignal timeout support                                        |
| Execution deadline | Allow the proxy's 15-second upstream timeout plus response overhead; verify host and gateway deadlines |

The local verification runtime is recorded in the phase report; no cross-version test matrix is claimed. For Netlify, explicitly select the build Node version and verify the actual function runtime rather than assuming both are identical. Its documented runtime follows supported build runtimes with a fallback; an override is set through platform environment configuration. [Function runtime configuration](https://docs.netlify.com/build/functions/configuration/#node-js-version-for-runtime).

`vite preview` is for local inspection, not production serving. `npm run build` does not produce a backend executable. Keep `dist`, dependencies and environment files out of Git. Source maps remain disabled by Vite's default; final output must contain no public `.map` files. Do not enable public maps just to facilitate release.

## Required integration after choosing Netlify

1. Add a TypeScript/ESM function entry that imports `createCryptoProxy` from `server/crypto/proxy.ts`. Build/bundle its transitive TypeScript imports and Zod with the platform's function toolchain; do not publish server files under `public` or `dist`.
2. Instantiate the handler once per warm function instance with the server environment value (`COINGECKO_API_KEY`, or empty when missing). Pass the incoming Web Request to it and return its Response, preserving status, content type, no-store and Retry-After headers.
3. Map `/api/crypto/*` to that function and preserve the **original pathname and query string**. Do not turn the path into the function's internal filename before passing it to the proxy. Include invalid methods/parameters in validation so the handler's safe errors remain observable.
4. Keep API routing ahead of SPA fallback. Serve existing assets as files; return `index.html` for application navigation such as `/weather`, `/settings` and `/crypto/bitcoin`. Unknown application routes should reach React's Not Found view. An unknown API route must return an API error, never HTML with status 200.
5. Configure the Demo key privately in the function environment. Do not place it in build replacements, public variables, committed config or forwarding URLs. Separate preview/production secret access as appropriate for the account.
6. Add an ingress rate limit and account budget alerts. The handler's 30 calls/minute budget, four in-flight calls and 128-entry cache are **per instance**, not a global allowance across cold starts or regions. Verify credit use before broad public traffic.
7. Use the platform's local/preview function tooling to test the built adapter and the routing matrix below before production deployment. Add focused adapter tests when the host entry is implemented.

Netlify supports custom function paths and SPA rewrites; the catch-all rewrite belongs after more specific handling. Exact config should be committed with the chosen adapter, not copied into this provider-neutral checkout prematurely. [Function routing](https://docs.netlify.com/build/functions/configuration/#routing), [SPA rewrite guidance](https://docs.netlify.com/manage/routing/redirects/rewrites-proxies/#history-pushstate-and-single-page-apps).

## Routing acceptance matrix

| Request                                                                               | Expected behavior after integration                                            |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `/`, `/weather`, `/currencies`, `/economy`, `/crypto`, `/crypto/bitcoin`, `/settings` | Direct navigation and refresh serve the app shell; correct client view appears |
| `/dashboard`                                                                          | App redirect to `/`                                                            |
| `/not-a-route`                                                                        | App Not Found view with working recovery link                                  |
| Existing `/assets/*`, `/favicon.svg`, `/theme.js`                                     | Correct file and content type; no HTML masquerading as JS                      |
| `/api/crypto/global` with valid configuration                                         | JSON response through the server; no browser authentication header             |
| `/api/crypto/global` without a key                                                    | Safe 503 JSON, no secret or stack trace                                        |
| `/api/crypto/unknown` or unsupported parameters                                       | Safe 400 JSON, no upstream arbitrary-URL request                               |
| POST to a crypto endpoint                                                             | Safe 405 response                                                              |
| Provider failure/throttling                                                           | Safe error status; Retry-After where applicable; other domains remain usable   |

## Publish, verify and roll back

The owner reviews/commits/pushes the release, selects hosting, implements/configures the adapter and routing, sets the private key, and deploys. Run [release smoke checks](RELEASE_CHECKLIST.md) against the actual HTTPS deployment, recording each provider separately. Replace the README's pending demo text only with the verified URL; capture [real screenshots](SCREENSHOTS.md).

Keep the previous working frontend and function deployment identifiers. If release checks fail, restore the prior matching frontend/function pair through the host and rerun critical route/API checks. A static-only rollback is insufficient when the function contract changes. Environment changes are managed separately by the host; do not restore a revoked secret. There is no application database migration to reverse.

Client-error monitoring, sanitized proxy failure metrics, uptime checks and provider-credit alerts are future operational enhancements. No monitoring dependency, analytics tracker, DNS change or deployment was introduced in this phase.
