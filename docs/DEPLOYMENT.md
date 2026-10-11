# Vercel deployment preparation

Vercel is the selected target. The repository now includes a thin function adapter and API/SPA routing. **No deployment or hosting account change has been performed.** Deployment remains user-owned.

## Implementation

`api/crypto.ts` exports Vercel's Web Request/Response handler and creates the existing `createCryptoProxy` once per warm instance. It reads `process.env.COINGECKO_API_KEY` only on the server. The proxy implementation, validation, fixed upstream destinations, safe errors, caching, cooldown and request budgets are unchanged. No new dependency is required. [Vercel Node runtime](https://vercel.com/docs/functions/runtimes/node-js).

`vercel.json` selects Vite, runs `npm ci --include=dev` and `npm run build`, and publishes `dist`. Vercel separately packages `api/crypto.ts` and its imports. `api/tsconfig.json` supplies concrete Node compiler options without relying on the root solution's project references; the regular build also typechecks the adapter through `tsconfig.node.json`.

Routing order is deliberate:

1. `/api` and `/api/*` invoke the crypto function. The handler receives the original request pathname and query; there are no synthetic route query parameters. Unknown API paths are rejected by the proxy with JSON status 400.
2. Existing filesystem outputs, including scripts and styles, are served normally.
3. Missing `/assets/*` paths return 404 instead of HTML.
4. Remaining paths serve `/index.html`, allowing React Router to resolve deep links and its Not Found view.

Low-level `routes` make the filesystem boundary explicit; do not combine them with top-level `rewrites`, `redirects`, `headers` or `cleanUrls`. [Vercel configuration](https://vercel.com/docs/project-configuration/vercel-json#routes).

The function deadline is 30 seconds, allowing the proxy's 15-second upstream timeout plus overhead. `vite preview` remains local-only and does not emulate Vercel's routing or function packaging.

## Owner configuration before deployment

After reviewing and committing the changes yourself, import the GitHub repository into Vercel (or update its existing project). Use the repository root, Vite framework preset, `npm run build` and `dist`; the committed configuration supplies these values. Set the private key under Project → Settings → Environment Variables for the required environments, then create a deployment only when ready. Changes to environment values require a new deployment. For ordinary local development, edit the ignored `.env.local`, save and restart `npm run dev`; Vercel CLI is not required.

- Use Node 24.x, at least 24.15. The existing package engine range permits Node 22.22.2+, 24.15+ and 26+ on their specified lines; Vercel currently selects the highest supported matching major, 24. Verify the actual build/function version before launch. Local validation uses Node 26 and is not a Node 24 matrix. [Supported Vercel Node versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions).
- Set `COINGECKO_API_KEY` privately in Vercel's server environment for the intended Preview/Production scope. Use a CoinGecko Demo key. Never use a `VITE_` prefix, put the value in `vercel.json`, expose it in logs, or add a client build replacement. Vite's existing local adapter reads the unprefixed key without exporting it to browser code.
- Review ingress limits and budget alerts. Cache (128 entries), concurrency (four upstream calls) and quota (30 calls/minute) are per warm instance, not global across cold starts or regions.
- Review current account/provider limits and run a Vercel preview build and the acceptance matrix below before production. No project linking, environment upload, preview deployment or production deployment was done by this change.

`.vercel/`, real environment files, dependencies and `dist` are ignored. Publish through Vercel's project build, not by uploading `dist` alone: the latter omits the crypto function.

## Routing acceptance matrix

| Request                                                                               | Expected behavior                                           |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| `/`, `/weather`, `/currencies`, `/economy`, `/crypto`, `/crypto/bitcoin`, `/settings` | App shell on direct navigation/refresh; correct client view |
| `/dashboard`                                                                          | Client redirect to `/`                                      |
| `/not-a-route`                                                                        | Client Not Found view                                       |
| Existing `/assets/*`, `/favicon.svg`, `/theme.js`                                     | Actual file, correct content type                           |
| Missing `/assets/*`                                                                   | 404, no successful HTML fallback                            |
| `/api/crypto/global` with a valid key                                                 | Validated JSON; browser sends no provider credential        |
| Same request without a key                                                            | Safe 503 JSON                                               |
| `/api/crypto/coins/bitcoin/history?period=1Y&currency=usd`                            | History JSON; upstream uses 365 days                        |
| `/api/crypto/unknown`, `/api/unknown`, unsupported/duplicate query parameters         | Safe 400 JSON                                               |
| POST to a crypto endpoint                                                             | Safe 405 JSON                                               |
| Provider throttling                                                                   | 429 JSON and Retry-After header                             |

Offline tests cover the adapter with MSW and model the committed routing order. They do not certify Vercel's deployed ingress, function bundle, environment configuration, live credentials or browser rendering. Record those separately using [release checks](RELEASE_CHECKLIST.md).

## Publish and roll back

The owner reviews/commits/pushes the change, configures the project and secret, and deploys. Verify all four providers independently over HTTPS, then record the actual live URL and capture [screenshots](SCREENSHOTS.md).

Keep previous frontend/function deployment identifiers. If smoke checks fail, restore the previous matching pair and rerun critical API/deep-link checks. Environment settings are separate; never restore revoked credentials. No database migration is involved. See [verification evidence](VERCEL_VERIFICATION.md).
