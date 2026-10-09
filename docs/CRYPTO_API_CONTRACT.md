# Cryptocurrency API contract

Phase 5 uses CoinGecko Demo through a same-origin server boundary. React never receives a provider key. No new dependencies are required.

## Application endpoints (GET only)

| Local route                     | Allowed query                             | Fixed provider request                                   |
| ------------------------------- | ----------------------------------------- | -------------------------------------------------------- |
| `/api/crypto/global`            | none                                      | `/global`                                                |
| `/api/crypto/markets`           | `currency=usd`                            | `/coins/markets`, page 1, 50 rows, market-cap descending |
| `/api/crypto/coins/:id`         | `currency=usd`                            | `/coins/markets`, exact `ids` filter                     |
| `/api/crypto/coins/:id/history` | `currency=usd`, `period=24H\|7D\|30D\|1Y` | `/coins/:id/market_chart`, days 1/7/30/365               |

Unknown/duplicate query parameters, unsupported currencies, malformed IDs, and non-GET methods are rejected. IDs are 1–100 lowercase ASCII letters, digits, underscores or hyphens, starting with a letter or digit. No caller-supplied URL, host, headers, interval or pagination is forwarded. Upstream redirects are rejected.

Provider data is validated with Zod on the server, stripped to used fields, then validated and normalized again by the frontend. Nullable metrics remain null; ranks are never generated. Millisecond history tuples become ordered observations; duplicate timestamps retain the final provider observation, null gaps remain gaps. Provider seconds in global timestamps are converted to milliseconds. Invalid dates and nonfinite numbers are rejected.

Errors use a fixed safe `{ error: { code, message } }` envelope: 400 invalid input or unsupported route, 404 unknown asset, 405 method, 503 missing configuration, 502 authentication/provider/invalid data, 429 throttling, 504 timeout. No upstream error body or exception text is returned. The frontend maps trusted codes to its own messages.

## Provider evidence and limits

Verified against official documentation on 2026-10-01:

- [Demo authentication](https://docs.coingecko.com/demo/reference/authentication): root `https://api.coingecko.com/api/v3`; server-only `x-cg-demo-api-key` header.
- [Markets](https://docs.coingecko.com/demo/reference/coins-markets): `ids` uniquely identifies assets, nullable metrics, `page`/`per_page`, full precision.
- [History](https://docs.coingecko.com/demo/reference/coins-id-market-chart): Demo history is restricted to the past 365 days. Automatic granularity: 1 day roughly five-minute, 2–90 days hourly, over 90 days daily at UTC midnight. No forced interval or MAX; actual timestamps are retained.
- [Global](https://docs.coingecko.com/demo/reference/crypto-global): USD market cap/volume, BTC/ETH dominance, provider update timestamp.
- [Supported currencies](https://docs.coingecko.com/demo/reference/simple-supported-currencies) was inspected. This initial implementation deliberately uses USD only; FX conversion remains in Currencies.
- [Pricing](https://www.coingecko.com/en/api/pricing): Demo currently lists 100 calls/minute and 10,000 credits/month; one request consumes a credit. Account limits can change. Attribution is required and included in the UI.

## Local runtime and deployment boundary

Copy `.env.example` to `.env.local`, set `COINGECKO_API_KEY` privately, and restart `npm run dev`. Do not prefix the key with `VITE_`. Vite's server-only plugin reads this value; no `define` or client environment injection is used. `npm run preview` includes the same local proxy. A missing key produces an explicit setup error, never fabricated data.

`server/crypto/proxy.ts` exports a deployment-neutral Fetch Request → Response handler. `server/crypto/vite.ts` adapts it to Vite's Node middleware. Production deployment must mount this handler at `/api/crypto/*` in a server/serverless runtime and configure the secret there; static `dist/` hosting alone cannot provide crypto data. Vite preview is not a production server. Deployment remains user-owned.

## Credit conservation

No polling or focus refetch. Server TTLs are 60 seconds for markets, 120 seconds for global, and five minutes for history. In-flight identical requests coalesce; cache is bounded to 128 entries. Per-process upstream requests are capped at 30/minute with at most four in flight. Provider 429 starts a shared cooldown (bounded Retry-After or 60 seconds). Frontend retries are manual to avoid hidden credit consumption. Refresh can reuse the server cache and does not promise a newer provider timestamp.

The cache and budget are per process, not distributed. A public production deployment needs an ingress rate limit/shared budget appropriate to its traffic and account credits. Client cancellation aborts its same-origin fetch; a coalesced upstream request has its own 15-second deadline so one disconnected viewer cannot cancel other viewers' work.
